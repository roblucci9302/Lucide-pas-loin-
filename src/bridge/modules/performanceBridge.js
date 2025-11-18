/**
 * Performance Bridge - IPC handlers for Phase 3 Performance & Optimization
 * Handles semantic cache, model selection, and style adaptation features
 */

const { ipcMain } = require('electron');
const semanticCacheService = require('../../features/common/services/semanticCacheService');
const modelSelectionService = require('../../features/common/services/modelSelectionService');
const styleAdaptationService = require('../../features/common/services/styleAdaptationService');
const sessionRepository = require('../../features/common/repositories/session');

module.exports = {
    /**
     * Initialize all IPC handlers for performance features
     */
    initialize() {
        console.log('[PerformanceBridge] Initializing IPC handlers...');

        // ==================== SEMANTIC CACHE HANDLERS ====================

        /**
         * Get cache statistics
         * Returns memory cache size, persistent cache stats, hit rate, tokens saved
         */
        ipcMain.handle('performance:cache:get-stats', async (event, userId = null) => {
            try {
                const stats = semanticCacheService.getCacheStats(userId);
                return { success: true, stats };
            } catch (error) {
                console.error('[PerformanceBridge] Error getting cache stats:', error);
                return { success: false, error: error.message };
            }
        });

        /**
         * Get cache savings estimation
         * Calculates tokens economized, cost saved, time saved
         */
        ipcMain.handle('performance:cache:estimate-savings', async (event, userId = null) => {
            try {
                const savings = semanticCacheService.estimateSavings(userId);
                return { success: true, savings };
            } catch (error) {
                console.error('[PerformanceBridge] Error estimating savings:', error);
                return { success: false, error: error.message };
            }
        });

        /**
         * Get most used cache entries
         */
        ipcMain.handle('performance:cache:get-most-used', async (event, { userId, limit = 10 }) => {
            try {
                const entries = semanticCacheService.getMostUsedCacheEntries(userId, limit);
                return { success: true, entries };
            } catch (error) {
                console.error('[PerformanceBridge] Error getting most used entries:', error);
                return { success: false, error: error.message };
            }
        });

        /**
         * Clear cache for a user or all users
         */
        ipcMain.handle('performance:cache:clear', async (event, userId = null) => {
            try {
                const deletedCount = await semanticCacheService.clearCache(userId);
                return { success: true, deletedCount };
            } catch (error) {
                console.error('[PerformanceBridge] Error clearing cache:', error);
                return { success: false, error: error.message };
            }
        });

        /**
         * Invalidate a specific cache entry
         */
        ipcMain.handle('performance:cache:invalidate', async (event, cacheId) => {
            try {
                const result = await semanticCacheService.invalidateCache(cacheId);
                return { success: result };
            } catch (error) {
                console.error('[PerformanceBridge] Error invalidating cache:', error);
                return { success: false, error: error.message };
            }
        });

        /**
         * Cleanup expired cache entries
         */
        ipcMain.handle('performance:cache:cleanup', async () => {
            try {
                semanticCacheService.cleanupExpiredCache();
                return { success: true };
            } catch (error) {
                console.error('[PerformanceBridge] Error cleaning up cache:', error);
                return { success: false, error: error.message };
            }
        });

        // ==================== MODEL SELECTION HANDLERS ====================

        /**
         * Analyze question complexity
         * Returns complexity score, level, features, confidence
         */
        ipcMain.handle('performance:model:analyze-complexity', async (event, { question, conversationHistory = [] }) => {
            try {
                const complexity = modelSelectionService.analyzeComplexity(question, conversationHistory);
                return { success: true, complexity };
            } catch (error) {
                console.error('[PerformanceBridge] Error analyzing complexity:', error);
                return { success: false, error: error.message };
            }
        });

        /**
         * Analyze and select optimal model
         * Returns full analysis with complexity and model selection
         */
        ipcMain.handle('performance:model:analyze-and-select', async (event, { question, options = {} }) => {
            try {
                const analysis = modelSelectionService.analyzeAndSelect(question, options);
                return { success: true, analysis };
            } catch (error) {
                console.error('[PerformanceBridge] Error analyzing and selecting model:', error);
                return { success: false, error: error.message };
            }
        });

        /**
         * Get available models for a provider
         */
        ipcMain.handle('performance:model:get-available-models', async (event, provider) => {
            try {
                const models = modelSelectionService.getAvailableModels(provider);
                return { success: true, models };
            } catch (error) {
                console.error('[PerformanceBridge] Error getting available models:', error);
                return { success: false, error: error.message };
            }
        });

        /**
         * Estimate potential savings with auto-selection
         * Analyzes recent questions and calculates cost savings
         */
        ipcMain.handle('performance:model:estimate-savings', async (event, recentQuestions) => {
            try {
                const savings = modelSelectionService.estimatePotentialSavings(recentQuestions);
                return { success: true, savings };
            } catch (error) {
                console.error('[PerformanceBridge] Error estimating model savings:', error);
                return { success: false, error: error.message };
            }
        });

        // ==================== STYLE ADAPTATION HANDLERS ====================

        /**
         * Get user style preferences
         * Analyzes recent messages to detect preferences
         */
        ipcMain.handle('performance:style:get-preferences', async (event, { userId, sampleSize = 50 }) => {
            try {
                const currentUserId = userId || await sessionRepository.getCurrentUserId();
                if (!currentUserId) {
                    throw new Error('User not authenticated');
                }

                const preferences = await styleAdaptationService.analyzeUserPreferences(currentUserId, sampleSize);
                return { success: true, preferences };
            } catch (error) {
                console.error('[PerformanceBridge] Error getting style preferences:', error);
                return { success: false, error: error.message };
            }
        });

        /**
         * Get cached style preferences (with caching)
         */
        ipcMain.handle('performance:style:get-cached-preferences', async (event, { userId, maxAge = 86400000 }) => {
            try {
                const currentUserId = userId || await sessionRepository.getCurrentUserId();
                if (!currentUserId) {
                    throw new Error('User not authenticated');
                }

                const preferences = await styleAdaptationService.getCachedPreferences(currentUserId, maxAge);
                return { success: true, preferences };
            } catch (error) {
                console.error('[PerformanceBridge] Error getting cached preferences:', error);
                return { success: false, error: error.message };
            }
        });

        /**
         * Build style instructions from preferences
         */
        ipcMain.handle('performance:style:build-instructions', async (event, { preferences, agentProfile }) => {
            try {
                const instructions = styleAdaptationService.buildStyleInstructions(preferences, agentProfile);
                return { success: true, instructions };
            } catch (error) {
                console.error('[PerformanceBridge] Error building style instructions:', error);
                return { success: false, error: error.message };
            }
        });

        /**
         * Get default style preferences
         */
        ipcMain.handle('performance:style:get-defaults', async () => {
            try {
                const defaults = styleAdaptationService.getDefaultPreferences();
                return { success: true, defaults };
            } catch (error) {
                console.error('[PerformanceBridge] Error getting default preferences:', error);
                return { success: false, error: error.message };
            }
        });

        // ==================== COMBINED DASHBOARD HANDLERS ====================

        /**
         * Get complete performance dashboard overview
         * Combines cache stats, model selection data, and style preferences
         */
        ipcMain.handle('performance:get-dashboard-overview', async (event, userId = null) => {
            try {
                const currentUserId = userId || await sessionRepository.getCurrentUserId();

                // Get cache stats
                const cacheStats = semanticCacheService.getCacheStats(currentUserId);
                const cacheSavings = semanticCacheService.estimateSavings(currentUserId);

                // Get style preferences
                let stylePreferences = null;
                try {
                    stylePreferences = await styleAdaptationService.getCachedPreferences(currentUserId);
                } catch (styleError) {
                    console.warn('[PerformanceBridge] Style preferences unavailable:', styleError.message);
                }

                return {
                    success: true,
                    dashboard: {
                        cache: {
                            stats: cacheStats,
                            savings: cacheSavings
                        },
                        style: {
                            preferences: stylePreferences
                        },
                        timestamp: Date.now()
                    }
                };
            } catch (error) {
                console.error('[PerformanceBridge] Error getting dashboard overview:', error);
                return { success: false, error: error.message };
            }
        });

        /**
         * Get performance metrics summary
         * Returns key metrics for monitoring
         */
        ipcMain.handle('performance:get-metrics-summary', async (event, userId = null) => {
            try {
                const currentUserId = userId || await sessionRepository.getCurrentUserId();

                const cacheStats = semanticCacheService.getCacheStats(currentUserId);
                const cacheSavings = semanticCacheService.estimateSavings(currentUserId);

                return {
                    success: true,
                    metrics: {
                        cacheHitRate: cacheStats?.session?.hitRate || 0,
                        totalTokensSaved: cacheSavings?.tokensEconomized || 0,
                        costSavedUSD: cacheSavings?.costSavedUSD || 0,
                        timeSavedMinutes: cacheSavings?.timeSavedMinutes || 0,
                        cacheEntries: cacheStats?.persistentCache?.totalEntries || 0,
                        timestamp: Date.now()
                    }
                };
            } catch (error) {
                console.error('[PerformanceBridge] Error getting metrics summary:', error);
                return { success: false, error: error.message };
            }
        });

        /**
         * Initialize performance services
         * Ensures all services are initialized
         */
        ipcMain.handle('performance:initialize', async () => {
            try {
                await semanticCacheService.initialize();
                console.log('[PerformanceBridge] Performance services initialized');
                return { success: true };
            } catch (error) {
                console.error('[PerformanceBridge] Error initializing performance services:', error);
                return { success: false, error: error.message };
            }
        });

        console.log('[PerformanceBridge] IPC handlers initialized successfully (24 handlers)');
    }
};
