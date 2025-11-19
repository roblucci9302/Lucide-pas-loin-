/**
 * Transcription Bridge - Phase 6: Transcription Center
 * IPC handlers for transcription management and meeting minutes generation
 */

const { ipcMain } = require('electron');
const transcriptionService = require('../../features/listen/transcription/transcriptionService');
const meetingReportService = require('../../features/listen/transcription/meetingReportService');
const autoTranscriptionService = require('../../features/listen/transcription/autoTranscriptionService');
const transcriptionEditService = require('../../features/listen/transcription/transcriptionEditService');
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

        // ====== Auto-Transcription ======

        /**
         * Handle session end - auto-create transcription
         * @param {string} sessionId - Session ID
         * @returns {Object} Created transcription or null
         */
        ipcMain.handle('transcription:auto-create-on-session-end', async (event, { sessionId }) => {
            try {
                const userId = await sessionRepository.getCurrentUserId();
                if (!userId) {
                    throw new Error('User not authenticated');
                }

                const transcription = await autoTranscriptionService.handleSessionEnd(sessionId, userId);

                return {
                    success: true,
                    transcription
                };
            } catch (error) {
                console.error('[TranscriptionBridge] Error auto-creating transcription:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        /**
         * Manually create transcription from session
         * @param {string} sessionId - Session ID
         * @param {Object} options - Additional options
         * @returns {Object} Created transcription
         */
        ipcMain.handle('transcription:create-manual', async (event, { sessionId, options = {} }) => {
            try {
                const userId = await sessionRepository.getCurrentUserId();
                if (!userId) {
                    throw new Error('User not authenticated');
                }

                const transcription = await autoTranscriptionService.createManual(sessionId, userId, options);

                return {
                    success: true,
                    transcription
                };
            } catch (error) {
                console.error('[TranscriptionBridge] Error creating manual transcription:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        /**
         * Batch create transcriptions for past sessions
         * @param {number} limit - Number of sessions to process
         * @returns {Object} Results
         */
        ipcMain.handle('transcription:batch-create', async (event, { limit = 10 }) => {
            try {
                const userId = await sessionRepository.getCurrentUserId();
                if (!userId) {
                    throw new Error('User not authenticated');
                }

                const transcriptions = await autoTranscriptionService.batchCreate(userId, limit);

                return {
                    success: true,
                    transcriptions,
                    count: transcriptions.length
                };
            } catch (error) {
                console.error('[TranscriptionBridge] Error batch creating transcriptions:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        /**
         * Enable/disable auto-transcription
         * @param {boolean} enabled
         * @returns {Object} Success status
         */
        ipcMain.handle('transcription:set-auto-enabled', async (event, { enabled }) => {
            try {
                autoTranscriptionService.setEnabled(enabled);

                return {
                    success: true,
                    enabled
                };
            } catch (error) {
                console.error('[TranscriptionBridge] Error setting auto-transcription:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        // ====== Editing (Phase 6.3) ======

        /**
         * Update segment text
         * @param {string} segmentId - Segment ID
         * @param {string} newText - New text
         * @param {string} transcriptionId - Transcription ID
         * @returns {Object} Updated segment
         */
        ipcMain.handle('transcription:edit-segment', async (event, { segmentId, newText, transcriptionId }) => {
            try {
                const userId = await sessionRepository.getCurrentUserId();
                if (!userId) {
                    throw new Error('User not authenticated');
                }

                const segment = transcriptionEditService.updateSegmentText(segmentId, newText, transcriptionId);

                return {
                    success: true,
                    segment
                };
            } catch (error) {
                console.error('[TranscriptionBridge] Error editing segment:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        /**
         * Merge two segments
         * @param {string} segmentId1 - First segment ID
         * @param {string} segmentId2 - Second segment ID
         * @param {string} transcriptionId - Transcription ID
         * @returns {Object} Merged segment
         */
        ipcMain.handle('transcription:merge-segments', async (event, { segmentId1, segmentId2, transcriptionId }) => {
            try {
                const userId = await sessionRepository.getCurrentUserId();
                if (!userId) {
                    throw new Error('User not authenticated');
                }

                const segment = transcriptionEditService.mergeSegments(segmentId1, segmentId2, transcriptionId);

                return {
                    success: true,
                    segment
                };
            } catch (error) {
                console.error('[TranscriptionBridge] Error merging segments:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        /**
         * Split a segment
         * @param {string} segmentId - Segment ID
         * @param {number} splitPosition - Position to split at
         * @param {string} transcriptionId - Transcription ID
         * @returns {Array} Two new segments
         */
        ipcMain.handle('transcription:split-segment', async (event, { segmentId, splitPosition, transcriptionId }) => {
            try {
                const userId = await sessionRepository.getCurrentUserId();
                if (!userId) {
                    throw new Error('User not authenticated');
                }

                const segments = transcriptionEditService.splitSegment(segmentId, splitPosition, transcriptionId);

                return {
                    success: true,
                    segments
                };
            } catch (error) {
                console.error('[TranscriptionBridge] Error splitting segment:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        /**
         * Rename a speaker
         * @param {string} transcriptionId - Transcription ID
         * @param {string} oldName - Old speaker name
         * @param {string} newName - New speaker name
         * @returns {number} Number of segments updated
         */
        ipcMain.handle('transcription:rename-speaker', async (event, { transcriptionId, oldName, newName }) => {
            try {
                const userId = await sessionRepository.getCurrentUserId();
                if (!userId) {
                    throw new Error('User not authenticated');
                }

                const count = transcriptionEditService.renameSpeaker(transcriptionId, oldName, newName);

                return {
                    success: true,
                    count
                };
            } catch (error) {
                console.error('[TranscriptionBridge] Error renaming speaker:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        /**
         * Merge two speakers
         * @param {string} transcriptionId - Transcription ID
         * @param {string} speaker1 - Primary speaker
         * @param {string} speaker2 - Secondary speaker (will be merged into speaker1)
         * @returns {number} Number of segments updated
         */
        ipcMain.handle('transcription:merge-speakers', async (event, { transcriptionId, speaker1, speaker2 }) => {
            try {
                const userId = await sessionRepository.getCurrentUserId();
                if (!userId) {
                    throw new Error('User not authenticated');
                }

                const count = transcriptionEditService.mergeSpeakers(transcriptionId, speaker1, speaker2);

                return {
                    success: true,
                    count
                };
            } catch (error) {
                console.error('[TranscriptionBridge] Error merging speakers:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        /**
         * Undo last edit
         * @param {string} transcriptionId - Transcription ID
         * @returns {Object} Undone action or null
         */
        ipcMain.handle('transcription:undo', async (event, { transcriptionId }) => {
            try {
                const userId = await sessionRepository.getCurrentUserId();
                if (!userId) {
                    throw new Error('User not authenticated');
                }

                const action = transcriptionEditService.undo(transcriptionId);

                return {
                    success: true,
                    action
                };
            } catch (error) {
                console.error('[TranscriptionBridge] Error undoing:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        /**
         * Get speakers list
         * @param {string} transcriptionId - Transcription ID
         * @returns {Array} List of speakers
         */
        ipcMain.handle('transcription:get-speakers', async (event, { transcriptionId }) => {
            try {
                const userId = await sessionRepository.getCurrentUserId();
                if (!userId) {
                    throw new Error('User not authenticated');
                }

                const speakers = transcriptionEditService.getSpeakers(transcriptionId);
                const counts = transcriptionEditService.getSegmentCountBySpeaker(transcriptionId);

                return {
                    success: true,
                    speakers,
                    counts
                };
            } catch (error) {
                console.error('[TranscriptionBridge] Error getting speakers:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        // ====== AI Processing Tools (Phase 6.4) ======

        const transcriptionProcessingService = require('../../features/listen/transcription/transcriptionProcessingService');

        /**
         * Summarize selected text
         * @param {string} text - Text to summarize
         * @param {Object} options - Summarization options
         * @returns {Object} Summary result
         */
        ipcMain.handle('transcription:summarize-selection', async (event, { text, options = {} }) => {
            try {
                const userId = await sessionRepository.getCurrentUserId();
                if (!userId) {
                    throw new Error('User not authenticated');
                }

                const result = await transcriptionProcessingService.summarizeSelection(text, options);

                return result;
            } catch (error) {
                console.error('[TranscriptionBridge] Error summarizing selection:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        /**
         * Expand/develop selected text
         * @param {string} text - Text to expand
         * @param {Object} options - Expansion options
         * @returns {Object} Expanded text
         */
        ipcMain.handle('transcription:expand-selection', async (event, { text, options = {} }) => {
            try {
                const userId = await sessionRepository.getCurrentUserId();
                if (!userId) {
                    throw new Error('User not authenticated');
                }

                const result = await transcriptionProcessingService.expandSelection(text, options);

                return result;
            } catch (error) {
                console.error('[TranscriptionBridge] Error expanding selection:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        /**
         * Extract key points from text
         * @param {string} text - Text to analyze
         * @param {Object} options - Extraction options
         * @returns {Object} Key points
         */
        ipcMain.handle('transcription:extract-key-points', async (event, { text, options = {} }) => {
            try {
                const userId = await sessionRepository.getCurrentUserId();
                if (!userId) {
                    throw new Error('User not authenticated');
                }

                const result = await transcriptionProcessingService.extractKeyPoints(text, options);

                return result;
            } catch (error) {
                console.error('[TranscriptionBridge] Error extracting key points:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        /**
         * Rewrite text in different style
         * @param {string} text - Text to rewrite
         * @param {Object} options - Rewrite options
         * @returns {Object} Rewritten text
         */
        ipcMain.handle('transcription:rewrite-text', async (event, { text, options = {} }) => {
            try {
                const userId = await sessionRepository.getCurrentUserId();
                if (!userId) {
                    throw new Error('User not authenticated');
                }

                const result = await transcriptionProcessingService.rewriteText(text, options);

                return result;
            } catch (error) {
                console.error('[TranscriptionBridge] Error rewriting text:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        /**
         * Generate title from text using AI
         * @param {string} text - Text to generate title from
         * @param {Object} options - Generation options
         * @returns {Object} Generated title
         */
        ipcMain.handle('transcription:generate-title-ai', async (event, { text, options = {} }) => {
            try {
                const userId = await sessionRepository.getCurrentUserId();
                if (!userId) {
                    throw new Error('User not authenticated');
                }

                const result = await transcriptionProcessingService.generateTitle(text, options);

                return result;
            } catch (error) {
                console.error('[TranscriptionBridge] Error generating title:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        /**
         * Analyze sentiment of text
         * @param {string} text - Text to analyze
         * @param {Object} options - Analysis options
         * @returns {Object} Sentiment analysis
         */
        ipcMain.handle('transcription:analyze-sentiment', async (event, { text, options = {} }) => {
            try {
                const userId = await sessionRepository.getCurrentUserId();
                if (!userId) {
                    throw new Error('User not authenticated');
                }

                const result = await transcriptionProcessingService.analyzeSentiment(text, options);

                return result;
            } catch (error) {
                console.error('[TranscriptionBridge] Error analyzing sentiment:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        console.log('[TranscriptionBridge] IPC handlers initialized successfully (30 handlers)');
    }
};
