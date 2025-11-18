/**
 * Auto-Transcription Service - Phase 6.2: Export & Intégration
 *
 * Automatically creates transcriptions when Listen sessions end
 * Sends notifications to user
 */

const { Notification } = require('electron');
const transcriptionService = require('./transcriptionService');
const sttRepository = require('../stt/repositories');
const sessionRepository = require('../../common/repositories/session');

class AutoTranscriptionService {
    constructor() {
        this.enabled = true;
        this.minSegments = 5; // Minimum segments to create transcription
        console.log('[AutoTranscriptionService] Service initialized');
    }

    /**
     * Enable/disable auto-transcription
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        console.log(`[AutoTranscriptionService] Auto-transcription ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Handle session end - create transcription automatically
     * @param {string} sessionId - Session ID
     * @param {string} uid - User ID
     * @returns {Promise<Object|null>} Created transcription or null
     */
    async handleSessionEnd(sessionId, uid) {
        if (!this.enabled) {
            console.log('[AutoTranscriptionService] Auto-transcription disabled, skipping');
            return null;
        }

        console.log(`[AutoTranscriptionService] Handling session end: ${sessionId}`);

        try {
            // 1. Get transcript segments
            const transcriptSegments = await sttRepository.getAllTranscriptsBySessionId(sessionId);

            if (!transcriptSegments || transcriptSegments.length === 0) {
                console.log('[AutoTranscriptionService] No transcript segments found, skipping');
                return null;
            }

            if (transcriptSegments.length < this.minSegments) {
                console.log(`[AutoTranscriptionService] Only ${transcriptSegments.length} segments (minimum ${this.minSegments}), skipping`);
                return null;
            }

            // 2. Check if transcription already exists
            const existing = transcriptionService.getBySessionId(sessionId);
            if (existing) {
                console.log('[AutoTranscriptionService] Transcription already exists, skipping');
                return existing;
            }

            // 3. Create transcription
            console.log(`[AutoTranscriptionService] Creating transcription from ${transcriptSegments.length} segments`);

            const transcription = await transcriptionService.createFromTranscripts({
                uid,
                sessionId,
                transcriptSegments,
                options: {
                    tags: ['auto-saved', 'listen']
                }
            });

            console.log(`[AutoTranscriptionService] ✅ Transcription created: ${transcription.id}`);

            // 4. Send notification
            this.sendNotification({
                title: 'Transcription sauvegardée',
                body: `"${transcription.title}" a été créée automatiquement`,
                transcriptionId: transcription.id
            });

            return transcription;

        } catch (error) {
            console.error('[AutoTranscriptionService] Error creating transcription:', error);
            return null;
        }
    }

    /**
     * Send desktop notification
     * @param {Object} options - Notification options
     */
    sendNotification({ title, body, transcriptionId }) {
        try {
            const notification = new Notification({
                title,
                body,
                silent: false,
                icon: null // Can add app icon here
            });

            notification.on('click', () => {
                console.log(`[AutoTranscriptionService] Notification clicked: ${transcriptionId}`);
                // TODO: Open transcription in TranscriptionCenter
                // This would require integration with window management
            });

            notification.show();
            console.log('[AutoTranscriptionService] Notification sent');

        } catch (error) {
            console.error('[AutoTranscriptionService] Error sending notification:', error);
        }
    }

    /**
     * Create transcription manually (can be called from UI)
     * @param {string} sessionId - Session ID
     * @param {string} uid - User ID
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Created transcription
     */
    async createManual(sessionId, uid, options = {}) {
        console.log(`[AutoTranscriptionService] Manual transcription creation for session: ${sessionId}`);

        const transcriptSegments = await sttRepository.getAllTranscriptsBySessionId(sessionId);

        if (!transcriptSegments || transcriptSegments.length === 0) {
            throw new Error('No transcript segments found for this session');
        }

        const transcription = await transcriptionService.createFromTranscripts({
            uid,
            sessionId,
            transcriptSegments,
            options: {
                ...options,
                tags: options.tags || ['manual-save', 'listen']
            }
        });

        this.sendNotification({
            title: 'Transcription créée',
            body: `"${transcription.title}"`,
            transcriptionId: transcription.id
        });

        return transcription;
    }

    /**
     * Batch create transcriptions for old sessions
     * @param {string} uid - User ID
     * @param {number} [limit=10] - Number of sessions to process
     * @returns {Promise<Array>} Created transcriptions
     */
    async batchCreate(uid, limit = 10) {
        console.log(`[AutoTranscriptionService] Batch creating transcriptions for user: ${uid}`);

        try {
            // Get recent sessions
            const sessions = await sessionRepository.getAllByUserId(uid);

            // Filter sessions that have transcripts but no transcription
            const sessionsToProcess = [];

            for (const session of sessions.slice(0, limit * 2)) { // Check more sessions
                const existing = transcriptionService.getBySessionId(session.id);
                if (!existing) {
                    const segments = await sttRepository.getAllTranscriptsBySessionId(session.id);
                    if (segments && segments.length >= this.minSegments) {
                        sessionsToProcess.push({
                            session,
                            segments
                        });

                        if (sessionsToProcess.length >= limit) {
                            break;
                        }
                    }
                }
            }

            console.log(`[AutoTranscriptionService] Processing ${sessionsToProcess.length} sessions`);

            const results = [];

            for (const { session, segments } of sessionsToProcess) {
                try {
                    const transcription = await transcriptionService.createFromTranscripts({
                        uid,
                        sessionId: session.id,
                        transcriptSegments: segments,
                        options: {
                            tags: ['batch-created', 'listen']
                        }
                    });

                    results.push(transcription);
                    console.log(`[AutoTranscriptionService] ✅ Created transcription for session: ${session.id}`);

                } catch (error) {
                    console.error(`[AutoTranscriptionService] Error creating transcription for session ${session.id}:`, error);
                }
            }

            if (results.length > 0) {
                this.sendNotification({
                    title: 'Transcriptions créées',
                    body: `${results.length} transcription(s) ont été créées à partir de vos conversations précédentes`,
                    transcriptionId: null
                });
            }

            return results;

        } catch (error) {
            console.error('[AutoTranscriptionService] Error in batch creation:', error);
            throw error;
        }
    }
}

// Singleton instance
const autoTranscriptionService = new AutoTranscriptionService();

module.exports = autoTranscriptionService;
