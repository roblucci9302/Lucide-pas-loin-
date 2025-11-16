require('dotenv').config();

if (require('electron-squirrel-startup')) {
    process.exit(0);
}

const { app, BrowserWindow, shell, ipcMain, dialog, desktopCapturer, session } = require('electron');
const { createWindows } = require('./window/windowManager.js');
const listenService = require('./features/listen/listenService');
const { initializeFirebase } = require('./features/common/services/firebaseClient');
const databaseInitializer = require('./features/common/services/databaseInitializer');
const authService = require('./features/common/services/authService');
const path = require('node:path');
const { autoUpdater } = require('electron-updater');
const { EventEmitter } = require('events');
const askService = require('./features/ask/askService');
const settingsService = require('./features/settings/settingsService');
const sessionRepository = require('./features/common/repositories/session');
const modelStateService = require('./features/common/services/modelStateService');
const featureBridge = require('./bridge/featureBridge');
const windowBridge = require('./bridge/windowBridge');

// Phase 4: Knowledge Base services
const { createGenericRepository } = require('./features/common/repositories/genericRepository');
const documentService = require('./features/common/services/documentService');
const indexingService = require('./features/common/services/indexingService');
const ragService = require('./features/common/services/ragService');
const { EmbeddingProviderFactory } = require('./features/common/services/embeddingProvider');

// Phase WOW 1: User Profiles & Onboarding
const userProfileService = require('./features/common/services/userProfileService');
const agentProfileService = require('./features/common/services/agentProfileService');
const profileThemeService = require('./features/common/services/profileThemeService');

// Global variables
const eventBridge = new EventEmitter();
let isShuttingDown = false; // Flag to prevent infinite shutdown loop

//////// after_modelStateService ////////
global.modelStateService = modelStateService;
//////// after_modelStateService ////////

// Import and initialize OllamaService
const ollamaService = require('./features/common/services/ollamaService');
const ollamaModelRepository = require('./features/common/repositories/ollamaModel');
const localAIManager = require('./features/common/services/localAIManager');

// Native deep link handling - cross-platform compatible
let pendingDeepLinkUrl = null;

function setupProtocolHandling() {
    try {
        if (!app.isDefaultProtocolClient('lucide')) {
            const success = app.setAsDefaultProtocolClient('lucide');
            if (success) {
                console.log('[Protocol] Successfully set as default protocol client for lucide://');
            } else {
                console.warn('[Protocol] Failed to set as default protocol client - this may affect deep linking');
            }
        } else {
            console.log('[Protocol] Already registered as default protocol client for lucide://');
        }
    } catch (error) {
        console.error('[Protocol] Error during protocol registration:', error);
    }
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
    process.exit(0);
}

// setup protocol after single instance lock
setupProtocolHandling();

app.whenReady().then(async () => {
    // Setup native loopback audio capture for Windows
    session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
        desktopCapturer.getSources({ types: ['screen'] }).then((sources) => {
            callback({ video: sources[0], audio: 'loopback' });
        }).catch((error) => {
            console.error('Failed to get desktop capturer sources:', error);
            callback({});
        });
    });

    // Initialize core services
    initializeFirebase();

    let initializationSuccessful = true;

    try {
        await databaseInitializer.initialize();
        console.log('>>> [index.js] Database initialized successfully');

        await authService.initialize();

        //////// after_modelStateService ////////
        await modelStateService.initialize();
        //////// after_modelStateService ////////

        // Phase WOW 1: Initialize User Profile service
        console.log('[index.js] Initializing Phase WOW 1: User Profiles & Onboarding...');
        try {
            const currentUser = authService.getCurrentUser();
            if (currentUser && currentUser.uid) {
                await userProfileService.initialize(currentUser.uid);
                console.log('[index.js] User Profile service initialized for uid:', currentUser.uid);

                // Initialize theme service with current profile
                const currentProfile = userProfileService.getCurrentProfile();
                const activeProfile = currentProfile?.active_profile || 'lucide_assistant';
                profileThemeService.initialize(activeProfile);
                console.log('[index.js] Theme service initialized with profile:', activeProfile);
            } else {
                console.log('[index.js] No user logged in, skipping user profile initialization');
                // Still initialize theme service with default profile
                profileThemeService.initialize('lucide_assistant');
                console.log('[index.js] Theme service initialized with default profile');
            }
        } catch (profileError) {
            console.error('[index.js] Error initializing user profile service:', profileError);
            // Non-critical - app can continue without profile features
            // Still try to initialize theme service with default
            try {
                profileThemeService.initialize('lucide_assistant');
                console.log('[index.js] Theme service initialized with default profile (fallback)');
            } catch (themeError) {
                console.error('[index.js] Error initializing theme service:', themeError);
            }
        }

        // Phase 4: Initialize Knowledge Base services
        console.log('[index.js] Initializing Phase 4: Knowledge Base services...');
        try {
            // Create repositories for Phase 4 tables
            const documentsRepository = createGenericRepository('documents');
            const chunksRepository = createGenericRepository('document_chunks');
            const citationsRepository = createGenericRepository('document_citations');

            // Initialize services with repositories
            documentService.initialize(documentsRepository, chunksRepository);
            indexingService.initialize(chunksRepository);
            ragService.initialize(citationsRepository);

            // Set up embedding provider (auto-detects OpenAI key or uses mock)
            const embeddingProvider = EmbeddingProviderFactory.createAuto();
            indexingService.setEmbeddingProvider(embeddingProvider);

            console.log('[index.js] Phase 4 services initialized successfully');
        } catch (phase4Error) {
            console.error('[index.js] Error initializing Phase 4 services:', phase4Error);
            // Non-critical - app can continue without knowledge base features
        }

        featureBridge.initialize();
        windowBridge.initialize();

        // Initialize Ollama models in database
        await ollamaModelRepository.initializeDefaultModels();

        // Auto warm-up selected Ollama model in background (non-blocking)
        setTimeout(async () => {
            try {
                console.log('[index.js] Starting background Ollama model warm-up...');
                await ollamaService.autoWarmUpSelectedModel();
            } catch (error) {
                console.log('[index.js] Background warm-up failed (non-critical):', error.message);
            }
        }, 2000);

    } catch (err) {
        console.error('>>> [index.js] Initialization failed - starting in degraded mode', err);
        initializationSuccessful = false;
    }

    // ALWAYS create windows, even if initialization failed
    createWindows();

    // Show warning dialog AFTER windows are created if there were errors
    if (!initializationSuccessful) {
        setTimeout(() => {
            dialog.showMessageBox({
                type: 'warning',
                title: 'Initialization Warning',
                message: 'Some services failed to initialize. The application is running in degraded mode.',
                detail: 'Core features should work, but some advanced features may be unavailable.',
                buttons: ['OK']
            });
        }, 1000);
    }

    // initAutoUpdater should be called after auth is initialized
    initAutoUpdater();
});

app.on('before-quit', async (event) => {
    if (isShuttingDown) {
        console.log('[Shutdown] 🔄 Shutdown already in progress, allowing quit...');
        return;
    }
    
    console.log('[Shutdown] App is about to quit. Starting graceful shutdown...');
    
    isShuttingDown = true;
    
    event.preventDefault();
    
    try {
        await listenService.closeSession();
        console.log('[Shutdown] Audio capture stopped');
        
        try {
            await sessionRepository.endAllActiveSessions();
            console.log('[Shutdown] Active sessions ended');
        } catch (dbError) {
            console.warn('[Shutdown] Could not end active sessions (database may be closed):', dbError.message);
        }
        
        console.log('[Shutdown] shutting down LocalAI services...');
        try {
            await localAIManager.shutdown();
            console.log('[Shutdown] LocalAI services shut down');
        } catch (localAIError) {
            console.warn('[Shutdown] Error shutting down LocalAI services:', localAIError.message);
        }

        console.log('[Shutdown] shutting down Ollama service...');
        const ollamaShutdownSuccess = await Promise.race([
            ollamaService.shutdown(false),
            new Promise(resolve => setTimeout(() => resolve(false), 8000))
        ]);

        if (ollamaShutdownSuccess) {
            console.log('[Shutdown] Ollama service shut down gracefully');
        } else {
            console.log('[Shutdown] Ollama shutdown timeout, forcing...');
            try {
                await ollamaService.shutdown(true);
            } catch (forceShutdownError) {
                console.warn('[Shutdown] Force shutdown also failed:', forceShutdownError.message);
            }
        }

        console.log('[Shutdown] Cleaning up event listeners and services...');
        try {
            featureBridge.cleanup();
            authService.cleanup();
            modelStateService.cleanup();
            console.log('[Shutdown] Event listeners and services cleaned up');
        } catch (cleanupError) {
            console.warn('[Shutdown] Error during cleanup:', cleanupError.message);
        }

        try {
            databaseInitializer.close();
            console.log('[Shutdown] Database connections closed');
        } catch (closeError) {
            console.warn('[Shutdown] Error closing database:', closeError.message);
        }
        
        console.log('[Shutdown] Graceful shutdown completed successfully');
        
    } catch (error) {
        console.error('[Shutdown] Error during graceful shutdown:', error);
    } finally {
        console.log('[Shutdown] Exiting application...');
        app.exit(0);
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindows();
    }
});

// Auto-update initialization
async function initAutoUpdater() {
    if (process.env.NODE_ENV === 'development') {
        console.log('Development environment, skipping auto-updater.');
        return;
    }

    try {
        await autoUpdater.checkForUpdates();
        autoUpdater.on('update-available', () => {
            console.log('Update available!');
            autoUpdater.downloadUpdate();
        });
        autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName, date, url) => {
            console.log('Update downloaded:', releaseNotes, releaseName, date, url);
            dialog.showMessageBox({
                type: 'info',
                title: 'Application Update',
                message: `A new version of Lucide (${releaseName}) has been downloaded. It will be installed the next time you launch the application.`,
                buttons: ['Restart', 'Later']
            }).then(response => {
                if (response.response === 0) {
                    autoUpdater.quitAndInstall();
                }
            });
        });
        autoUpdater.on('error', (err) => {
            console.error('Error in auto-updater:', err);
        });
    } catch (err) {
        console.error('Error initializing auto-updater:', err);
    }
}