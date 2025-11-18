const { v4: uuidv4 } = require('uuid');
const sqliteClient = require('./sqliteClient');
const embeddingProvider = require('./embeddingProvider');

/**
 * Service de cache sémantique intelligent
 * Cache les réponses et utilise la similarité sémantique pour réutiliser les réponses
 * à des questions similaires, réduisant latence et coûts
 * Phase 3: Performance & Optimisation
 */
class SemanticCacheService {
    constructor() {
        this.db = null;
        this.memoryCache = new Map(); // Cache en mémoire (LRU)
        this.maxMemoryCacheSize = 100; // Max 100 entrées en mémoire
        this.similarityThreshold = 0.92; // Très proche (92% similarité)
        this.maxCacheAge = 7 * 24 * 60 * 60 * 1000; // 7 jours en ms
        this.cacheHits = 0;
        this.cacheMisses = 0;
    }

    /**
     * Initialise le service
     */
    async initialize() {
        this.db = sqliteClient.getDb();

        // Créer la table de cache si elle n'existe pas
        try {
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS semantic_cache (
                    id TEXT PRIMARY KEY,
                    uid TEXT NOT NULL,
                    agent_profile TEXT NOT NULL,
                    question TEXT NOT NULL,
                    question_embedding TEXT NOT NULL,
                    response TEXT NOT NULL,
                    model TEXT,
                    provider TEXT,
                    tokens_saved INTEGER DEFAULT 0,
                    hit_count INTEGER DEFAULT 0,
                    created_at INTEGER NOT NULL,
                    last_hit_at INTEGER,
                    expires_at INTEGER
                )
            `);

            this.db.exec(`
                CREATE INDEX IF NOT EXISTS idx_cache_user_profile
                ON semantic_cache(uid, agent_profile)
            `);

            this.db.exec(`
                CREATE INDEX IF NOT EXISTS idx_cache_expires
                ON semantic_cache(expires_at)
            `);

            console.log('[SemanticCacheService] Service initialized');
        } catch (error) {
            console.error('[SemanticCacheService] Error initializing:', error);
        }

        // Initialiser l'embedding provider
        try {
            await embeddingProvider.initialize();
        } catch (error) {
            console.warn('[SemanticCacheService] Embedding provider init failed:', error.message);
        }
    }

    /**
     * Recherche une réponse cachée pour une question similaire
     * @param {string} question - La question
     * @param {string} userId - ID de l'utilisateur
     * @param {string} agentProfile - Profil de l'agent
     * @returns {Promise<Object|null>} La réponse cachée ou null
     */
    async getCachedResponse(question, userId, agentProfile) {
        try {
            if (!this.db) await this.initialize();

            // Générer l'embedding de la question
            const questionEmbedding = await embeddingProvider.generateEmbedding(question);

            // 1. Chercher d'abord dans le cache mémoire (très rapide)
            const memoryCacheResult = this.searchMemoryCache(questionEmbedding, agentProfile);
            if (memoryCacheResult) {
                this.cacheHits++;
                await this.recordCacheHit(memoryCacheResult.id);
                console.log(`[SemanticCacheService] 🎯 Memory cache HIT (similarity: ${Math.round(memoryCacheResult.similarity * 100)}%)`);
                return {
                    hit: true,
                    source: 'memory',
                    response: memoryCacheResult.response,
                    similarity: memoryCacheResult.similarity,
                    originalQuestion: memoryCacheResult.question,
                    cacheId: memoryCacheResult.id
                };
            }

            // 2. Chercher dans le cache persistant (SQLite)
            const now = Math.floor(Date.now() / 1000);
            const stmt = this.db.prepare(`
                SELECT id, question, question_embedding, response, created_at
                FROM semantic_cache
                WHERE uid = ?
                  AND agent_profile = ?
                  AND expires_at > ?
                ORDER BY created_at DESC
                LIMIT 50
            `);

            const cachedEntries = stmt.all(userId, agentProfile, now);

            // Calculer similarités
            let bestMatch = null;
            let bestSimilarity = 0;

            for (const entry of cachedEntries) {
                try {
                    const cachedEmbedding = JSON.parse(entry.question_embedding);
                    const similarity = this.cosineSimilarity(questionEmbedding, cachedEmbedding);

                    if (similarity >= this.similarityThreshold && similarity > bestSimilarity) {
                        bestSimilarity = similarity;
                        bestMatch = {
                            id: entry.id,
                            question: entry.question,
                            response: entry.response,
                            similarity: similarity,
                            createdAt: entry.created_at
                        };
                    }
                } catch (parseError) {
                    // Skip cette entrée
                }
            }

            if (bestMatch) {
                this.cacheHits++;
                await this.recordCacheHit(bestMatch.id);

                // Ajouter au cache mémoire pour accès encore plus rapide
                this.addToMemoryCache({
                    id: bestMatch.id,
                    question: bestMatch.question,
                    questionEmbedding: questionEmbedding,
                    response: bestMatch.response,
                    agentProfile: agentProfile
                });

                console.log(`[SemanticCacheService] 🎯 DB cache HIT (similarity: ${Math.round(bestMatch.similarity * 100)}%)`);

                return {
                    hit: true,
                    source: 'database',
                    response: bestMatch.response,
                    similarity: bestMatch.similarity,
                    originalQuestion: bestMatch.question,
                    cacheId: bestMatch.id
                };
            }

            // Aucun match trouvé
            this.cacheMisses++;
            console.log('[SemanticCacheService] ❌ Cache MISS');
            return { hit: false };

        } catch (error) {
            console.error('[SemanticCacheService] Error getting cached response:', error);
            return { hit: false };
        }
    }

    /**
     * Stocke une réponse dans le cache
     * @param {Object} cacheData - Les données à cacher
     * @returns {Promise<string>} ID du cache créé
     */
    async setCachedResponse({
        question,
        response,
        userId,
        agentProfile,
        model = 'unknown',
        provider = 'unknown',
        tokensUsed = 0
    }) {
        try {
            if (!this.db) await this.initialize();

            // Générer l'embedding de la question
            const questionEmbedding = await embeddingProvider.generateEmbedding(question);

            const cacheId = uuidv4();
            const now = Math.floor(Date.now() / 1000);
            const expiresAt = now + Math.floor(this.maxCacheAge / 1000);

            // Stocker dans SQLite
            const stmt = this.db.prepare(`
                INSERT INTO semantic_cache (
                    id, uid, agent_profile, question, question_embedding,
                    response, model, provider, tokens_saved,
                    created_at, expires_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            stmt.run(
                cacheId,
                userId,
                agentProfile,
                question,
                JSON.stringify(questionEmbedding),
                response,
                model,
                provider,
                tokensUsed,
                now,
                expiresAt
            );

            // Ajouter au cache mémoire
            this.addToMemoryCache({
                id: cacheId,
                question,
                questionEmbedding,
                response,
                agentProfile
            });

            console.log(`[SemanticCacheService] ✅ Response cached (id: ${cacheId.substring(0, 8)})`);

            // Cleanup ancien cache si nécessaire
            this.cleanupExpiredCache();

            return cacheId;

        } catch (error) {
            console.error('[SemanticCacheService] Error caching response:', error);
            return null;
        }
    }

    /**
     * Cherche dans le cache mémoire (très rapide)
     */
    searchMemoryCache(questionEmbedding, agentProfile) {
        for (const [cacheId, cacheData] of this.memoryCache.entries()) {
            if (cacheData.agentProfile !== agentProfile) continue;

            const similarity = this.cosineSimilarity(questionEmbedding, cacheData.questionEmbedding);

            if (similarity >= this.similarityThreshold) {
                return {
                    id: cacheId,
                    question: cacheData.question,
                    response: cacheData.response,
                    similarity: similarity
                };
            }
        }

        return null;
    }

    /**
     * Ajoute au cache mémoire avec éviction LRU
     */
    addToMemoryCache(data) {
        // Si le cache est plein, supprimer la plus ancienne entrée (LRU)
        if (this.memoryCache.size >= this.maxMemoryCacheSize) {
            const firstKey = this.memoryCache.keys().next().value;
            this.memoryCache.delete(firstKey);
        }

        this.memoryCache.set(data.id, {
            question: data.question,
            questionEmbedding: data.questionEmbedding,
            response: data.response,
            agentProfile: data.agentProfile,
            addedAt: Date.now()
        });
    }

    /**
     * Enregistre un hit de cache
     */
    async recordCacheHit(cacheId) {
        try {
            if (!this.db) return;

            const now = Math.floor(Date.now() / 1000);
            const stmt = this.db.prepare(`
                UPDATE semantic_cache
                SET hit_count = hit_count + 1, last_hit_at = ?
                WHERE id = ?
            `);

            stmt.run(now, cacheId);
        } catch (error) {
            // Non-critical
        }
    }

    /**
     * Nettoie les entrées expirées
     */
    cleanupExpiredCache() {
        try {
            if (!this.db) return;

            const now = Math.floor(Date.now() / 1000);
            const stmt = this.db.prepare('DELETE FROM semantic_cache WHERE expires_at < ?');
            const result = stmt.run(now);

            if (result.changes > 0) {
                console.log(`[SemanticCacheService] 🧹 Cleaned up ${result.changes} expired cache entries`);
            }
        } catch (error) {
            console.error('[SemanticCacheService] Error cleaning up cache:', error);
        }
    }

    /**
     * Calcule la similarité cosinus entre deux vecteurs
     */
    cosineSimilarity(vecA, vecB) {
        if (vecA.length !== vecB.length) {
            throw new Error('Vectors must have same dimensions');
        }

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }

        normA = Math.sqrt(normA);
        normB = Math.sqrt(normB);

        if (normA === 0 || normB === 0) return 0;

        return dotProduct / (normA * normB);
    }

    /**
     * Récupère les statistiques du cache
     * @param {string} userId - ID de l'utilisateur
     * @returns {Object} Statistiques
     */
    getCacheStats(userId = null) {
        try {
            if (!this.db) return null;

            let query = `
                SELECT
                    COUNT(*) as total_entries,
                    SUM(hit_count) as total_hits,
                    SUM(tokens_saved) as total_tokens_saved,
                    AVG(hit_count) as avg_hits_per_entry,
                    MAX(hit_count) as max_hits
                FROM semantic_cache
            `;

            const params = [];
            if (userId) {
                query += ' WHERE uid = ?';
                params.push(userId);
            }

            const stmt = this.db.prepare(query);
            const dbStats = stmt.get(...params);

            // Calculer le hit rate
            const totalRequests = this.cacheHits + this.cacheMisses;
            const hitRate = totalRequests > 0 ? (this.cacheHits / totalRequests) * 100 : 0;

            return {
                memoryCache: {
                    size: this.memoryCache.size,
                    maxSize: this.maxMemoryCacheSize
                },
                persistentCache: {
                    totalEntries: dbStats.total_entries || 0,
                    totalHits: dbStats.total_hits || 0,
                    totalTokensSaved: dbStats.total_tokens_saved || 0,
                    avgHitsPerEntry: Math.round((dbStats.avg_hits_per_entry || 0) * 10) / 10,
                    maxHits: dbStats.max_hits || 0
                },
                session: {
                    cacheHits: this.cacheHits,
                    cacheMisses: this.cacheMisses,
                    hitRate: Math.round(hitRate * 10) / 10
                },
                config: {
                    similarityThreshold: this.similarityThreshold,
                    maxCacheAge: `${Math.floor(this.maxCacheAge / (24 * 60 * 60 * 1000))} days`
                }
            };
        } catch (error) {
            console.error('[SemanticCacheService] Error getting cache stats:', error);
            return null;
        }
    }

    /**
     * Invalide une entrée de cache
     * @param {string} cacheId - ID du cache
     */
    async invalidateCache(cacheId) {
        try {
            if (!this.db) return false;

            // Supprimer de la mémoire
            this.memoryCache.delete(cacheId);

            // Supprimer de SQLite
            const stmt = this.db.prepare('DELETE FROM semantic_cache WHERE id = ?');
            const result = stmt.run(cacheId);

            return result.changes > 0;
        } catch (error) {
            console.error('[SemanticCacheService] Error invalidating cache:', error);
            return false;
        }
    }

    /**
     * Vide tout le cache pour un utilisateur
     * @param {string} userId - ID de l'utilisateur
     */
    async clearCache(userId = null) {
        try {
            if (!this.db) return 0;

            // Vider le cache mémoire
            this.memoryCache.clear();

            // Vider SQLite
            let query = 'DELETE FROM semantic_cache';
            const params = [];

            if (userId) {
                query += ' WHERE uid = ?';
                params.push(userId);
            }

            const stmt = this.db.prepare(query);
            const result = stmt.run(...params);

            console.log(`[SemanticCacheService] 🧹 Cleared ${result.changes} cache entries`);
            return result.changes;
        } catch (error) {
            console.error('[SemanticCacheService] Error clearing cache:', error);
            return 0;
        }
    }

    /**
     * Récupère les entrées de cache les plus utilisées
     * @param {string} userId - ID de l'utilisateur
     * @param {number} limit - Nombre d'entrées
     */
    getMostUsedCacheEntries(userId, limit = 10) {
        try {
            if (!this.db) return [];

            const stmt = this.db.prepare(`
                SELECT id, question, hit_count, created_at, last_hit_at
                FROM semantic_cache
                WHERE uid = ?
                ORDER BY hit_count DESC
                LIMIT ?
            `);

            return stmt.all(userId, limit);
        } catch (error) {
            console.error('[SemanticCacheService] Error getting most used entries:', error);
            return [];
        }
    }

    /**
     * Estime les économies réalisées grâce au cache
     * @param {string} userId - ID de l'utilisateur
     * @returns {Object} Économies estimées
     */
    estimateSavings(userId = null) {
        try {
            if (!this.db) return null;

            const stats = this.getCacheStats(userId);
            if (!stats) return null;

            const totalHits = stats.persistentCache.totalHits;
            const avgTokensPerRequest = 1000; // Estimation moyenne
            const costPerMillionTokens = 3; // Claude 3.5 Sonnet: $3/1M tokens input

            // Estimation tokens économisés (input uniquement, output généré qu'une fois)
            const tokensEconomized = totalHits * avgTokensPerRequest;
            const costSaved = (tokensEconomized / 1000000) * costPerMillionTokens;

            // Estimation temps économisé (2s en moyenne par requête)
            const timeSavedSeconds = totalHits * 2;

            return {
                totalCacheHits: totalHits,
                tokensEconomized: tokensEconomized,
                costSavedUSD: Math.round(costSaved * 100) / 100,
                timeSavedSeconds: timeSavedSeconds,
                timeSavedMinutes: Math.round(timeSavedSeconds / 60),
                averageLatencyReduction: '60-80%' // Cache hit ~200ms vs normal ~1-2s
            };
        } catch (error) {
            console.error('[SemanticCacheService] Error estimating savings:', error);
            return null;
        }
    }
}

// Export singleton instance
const semanticCacheService = new SemanticCacheService();
module.exports = semanticCacheService;
