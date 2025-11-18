/**
 * Feedback Bridge - IPC handlers for response feedback and quality metrics
 * Phase 3: Agent Improvement
 */
const { ipcMain } = require('electron');
const authService = require('../../features/common/services/authService');
const responseFeedbackService = require('../../features/common/services/responseFeedbackService');
const responseQualityService = require('../../features/common/services/responseQualityService');

module.exports = {
    initialize() {
        console.log('[FeedbackBridge] Initializing feedback IPC handlers...');

        // ========================================
        // RESPONSE FEEDBACK HANDLERS
        // ========================================

        /**
         * Record simple thumbs up/down feedback
         */
        ipcMain.handle('feedback:record-simple', async (event, feedbackData) => {
            try {
                const userId = authService.getCurrentUserId();
                const result = responseFeedbackService.recordSimpleFeedback({
                    userId,
                    ...feedbackData
                });
                return { success: true, feedback: result };
            } catch (error) {
                console.error('[FeedbackBridge] Error recording simple feedback:', error);
                return { success: false, error: error.message };
            }
        });

        /**
         * Record detailed feedback with rating and comment
         */
        ipcMain.handle('feedback:record-detailed', async (event, feedbackData) => {
            try {
                const userId = authService.getCurrentUserId();
                const result = responseFeedbackService.recordDetailedFeedback({
                    userId,
                    ...feedbackData
                });
                return { success: true, feedback: result };
            } catch (error) {
                console.error('[FeedbackBridge] Error recording detailed feedback:', error);
                return { success: false, error: error.message };
            }
        });

        /**
         * Get feedbacks for a specific agent
         */
        ipcMain.handle('feedback:get-by-agent', async (event, agentProfile, limit = 100) => {
            try {
                const feedbacks = responseFeedbackService.getFeedbacksByAgent(agentProfile, limit);
                return { success: true, feedbacks };
            } catch (error) {
                console.error('[FeedbackBridge] Error getting agent feedbacks:', error);
                return { success: false, error: error.message };
            }
        });

        /**
         * Get feedbacks for current user
         */
        ipcMain.handle('feedback:get-by-user', async (event, limit = 100) => {
            try {
                const userId = authService.getCurrentUserId();
                const feedbacks = responseFeedbackService.getFeedbacksByUser(userId, limit);
                return { success: true, feedbacks };
            } catch (error) {
                console.error('[FeedbackBridge] Error getting user feedbacks:', error);
                return { success: false, error: error.message };
            }
        });

        /**
         * Get feedbacks for a specific session
         */
        ipcMain.handle('feedback:get-by-session', async (event, sessionId) => {
            try {
                const feedbacks = responseFeedbackService.getFeedbacksBySession(sessionId);
                return { success: true, feedbacks };
            } catch (error) {
                console.error('[FeedbackBridge] Error getting session feedbacks:', error);
                return { success: false, error: error.message };
            }
        });

        /**
         * Get feedback for a specific message
         */
        ipcMain.handle('feedback:get-for-message', async (event, messageId) => {
            try {
                const feedback = responseFeedbackService.getFeedbackForMessage(messageId);
                return { success: true, feedback };
            } catch (error) {
                console.error('[FeedbackBridge] Error getting message feedback:', error);
                return { success: false, error: error.message };
            }
        });

        /**
         * Update existing feedback
         */
        ipcMain.handle('feedback:update', async (event, feedbackId, updates) => {
            try {
                const success = responseFeedbackService.updateFeedback(feedbackId, updates);
                return { success };
            } catch (error) {
                console.error('[FeedbackBridge] Error updating feedback:', error);
                return { success: false, error: error.message };
            }
        });

        /**
         * Delete feedback
         */
        ipcMain.handle('feedback:delete', async (event, feedbackId) => {
            try {
                const success = responseFeedbackService.deleteFeedback(feedbackId);
                return { success };
            } catch (error) {
                console.error('[FeedbackBridge] Error deleting feedback:', error);
                return { success: false, error: error.message };
            }
        });

        /**
         * Get quality metrics for an agent
         */
        ipcMain.handle('feedback:get-agent-metrics', async (event, agentProfile, daysBack = 30) => {
            try {
                const metrics = responseFeedbackService.getAgentQualityMetrics(agentProfile, daysBack);
                return { success: true, metrics };
            } catch (error) {
                console.error('[FeedbackBridge] Error getting agent metrics:', error);
                return { success: false, error: error.message };
            }
        });

        /**
         * Get all agents metrics (overview)
         */
        ipcMain.handle('feedback:get-all-agents-metrics', async (event, daysBack = 30) => {
            try {
                const metrics = responseFeedbackService.getAllAgentsMetrics(daysBack);
                return { success: true, metrics };
            } catch (error) {
                console.error('[FeedbackBridge] Error getting all agents metrics:', error);
                return { success: false, error: error.message };
            }
        });

        /**
         * Get negative feedbacks with comments for analysis
         */
        ipcMain.handle('feedback:get-negative-with-comments', async (event, agentProfile = null, limit = 50) => {
            try {
                const feedbacks = responseFeedbackService.getNegativeFeedbacksWithComments(agentProfile, limit);
                return { success: true, feedbacks };
            } catch (error) {
                console.error('[FeedbackBridge] Error getting negative feedbacks:', error);
                return { success: false, error: error.message };
            }
        });

        // ========================================
        // QUALITY METRICS HANDLERS
        // ========================================

        /**
         * Get quality metrics for a specific message
         */
        ipcMain.handle('quality:get-for-message', async (event, messageId) => {
            try {
                const metrics = responseQualityService.getMetricsForMessage(messageId);
                return { success: true, metrics };
            } catch (error) {
                console.error('[FeedbackBridge] Error getting quality metrics:', error);
                return { success: false, error: error.message };
            }
        });

        /**
         * Get quality statistics for an agent
         */
        ipcMain.handle('quality:get-agent-stats', async (event, agentProfile, daysBack = 30) => {
            try {
                const stats = responseQualityService.getAgentQualityStats(agentProfile, daysBack);
                return { success: true, stats };
            } catch (error) {
                console.error('[FeedbackBridge] Error getting agent quality stats:', error);
                return { success: false, error: error.message };
            }
        });

        /**
         * Analyze correlation between quality scores and user feedback
         */
        ipcMain.handle('quality:analyze-correlation', async (event, agentProfile, daysBack = 30) => {
            try {
                const analysis = responseQualityService.analyzeQualityFeedbackCorrelation(agentProfile, daysBack);
                return { success: true, analysis };
            } catch (error) {
                console.error('[FeedbackBridge] Error analyzing correlation:', error);
                return { success: false, error: error.message };
            }
        });

        /**
         * Run LLM-as-Judge evaluation on a response (sampling)
         */
        ipcMain.handle('quality:llm-judge', async (event, { question, response, provider }) => {
            try {
                // This requires an AI provider instance - implement if needed
                // For now, return not implemented
                return { success: false, error: 'LLM-as-Judge not yet implemented' };
            } catch (error) {
                console.error('[FeedbackBridge] Error running LLM judge:', error);
                return { success: false, error: error.message };
            }
        });

        // ========================================
        // ANALYTICS & DASHBOARD HANDLERS
        // ========================================

        /**
         * Get comprehensive dashboard data
         */
        ipcMain.handle('feedback:get-dashboard-data', async (event, daysBack = 30) => {
            try {
                const userId = authService.getCurrentUserId();

                // Collect all relevant data for the dashboard
                const allAgentsMetrics = responseFeedbackService.getAllAgentsMetrics(daysBack);
                const negativeFeedbacks = responseFeedbackService.getNegativeFeedbacksWithComments(null, 20);

                // Get quality stats for each agent
                const qualityStats = [];
                for (const agentMetric of allAgentsMetrics) {
                    const stats = responseQualityService.getAgentQualityStats(agentMetric.agentProfile, daysBack);
                    if (stats) {
                        qualityStats.push(stats);
                    }
                }

                return {
                    success: true,
                    data: {
                        feedbackMetrics: allAgentsMetrics,
                        qualityStats: qualityStats,
                        recentNegativeFeedbacks: negativeFeedbacks,
                        period: `${daysBack} days`
                    }
                };
            } catch (error) {
                console.error('[FeedbackBridge] Error getting dashboard data:', error);
                return { success: false, error: error.message };
            }
        });

        /**
         * Get trending issues (most common negative feedback patterns)
         */
        ipcMain.handle('feedback:get-trending-issues', async (event, daysBack = 7) => {
            try {
                // Get recent negative feedbacks
                const feedbacks = responseFeedbackService.getNegativeFeedbacksWithComments(null, 100);

                // Group by feedback_type
                const typeGroups = {};
                for (const fb of feedbacks) {
                    const type = fb.feedback_type || 'other';
                    if (!typeGroups[type]) {
                        typeGroups[type] = [];
                    }
                    typeGroups[type].push(fb);
                }

                // Sort by count
                const trending = Object.entries(typeGroups)
                    .map(([type, items]) => ({
                        type,
                        count: items.length,
                        recentExamples: items.slice(0, 3).map(item => ({
                            comment: item.comment,
                            agentProfile: item.agent_profile,
                            createdAt: item.created_at
                        }))
                    }))
                    .sort((a, b) => b.count - a.count);

                return { success: true, trending };
            } catch (error) {
                console.error('[FeedbackBridge] Error getting trending issues:', error);
                return { success: false, error: error.message };
            }
        });

        console.log('[FeedbackBridge] All feedback handlers registered successfully');
    }
};
