const { onAuthStateChanged, signInWithCustomToken, signOut } = require('firebase/auth');
const { BrowserWindow, shell } = require('electron');
const { getFirebaseAuth } = require('./firebaseClient');
const fetch = require('node-fetch');
const encryptionService = require('./encryptionService');
const migrationService = require('./migrationService');
const sessionRepository = require('../repositories/session');
const providerSettingsRepository = require('../repositories/providerSettings');
const permissionService = require('./permissionService');
const agentProfileService = require('./agentProfileService');

async function getVirtualKeyByEmail(email, idToken) {
    if (!idToken) {
        throw new Error('Firebase ID token is required for virtual key request');
    }

    const resp = await fetch('https://serverless-api-sf3o.vercel.app/api/virtual_key', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
        redirect: 'follow',
    });

    const json = await resp.json().catch(() => ({}));
    if (!resp.ok) {
        console.error('[VK] API request failed:', json.message || 'Unknown error');
        throw new Error(json.message || `HTTP ${resp.status}: Virtual key request failed`);
    }

    const vKey = json?.data?.virtualKey || json?.data?.virtual_key || json?.data?.newVKey?.slug;

    if (!vKey) throw new Error('virtual key missing in response');
    return vKey;
}

class AuthService {
    constructor() {
        this.currentUserId = 'default_user';
        this.currentUserMode = 'local'; // 'local' or 'firebase'
        this.currentUser = null;
        this.isInitialized = false;

        // This ensures the key is ready before any login/logout state change.
        this.initializationPromise = null;

        // Store unsubscribe function for Firebase auth listener
        this.authUnsubscribe = null;

        sessionRepository.setAuthService(this);
    }

    initialize() {
        if (this.isInitialized) return this.initializationPromise;

        this.initializationPromise = new Promise(async (resolve) => {
            const auth = getFirebaseAuth();

            // Handle degraded mode when Firebase is not available
            if (!auth) {
                console.log('[AuthService] Firebase not available - running in local mode');
                this.currentUser = null;
                this.currentUserId = 'default_user';
                this.currentUserMode = 'local';
                this.isInitialized = true;

                // Initialize agent profile for default user
                await agentProfileService.initialize('default_user');

                this.broadcastUserState();
                resolve();
                return;
            }

            // Store unsubscribe function for cleanup
            this.authUnsubscribe = onAuthStateChanged(auth, async (user) => {
                const previousUser = this.currentUser;

                if (user) {
                    // User signed IN
                    console.log(`[AuthService] Firebase user signed in:`, user.uid);
                    this.currentUser = user;
                    this.currentUserId = user.uid;
                    this.currentUserMode = 'firebase';

                    // Clean up any zombie sessions from a previous run for this user.
                    await sessionRepository.endAllActiveSessions();

                    // ** Initialize encryption key for the logged-in user if permissions are already granted **
                    if (process.platform === 'darwin' && !(await permissionService.checkKeychainCompleted(this.currentUserId))) {
                        console.warn('[AuthService] Keychain permission not yet completed for this user. Deferring key initialization.');
                    } else {
                        await encryptionService.initializeKey(user.uid);
                    }

                    // ** Check for and run data migration for the user **
                    // No 'await' here, so it runs in the background without blocking startup.
                    migrationService.checkAndRunMigration(user);

                    // ** Initialize agent profile service for the user **
                    await agentProfileService.initialize(user.uid);

                    // ***** CRITICAL: Wait for the virtual key and model state update to complete *****
                    try {
                        const idToken = await user.getIdToken(true);
                        const virtualKey = await getVirtualKeyByEmail(user.email, idToken);

                        if (global.modelStateService) {
                            // The model state service now writes directly to the DB, no in-memory state.
                            await global.modelStateService.setFirebaseVirtualKey(virtualKey);
                        }
                        console.log(`[AuthService] Virtual key for ${user.email} has been processed and state updated.`);

                    } catch (error) {
                        console.error('[AuthService] Failed to fetch or save virtual key:', error);
                        // This is not critical enough to halt the login, but we should log it.
                    }

                } else {
                    // User signed OUT
                    console.log(`[AuthService] No Firebase user.`);
                    if (previousUser) {
                        console.log(`[AuthService] Clearing API key for logged-out user: ${previousUser.uid}`);
                        if (global.modelStateService) {
                            // The model state service now writes directly to the DB.
                            await global.modelStateService.setFirebaseVirtualKey(null);
                        }
                    }
                    this.currentUser = null;
                    this.currentUserId = 'default_user';
                    this.currentUserMode = 'local';

                    // End active sessions for the local/default user as well.
                    await sessionRepository.endAllActiveSessions();

                    // Initialize agent profile for default user
                    await agentProfileService.initialize('default_user');

                    encryptionService.resetSessionKey();
                }
                this.broadcastUserState();
                
                if (!this.isInitialized) {
                    this.isInitialized = true;
                    console.log('[AuthService] Initialized and resolved initialization promise.');
                    resolve();
                }
            });
        });

        return this.initializationPromise;
    }

    async startFirebaseAuthFlow() {
        try {
            const webUrl = process.env.pickleglass_WEB_URL || 'http://localhost:3000';
            const authUrl = `${webUrl}/login?mode=electron`;
            console.log(`[AuthService] Opening Firebase auth URL in browser: ${authUrl}`);
            await shell.openExternal(authUrl);
            return { success: true };
        } catch (error) {
            console.error('[AuthService] Failed to open Firebase auth URL:', error);
            return { success: false, error: error.message };
        }
    }

    async signInWithCustomToken(token) {
        const auth = getFirebaseAuth();
        if (!auth) {
            throw new Error('Firebase Auth not available - cannot sign in');
        }
        try {
            const userCredential = await signInWithCustomToken(auth, token);
            console.log(`[AuthService] Successfully signed in with custom token for user:`, userCredential.user.uid);
            // onAuthStateChanged will handle the state update and broadcast
        } catch (error) {
            console.error('[AuthService] Error signing in with custom token:', error);
            throw error; // Re-throw to be handled by the caller
        }
    }

    async signOut() {
        const auth = getFirebaseAuth();
        if (!auth) {
            console.warn('[AuthService] Firebase Auth not available - cannot sign out');
            return;
        }
        try {
            // End all active sessions for the current user BEFORE signing out.
            await sessionRepository.endAllActiveSessions();

            await signOut(auth);
            console.log('[AuthService] User sign-out initiated successfully.');
            // onAuthStateChanged will handle the state update and broadcast,
            // which will also re-evaluate the API key status.
        } catch (error) {
            console.error('[AuthService] Error signing out:', error);
        }
    }
    
    broadcastUserState() {
        const userState = this.getCurrentUser();
        console.log('[AuthService] Broadcasting user state change:', userState);
        BrowserWindow.getAllWindows().forEach(win => {
            if (win && !win.isDestroyed() && win.webContents && !win.webContents.isDestroyed()) {
                win.webContents.send('user-state-changed', userState);
            }
        });
    }

    getCurrentUserId() {
        return this.currentUserId;
    }

    getCurrentUser() {
        const isLoggedIn = !!(this.currentUserMode === 'firebase' && this.currentUser);

        if (isLoggedIn) {
            return {
                uid: this.currentUser.uid,
                email: this.currentUser.email,
                displayName: this.currentUser.displayName,
                mode: 'firebase',
                isLoggedIn: true,
                //////// before_modelStateService ////////
                // hasApiKey: this.hasApiKey // Always true for firebase users, but good practice
                //////// before_modelStateService ////////
            };
        }
        return {
            uid: this.currentUserId, // returns 'default_user'
            email: 'contact@lucide.app',
            displayName: 'Default User',
            mode: 'local',
            isLoggedIn: false,
            //////// before_modelStateService ////////
            // hasApiKey: this.hasApiKey
            //////// before_modelStateService ////////
        };
    }

    /**
     * Cleanup Firebase auth listener to prevent memory leaks
     * Should be called before app shutdown
     */
    cleanup() {
        console.log('[AuthService] Cleaning up Firebase auth listener...');

        if (this.authUnsubscribe) {
            try {
                this.authUnsubscribe();
                this.authUnsubscribe = null;
                console.log('[AuthService] Firebase auth listener unsubscribed');
            } catch (error) {
                console.error('[AuthService] Error unsubscribing Firebase auth listener:', error);
            }
        }
    }
}

const authService = new AuthService();
module.exports = authService; 