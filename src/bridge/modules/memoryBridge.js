/**
 * Memory Bridge - IPC handlers for long-term memory and user learning
 * Phase 2: Mémoire Long-Terme
 */
const { ipcMain } = require('electron');
const authService = require('../../features/common/services/authService');
const userLearningService = require('../../features/common/services/userLearningService');
const personalKnowledgeBaseService = require('../../features/common/services/personalKnowledgeBaseService');

module.exports = {
    initialize() {
        console.log('[MemoryBridge] Initializing long-term memory IPC handlers...');

        // ========================================
        // USER LEARNING HANDLERS
        // ========================================

        /**
         * Get user profile with learned preferences
         */
        ipcMain.handle('memory:get-user-profile', async (event) => {
            try {
                const userId = authService.getCurrentUserId();
                const profile = await userLearningService.getUserProfile(userId);
                return { success: true, profile };
            } catch (error) {
                console.error('[MemoryBridge] Error getting user profile:', error);
                return { success: false, error: error.message };
            }
        });

        /**
         * Get personalized context for prompt enrichment
         */
        ipcMain.handle('memory:get-personalized-context', async (event) => {
            try {
                const userId = authService.getCurrentUserId();
                const context = await userLearningService.generatePersonalizedContext(userId);
                return { success: true, context };
            } catch (error) {
                console.error('[MemoryBridge] Error getting personalized context:', error);
                return { success: false, error: error.message };
            }
        });

        /**
         * Manually trigger learning analysis for a session
         */
        ipcMain.handle('memory:analyze-session', async (event, sessionId) => {
            try {
                const userId = authService.getCurrentUserId();
                const insights = await userLearningService.analyzeConversationForLearning(sessionId, userId);
                return { success: true, insights };
            } catch (error) {
                console.error('[MemoryBridge] Error analyzing session:', error);
                return { success: false, error: error.message };
            }
        });

        /**
         * Batch analyze recent sessions (onboarding/initial setup)
         */
        ipcMain.handle('memory:batch-analyze-recent', async (event, daysBack = 7) => {
            try {
                const userId = authService.getCurrentUserId();
                const result = await userLearningService.batchAnalyzeRecentSessions(userId, daysBack);
                return { success: true, result };
            } catch (error) {
                console.error('[MemoryBridge] Error in batch analysis:', error);
                return { success: false, error: error.message };
            }
        });

        /**
         * Update user profile manually
         */
        ipcMain.handle('memory:update-user-profile', async (event, profileData) => {
            try {
                const userId = authService.getCurrentUserId();
                const success = await userLearningService.saveUserProfile(userId, profileData);
                return { success };
            } catch (error) {
                console.error('[MemoryBridge] Error updating user profile:', error);
                return { success: false, error: error.message };
            }
        });

        // ========================================
        // PERSONAL KNOWLEDGE BASE HANDLERS
        // ========================================

        /**
         * Index a conversation manually
         */
        ipcMain.handle('memory:index-conversation', async (event, sessionId) => {
            try {
                const userId = authService.getCurrentUserId();
                const result = await personalKnowledgeBaseService.indexConversation(sessionId, userId);
                return { success: true, result };
            } catch (error) {
                console.error('[MemoryBridge] Error indexing conversation:', error);
                return { success: false, error: error.message };
            }
        });

        /**
         * Semantic search in personal knowledge base
         */
        ipcMain.handle('memory:semantic-search', async (event, query, options = {}) => {
            try {
                const userId = authService.getCurrentUserId();
                const results = await personalKnowledgeBaseService.semanticSearch(query, userId, options);
                return { success: true, results };
            } catch (error) {
                console.error('[MemoryBridge] Error in semantic search:', error);
                return { success: false, error: error.message };
            }
        });

        /**
         * Get long-term memory context for a query
         */
        ipcMain.handle('memory:get-long-term-context', async (event, query, options = {}) => {
            try {
                const userId = authService.getCurrentUserId();
                const context = await personalKnowledgeBaseService.retrieveLongTermContext(query, userId, options);
                return { success: true, context };
            } catch (error) {
                console.error('[MemoryBridge] Error getting long-term context:', error);
                return { success: false, error: error.message };
            }
        });

        /**
         * Get memory statistics
         */
        ipcMain.handle('memory:get-stats', async (event) => {
            try {
                const userId = authService.getCurrentUserId();
                const stats = await personalKnowledgeBaseService.getMemoryStats(userId);
                return { success: true, stats };
            } catch (error) {
                console.error('[MemoryBridge] Error getting memory stats:', error);
                return { success: false, error: error.message };
            }
        });

        /**
         * Batch index recent unindexed sessions
         */
        ipcMain.handle('memory:batch-index-recent', async (event, daysBack = 30) => {
            try {
                const userId = authService.getCurrentUserId();
                const result = await personalKnowledgeBaseService.batchIndexRecentSessions(userId, daysBack);
                return { success: true, result };
            } catch (error) {
                console.error('[MemoryBridge] Error in batch indexing:', error);
                return { success: false, error: error.message };
            }
        });

        /**
         * Clean up old entries (maintenance)
         */
        ipcMain.handle('memory:cleanup-old-entries', async (event, daysToKeep = 90) => {
            try {
                const userId = authService.getCurrentUserId();
                const deletedCount = await personalKnowledgeBaseService.cleanupOldEntries(userId, daysToKeep);
                return { success: true, deletedCount };
            } catch (error) {
                console.error('[MemoryBridge] Error cleaning up old entries:', error);
                return { success: false, error: error.message };
            }
        });

        // ========================================
        // COMBINED / UTILITY HANDLERS
        // ========================================

        /**
         * Get comprehensive memory overview for dashboard
         */
        ipcMain.handle('memory:get-dashboard-overview', async (event) => {
            try {
                const userId = authService.getCurrentUserId();

                // Collect all relevant data
                const profile = await userLearningService.getUserProfile(userId);
                const memoryStats = await personalKnowledgeBaseService.getMemoryStats(userId);
                const personalizedContext = await userLearningService.generatePersonalizedContext(userId);

                let profileData = null;
                if (profile && profile.profile_preferences) {
                    profileData = JSON.parse(profile.profile_preferences);
                }

                return {
                    success: true,
                    overview: {
                        profile: profileData,
                        memoryStats: memoryStats || {
                            total_elements: 0,
                            conversations_indexed: 0,
                            last_indexed_at: null
                        },
                        hasPersonalizedContext: !!personalizedContext && personalizedContext.length > 0,
                        contextPreview: personalizedContext ? personalizedContext.substring(0, 500) : null
                    }
                };
            } catch (error) {
                console.error('[MemoryBridge] Error getting dashboard overview:', error);
                return { success: false, error: error.message };
            }
        });

        /**
         * Initialize memory system for a new user (onboarding)
         */
        ipcMain.handle('memory:initialize-for-user', async (event, options = {}) => {
            try {
                const userId = authService.getCurrentUserId();
                const { analyzeSessions = true, indexSessions = true, daysBack = 30 } = options;

                const results = {
                    analyzed: 0,
                    indexed: 0
                };

                // Analyze recent sessions to learn about user
                if (analyzeSessions) {
                    const analysisResult = await userLearningService.batchAnalyzeRecentSessions(userId, daysBack);
                    results.analyzed = analysisResult.withInsights || 0;
                }

                // Index recent sessions for semantic search
                if (indexSessions) {
                    const indexResult = await personalKnowledgeBaseService.batchIndexRecentSessions(userId, daysBack);
                    results.indexed = indexResult.indexed || 0;
                }

                console.log(`[MemoryBridge] ✅ Memory initialized for user ${userId}: ${results.analyzed} analyzed, ${results.indexed} indexed`);

                return { success: true, results };
            } catch (error) {
                console.error('[MemoryBridge] Error initializing memory:', error);
                return { success: false, error: error.message };
            }
        });

        /**
         * Search across all memory types (unified search)
         */
        ipcMain.handle('memory:unified-search', async (event, query, options = {}) => {
            try {
                const userId = authService.getCurrentUserId();

                // Search in personal knowledge base
                const semanticResults = await personalKnowledgeBaseService.semanticSearch(query, userId, {
                    topK: options.topK || 10,
                    minScore: options.minScore || 0.7,
                    sourceTypes: ['conversation', 'learning_event'],
                    freshnessBoost: true
                });

                // Get personalized context if relevant
                const personalizedContext = await userLearningService.generatePersonalizedContext(userId);

                return {
                    success: true,
                    results: {
                        semantic: semanticResults,
                        personalizedContext: personalizedContext || null,
                        totalResults: semanticResults.length
                    }
                };
            } catch (error) {
                console.error('[MemoryBridge] Error in unified search:', error);
                return { success: false, error: error.message };
            }
        });

        /**
         * Get insights summary (what has been learned about the user)
         */
        ipcMain.handle('memory:get-insights-summary', async (event) => {
            try {
                const userId = authService.getCurrentUserId();
                const profile = await userLearningService.getUserProfile(userId);

                if (!profile || !profile.profile_preferences) {
                    return {
                        success: true,
                        summary: {
                            hasProfile: false,
                            challenges: [],
                            goals: [],
                            projects: [],
                            expertise: [],
                            frameworks: []
                        }
                    };
                }

                const data = JSON.parse(profile.profile_preferences);

                return {
                    success: true,
                    summary: {
                        hasProfile: true,
                        challenges: data.challenges || [],
                        goals: data.goals || [],
                        projects: data.projects || [],
                        expertise: data.expertise || [],
                        frameworks: data.frameworks || [],
                        preferences: data.preferences || {},
                        context: data.context || {}
                    }
                };
            } catch (error) {
                console.error('[MemoryBridge] Error getting insights summary:', error);
                return { success: false, error: error.message };
            }
        });

        console.log('[MemoryBridge] All memory handlers registered successfully');
    }
};
