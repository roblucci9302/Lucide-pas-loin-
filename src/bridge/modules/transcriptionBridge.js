/**
 * Transcription Bridge - Phase 6: Transcription Center
 * IPC handlers for transcription management and meeting minutes generation
 */

const { ipcMain } = require('electron');
const transcriptionService = require('../../features/listen/transcription/transcriptionService');
const meetingReportService = require('../../features/listen/transcription/meetingReportService');
const sttRepository = require('../../features/listen/stt/repositories');
const sessionRepository = require('../../features/common/repositories/session');

module.exports = {
    /**
     * Initialize all IPC handlers for transcriptions
     */
    initialize() {
        console.log('[TranscriptionBridge] Initializing IPC handlers...');

        /**
         * List transcriptions for current user
         * @param {Object} options - Pagination and filtering options
         * @returns {Object} List of transcriptions
         */
        ipcMain.handle('transcription:list', async (event, options = {}) => {
            try {
                const userId = await sessionRepository.getCurrentUserId();
                if (!userId) {
                    throw new Error('User not authenticated');
                }

                const {
                    limit = 50,
                    offset = 0,
                    orderBy = 'start_at',
                    orderDir = 'DESC'
                } = options;

                const transcriptions = transcriptionService.listTranscriptions(userId, {
                    limit,
                    offset,
                    orderBy,
                    orderDir
                });

                const total = transcriptionService.getCount(userId);

                return {
                    success: true,
                    transcriptions,
                    total,
                    hasMore: (offset + limit) < total
                };
            } catch (error) {
                console.error('[TranscriptionBridge] Error listing transcriptions:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        /**
         * Get a single transcription by ID with all details
         * @param {string} transcriptionId - Transcription ID
         * @returns {Object} Transcription with segments, insights, and notes
         */
        ipcMain.handle('transcription:get', async (event, { transcriptionId }) => {
            try {
                const userId = await sessionRepository.getCurrentUserId();
                if (!userId) {
                    throw new Error('User not authenticated');
                }

                const transcription = transcriptionService.getById(transcriptionId);

                if (!transcription) {
                    throw new Error(`Transcription not found: ${transcriptionId}`);
                }

                // Verify ownership
                if (transcription.uid !== userId) {
                    throw new Error('Unauthorized access to transcription');
                }

                return {
                    success: true,
                    transcription
                };
            } catch (error) {
                console.error('[TranscriptionBridge] Error getting transcription:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        /**
         * Get transcription by session ID
         * @param {string} sessionId - Session ID
         * @returns {Object} Transcription if exists
         */
        ipcMain.handle('transcription:get-by-session', async (event, { sessionId }) => {
            try {
                const userId = await sessionRepository.getCurrentUserId();
                if (!userId) {
                    throw new Error('User not authenticated');
                }

                const transcription = transcriptionService.getBySessionId(sessionId);

                if (!transcription) {
                    return {
                        success: true,
                        transcription: null
                    };
                }

                // Verify ownership
                if (transcription.uid !== userId) {
                    throw new Error('Unauthorized access to transcription');
                }

                return {
                    success: true,
                    transcription
                };
            } catch (error) {
                console.error('[TranscriptionBridge] Error getting transcription by session:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        /**
         * Create a transcription from existing transcript segments
         * @param {string} sessionId - Session ID
         * @param {Object} options - Additional options
         * @returns {Object} Created transcription
         */
        ipcMain.handle('transcription:create-from-session', async (event, { sessionId, options = {} }) => {
            try {
                const userId = await sessionRepository.getCurrentUserId();
                if (!userId) {
                    throw new Error('User not authenticated');
                }

                // Get transcript segments from old transcripts table
                const transcriptSegments = await sttRepository.getAllTranscriptsBySessionId(sessionId);

                if (!transcriptSegments || transcriptSegments.length === 0) {
                    throw new Error('No transcript segments found for this session');
                }

                // Create transcription
                const transcription = await transcriptionService.createFromTranscripts({
                    uid: userId,
                    sessionId,
                    transcriptSegments,
                    options
                });

                return {
                    success: true,
                    transcription
                };
            } catch (error) {
                console.error('[TranscriptionBridge] Error creating transcription:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        /**
         * Search transcriptions
         * @param {string} searchTerm - Search term
         * @param {Object} options - Search options
         * @returns {Object} Search results
         */
        ipcMain.handle('transcription:search', async (event, { searchTerm, options = {} }) => {
            try {
                const userId = await sessionRepository.getCurrentUserId();
                if (!userId) {
                    throw new Error('User not authenticated');
                }

                const { limit = 20 } = options;

                const results = transcriptionService.searchTranscriptions(userId, searchTerm, {
                    limit
                });

                return {
                    success: true,
                    results,
                    count: results.length
                };
            } catch (error) {
                console.error('[TranscriptionBridge] Error searching transcriptions:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        /**
         * Update a transcription
         * @param {string} transcriptionId - Transcription ID
         * @param {Object} updates - Fields to update
         * @returns {Object} Success status
         */
        ipcMain.handle('transcription:update', async (event, { transcriptionId, updates }) => {
            try {
                const userId = await sessionRepository.getCurrentUserId();
                if (!userId) {
                    throw new Error('User not authenticated');
                }

                // Verify ownership
                const transcription = transcriptionService.getById(transcriptionId);
                if (!transcription || transcription.uid !== userId) {
                    throw new Error('Unauthorized access to transcription');
                }

                const success = transcriptionService.updateTranscription(transcriptionId, updates);

                return {
                    success,
                    transcription: transcriptionService.getById(transcriptionId)
                };
            } catch (error) {
                console.error('[TranscriptionBridge] Error updating transcription:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        /**
         * Delete a transcription
         * @param {string} transcriptionId - Transcription ID
         * @returns {Object} Success status
         */
        ipcMain.handle('transcription:delete', async (event, { transcriptionId }) => {
            try {
                const userId = await sessionRepository.getCurrentUserId();
                if (!userId) {
                    throw new Error('User not authenticated');
                }

                // Verify ownership
                const transcription = transcriptionService.getById(transcriptionId);
                if (!transcription || transcription.uid !== userId) {
                    throw new Error('Unauthorized access to transcription');
                }

                const success = transcriptionService.deleteTranscription(transcriptionId);

                return {
                    success
                };
            } catch (error) {
                console.error('[TranscriptionBridge] Error deleting transcription:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        /**
         * Get statistics for user's transcriptions
         * @returns {Object} Statistics
         */
        ipcMain.handle('transcription:get-statistics', async () => {
            try {
                const userId = await sessionRepository.getCurrentUserId();
                if (!userId) {
                    throw new Error('User not authenticated');
                }

                const statistics = transcriptionService.getStatistics(userId);

                return {
                    success: true,
                    statistics
                };
            } catch (error) {
                console.error('[TranscriptionBridge] Error getting statistics:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        // ====== Meeting Minutes / Reports ======

        /**
         * Generate meeting minutes from a transcription
         * @param {string} transcriptionId - Transcription ID
         * @param {Object} options - Generation options
         * @returns {Object} Generated report info
         */
        ipcMain.handle('transcription:generate-meeting-minutes', async (event, { transcriptionId, options = {} }) => {
            try {
                const userId = await sessionRepository.getCurrentUserId();
                if (!userId) {
                    throw new Error('User not authenticated');
                }

                // Verify ownership
                const transcription = transcriptionService.getById(transcriptionId);
                if (!transcription || transcription.uid !== userId) {
                    throw new Error('Unauthorized access to transcription');
                }

                const {
                    format = 'markdown',
                    language = 'en'
                } = options;

                const result = await meetingReportService.generateMeetingMinutes({
                    transcriptionId,
                    uid: userId,
                    format,
                    language
                });

                return {
                    success: true,
                    ...result
                };
            } catch (error) {
                console.error('[TranscriptionBridge] Error generating meeting minutes:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        // ====== Notes Management ======

        /**
         * Add a note to a transcription
         * @param {string} transcriptionId - Transcription ID
         * @param {Object} note - Note data
         * @returns {Object} Created note
         */
        ipcMain.handle('transcription:add-note', async (event, { transcriptionId, note }) => {
            try {
                const userId = await sessionRepository.getCurrentUserId();
                if (!userId) {
                    throw new Error('User not authenticated');
                }

                // Verify ownership
                const transcription = transcriptionService.getById(transcriptionId);
                if (!transcription || transcription.uid !== userId) {
                    throw new Error('Unauthorized access to transcription');
                }

                const createdNote = transcriptionService.addNote(transcriptionId, {
                    ...note,
                    uid: userId,
                    createdBy: userId
                });

                return {
                    success: true,
                    note: createdNote
                };
            } catch (error) {
                console.error('[TranscriptionBridge] Error adding note:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        /**
         * Update a note
         * @param {string} noteId - Note ID
         * @param {Object} updates - Fields to update
         * @returns {Object} Success status
         */
        ipcMain.handle('transcription:update-note', async (event, { noteId, updates }) => {
            try {
                const userId = await sessionRepository.getCurrentUserId();
                if (!userId) {
                    throw new Error('User not authenticated');
                }

                // TODO: Verify ownership of note
                const success = transcriptionService.updateNote(noteId, updates);

                return {
                    success
                };
            } catch (error) {
                console.error('[TranscriptionBridge] Error updating note:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        /**
         * Delete a note
         * @param {string} noteId - Note ID
         * @returns {Object} Success status
         */
        ipcMain.handle('transcription:delete-note', async (event, { noteId }) => {
            try {
                const userId = await sessionRepository.getCurrentUserId();
                if (!userId) {
                    throw new Error('User not authenticated');
                }

                // TODO: Verify ownership of note
                const success = transcriptionService.deleteNote(noteId);

                return {
                    success
                };
            } catch (error) {
                console.error('[TranscriptionBridge] Error deleting note:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        console.log('[TranscriptionBridge] IPC handlers initialized successfully (13 handlers)');
    }
};
