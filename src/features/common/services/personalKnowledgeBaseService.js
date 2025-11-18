const { v4: uuidv4 } = require('uuid');
const sqliteClient = require('./sqliteClient');
const embeddingProvider = require('./embeddingProvider');

/**
 * Service de base de connaissances personnelle
 * Indexe automatiquement les conversations pour permettre la recherche sémantique
 * et la récupération de contexte long-terme
 * Phase 2: Mémoire Long-Terme
 */
class PersonalKnowledgeBaseService {
    constructor() {
        this.db = null;
        this.embeddingDimensions = 384; // Default pour mock/local models
        this.maxChunkSize = 500; // Max caractères par chunk
        this.chunkOverlap = 50; // Overlap entre chunks
    }

    /**
     * Initialise le service
     */
    async initialize() {
        this.db = sqliteClient.getDb();

        // Initialiser l'embedding provider
        try {
            await embeddingProvider.initialize();
            console.log('[PersonalKnowledgeBaseService] Embedding provider initialized');
        } catch (error) {
            console.warn('[PersonalKnowledgeBaseService] Embedding provider initialization failed:', error.message);
        }

        console.log('[PersonalKnowledgeBaseService] Service initialized');
    }

    /**
     * Index une conversation complète dans la base de connaissances
     * @param {string} sessionId - ID de la session
     * @param {string} userId - ID de l'utilisateur
     * @param {Object} options - Options d'indexation
     * @returns {Promise<Object>} Résultat de l'indexation
     */
    async indexConversation(sessionId, userId, options = {}) {
        try {
            if (!this.db) await this.initialize();

            // Récupérer les messages de la session
            const messages = await this.getSessionMessages(sessionId);
            if (messages.length === 0) {
                console.log('[PersonalKnowledgeBaseService] No messages to index');
                return { success: false, reason: 'no_messages' };
            }

            // Récupérer les métadonnées de la session
            const session = await this.getSession(sessionId);
            const sessionTitle = session?.title || `Session ${sessionId.substring(0, 8)}`;

            // Chunker les messages
            const chunks = await this.chunkMessages(messages);
            console.log(`[PersonalKnowledgeBaseService] Created ${chunks.length} chunks from ${messages.length} messages`);

            let indexedCount = 0;
            let skippedCount = 0;

            // Indexer chaque chunk
            for (const chunk of chunks) {
                try {
                    // Générer embedding
                    const embedding = await embeddingProvider.generateEmbedding(chunk.text);

                    // Stocker dans auto_indexed_content
                    const chunkId = uuidv4();
                    const createdAt = Math.floor(Date.now() / 1000);

                    const stmt = this.db.prepare(`
                        INSERT INTO auto_indexed_content (
                            id, uid, source_type, source_id, source_title,
                            content, content_summary, embedding,
                            importance_score, auto_generated,
                            indexed_at, created_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `);

                    stmt.run(
                        chunkId,
                        userId,
                        'conversation',
                        sessionId,
                        sessionTitle,
                        chunk.text,
                        chunk.text.substring(0, 200), // Summary = first 200 chars
                        JSON.stringify(embedding),
                        chunk.importance || 0.5,
                        1,
                        createdAt,
                        createdAt
                    );

                    indexedCount++;
                } catch (chunkError) {
                    console.warn(`[PersonalKnowledgeBaseService] Error indexing chunk:`, chunkError.message);
                    skippedCount++;
                }
            }

            // Mettre à jour les statistiques
            await this.updateMemoryStats(userId, {
                conversations_indexed: 1,
                elementsAdded: indexedCount
            });

            console.log(`[PersonalKnowledgeBaseService] ✅ Indexed session ${sessionId}: ${indexedCount} chunks (${skippedCount} skipped)`);

            return {
                success: true,
                sessionId,
                chunksIndexed: indexedCount,
                chunksSkipped: skippedCount
            };

        } catch (error) {
            console.error('[PersonalKnowledgeBaseService] Error indexing conversation:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Chunke les messages en morceaux de taille appropriée
     * @param {Array} messages - Liste des messages
     * @returns {Array} Liste de chunks
     */
    async chunkMessages(messages) {
        const chunks = [];

        for (const msg of messages) {
            const role = msg.role === 'user' ? 'User' : 'Assistant';
            const content = msg.content;

            // Si le message est court, 1 chunk suffit
            if (content.length <= this.maxChunkSize) {
                chunks.push({
                    text: `${role}: ${content}`,
                    importance: msg.role === 'assistant' ? 0.6 : 0.4 // Assistant messages more important
                });
                continue;
            }

            // Sinon, découper en chunks avec overlap
            const words = content.split(/\s+/);
            let currentChunk = [];
            let currentLength = 0;

            for (const word of words) {
                const wordLength = word.length + 1; // +1 pour l'espace

                if (currentLength + wordLength > this.maxChunkSize && currentChunk.length > 0) {
                    // Créer le chunk
                    chunks.push({
                        text: `${role}: ${currentChunk.join(' ')}`,
                        importance: msg.role === 'assistant' ? 0.6 : 0.4
                    });

                    // Overlap : garder les derniers mots
                    const overlapWords = Math.min(10, Math.floor(currentChunk.length / 2));
                    currentChunk = currentChunk.slice(-overlapWords);
                    currentLength = currentChunk.join(' ').length;
                }

                currentChunk.push(word);
                currentLength += wordLength;
            }

            // Dernier chunk
            if (currentChunk.length > 0) {
                chunks.push({
                    text: `${role}: ${currentChunk.join(' ')}`,
                    importance: msg.role === 'assistant' ? 0.6 : 0.4
                });
            }
        }

        return chunks;
    }

    /**
     * Recherche sémantique dans la base de connaissances personnelle
     * @param {string} query - La requête de recherche
     * @param {string} userId - ID de l'utilisateur
     * @param {Object} options - Options de recherche
     * @returns {Promise<Array>} Résultats de recherche
     */
    async semanticSearch(query, userId, options = {}) {
        try {
            if (!this.db) await this.initialize();

            const {
                topK = 5,
                minScore = 0.7,
                sourceTypes = ['conversation', 'learning_event'],
                freshnessBoost = true
            } = options;

            // Générer embedding de la requête
            const queryEmbedding = await embeddingProvider.generateEmbedding(query);

            // Récupérer tous les contenus indexés de l'utilisateur
            const stmt = this.db.prepare(`
                SELECT
                    id, source_type, source_id, source_title,
                    content, content_summary, embedding,
                    importance_score, indexed_at, created_at
                FROM auto_indexed_content
                WHERE uid = ?
                  AND source_type IN (${sourceTypes.map(() => '?').join(',')})
                ORDER BY created_at DESC
                LIMIT 1000
            `);

            const contents = stmt.all(userId, ...sourceTypes);

            // Calculer similarités
            const results = [];
            for (const content of contents) {
                try {
                    const contentEmbedding = JSON.parse(content.embedding);
                    const similarity = this.cosineSimilarity(queryEmbedding, contentEmbedding);

                    // Appliquer le boost de fraîcheur si demandé
                    let finalScore = similarity;
                    if (freshnessBoost) {
                        const ageInDays = (Date.now() / 1000 - content.indexed_at) / (24 * 60 * 60);
                        const freshnessMultiplier = Math.max(0.5, 1.0 - (ageInDays / 90)); // Décroissance sur 90 jours
                        finalScore = similarity * (0.7 + 0.3 * freshnessMultiplier);
                    }

                    if (finalScore >= minScore) {
                        results.push({
                            id: content.id,
                            sourceType: content.source_type,
                            sourceId: content.source_id,
                            sourceTitle: content.source_title,
                            content: content.content,
                            summary: content.content_summary,
                            score: finalScore,
                            rawSimilarity: similarity,
                            importance: content.importance_score,
                            indexedAt: content.indexed_at
                        });
                    }
                } catch (embError) {
                    // Skip ce contenu si erreur de parsing embedding
                }
            }

            // Trier par score et limiter
            results.sort((a, b) => b.score - a.score);
            const topResults = results.slice(0, topK);

            console.log(`[PersonalKnowledgeBaseService] Semantic search: found ${topResults.length} relevant chunks (${results.length} above threshold)`);

            return topResults;

        } catch (error) {
            console.error('[PersonalKnowledgeBaseService] Error in semantic search:', error);
            return [];
        }
    }

    /**
     * Calcule la similarité cosinus entre deux vecteurs
     * @param {Array} vecA - Premier vecteur
     * @param {Array} vecB - Deuxième vecteur
     * @returns {number} Similarité (0-1)
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
     * Récupère du contexte pertinent depuis la mémoire long-terme
     * @param {string} query - La question actuelle
     * @param {string} userId - ID de l'utilisateur
     * @param {Object} options - Options
     * @returns {Promise<Object>} Contexte enrichi
     */
    async retrieveLongTermContext(query, userId, options = {}) {
        try {
            const results = await this.semanticSearch(query, userId, {
                topK: 3,
                minScore: 0.75,
                freshnessBoost: true,
                ...options
            });

            if (results.length === 0) {
                return {
                    hasContext: false,
                    sources: [],
                    contextText: ''
                };
            }

            // Formater le contexte
            let contextText = '\n\n## Relevant Context from Your History\n';
            results.forEach((result, idx) => {
                contextText += `\n**[${idx + 1}]** (from ${result.sourceTitle}, relevance: ${Math.round(result.score * 100)}%)\n`;
                contextText += `${result.summary || result.content.substring(0, 200)}...\n`;
            });

            return {
                hasContext: true,
                sources: results,
                contextText,
                totalTokens: this.estimateTokens(contextText)
            };

        } catch (error) {
            console.error('[PersonalKnowledgeBaseService] Error retrieving long-term context:', error);
            return {
                hasContext: false,
                sources: [],
                contextText: ''
            };
        }
    }

    /**
     * Estime le nombre de tokens dans un texte
     */
    estimateTokens(text) {
        return Math.ceil(text.length / 4);
    }

    /**
     * Met à jour les statistiques de mémoire
     */
    async updateMemoryStats(userId, updates) {
        try {
            if (!this.db) await this.initialize();

            // Récupérer les stats actuelles
            const stmt = this.db.prepare('SELECT * FROM memory_stats WHERE uid = ?');
            const currentStats = stmt.get(userId);

            if (currentStats) {
                // Update
                const updateFields = [];
                const values = [];

                if (updates.conversations_indexed) {
                    updateFields.push('conversations_indexed = conversations_indexed + ?');
                    values.push(updates.conversations_indexed);
                }
                if (updates.elementsAdded) {
                    updateFields.push('total_elements = total_elements + ?');
                    values.push(updates.elementsAdded);
                }

                updateFields.push('last_indexed_at = ?', 'updated_at = ?');
                const now = Math.floor(Date.now() / 1000);
                values.push(now, now, userId);

                const updateStmt = this.db.prepare(`
                    UPDATE memory_stats
                    SET ${updateFields.join(', ')}
                    WHERE uid = ?
                `);
                updateStmt.run(...values);
            } else {
                // Insert
                const now = Math.floor(Date.now() / 1000);
                const insertStmt = this.db.prepare(`
                    INSERT INTO memory_stats (
                        uid, total_elements, conversations_indexed,
                        last_indexed_at, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?)
                `);
                insertStmt.run(
                    userId,
                    updates.elementsAdded || 0,
                    updates.conversations_indexed || 0,
                    now,
                    now,
                    now
                );
            }

            return true;
        } catch (error) {
            console.error('[PersonalKnowledgeBaseService] Error updating memory stats:', error);
            return false;
        }
    }

    /**
     * Récupère les statistiques de mémoire
     */
    async getMemoryStats(userId) {
        try {
            if (!this.db) await this.initialize();

            const stmt = this.db.prepare('SELECT * FROM memory_stats WHERE uid = ?');
            return stmt.get(userId);
        } catch (error) {
            console.error('[PersonalKnowledgeBaseService] Error getting memory stats:', error);
            return null;
        }
    }

    /**
     * Récupère les messages d'une session
     */
    async getSessionMessages(sessionId) {
        try {
            if (!this.db) await this.initialize();

            const stmt = this.db.prepare(`
                SELECT role, content, created_at
                FROM ai_messages
                WHERE session_id = ?
                ORDER BY created_at ASC
            `);

            return stmt.all(sessionId);
        } catch (error) {
            console.error('[PersonalKnowledgeBaseService] Error getting session messages:', error);
            return [];
        }
    }

    /**
     * Récupère une session
     */
    async getSession(sessionId) {
        try {
            if (!this.db) await this.initialize();

            const stmt = this.db.prepare('SELECT * FROM sessions WHERE id = ?');
            return stmt.get(sessionId);
        } catch (error) {
            console.error('[PersonalKnowledgeBaseService] Error getting session:', error);
            return null;
        }
    }

    /**
     * Nettoie les anciennes entrées (> 90 jours)
     * @param {string} userId - ID de l'utilisateur
     * @returns {Promise<number>} Nombre d'entrées supprimées
     */
    async cleanupOldEntries(userId, daysToKeep = 90) {
        try {
            if (!this.db) await this.initialize();

            const timestampLimit = Math.floor(Date.now() / 1000) - (daysToKeep * 24 * 60 * 60);

            const stmt = this.db.prepare(`
                DELETE FROM auto_indexed_content
                WHERE uid = ?
                  AND indexed_at < ?
                  AND source_type = 'conversation'
            `);

            const result = stmt.run(userId, timestampLimit);

            if (result.changes > 0) {
                console.log(`[PersonalKnowledgeBaseService] Cleaned up ${result.changes} old entries for user ${userId}`);
            }

            return result.changes;
        } catch (error) {
            console.error('[PersonalKnowledgeBaseService] Error cleaning up old entries:', error);
            return 0;
        }
    }

    /**
     * Batch indexation de toutes les sessions récentes
     * @param {string} userId - ID de l'utilisateur
     * @param {number} daysBack - Nombre de jours à indexer
     */
    async batchIndexRecentSessions(userId, daysBack = 30) {
        try {
            if (!this.db) await this.initialize();

            const timestampLimit = Math.floor(Date.now() / 1000) - (daysBack * 24 * 60 * 60);

            // Récupérer les sessions non-indexées
            const stmt = this.db.prepare(`
                SELECT DISTINCT s.id, s.started_at, s.title
                FROM sessions s
                LEFT JOIN auto_indexed_content aic ON s.id = aic.source_id AND aic.source_type = 'conversation'
                WHERE s.uid = ?
                  AND s.started_at >= ?
                  AND aic.id IS NULL
                ORDER BY s.started_at DESC
                LIMIT 50
            `);

            const sessions = stmt.all(userId, timestampLimit);
            console.log(`[PersonalKnowledgeBaseService] Batch indexing ${sessions.length} unindexed sessions`);

            let successCount = 0;
            for (const session of sessions) {
                const result = await this.indexConversation(session.id, userId);
                if (result.success) {
                    successCount++;
                }
                // Délai entre indexations
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            console.log(`[PersonalKnowledgeBaseService] ✅ Batch indexing complete: ${successCount}/${sessions.length} sessions indexed`);
            return { total: sessions.length, indexed: successCount };

        } catch (error) {
            console.error('[PersonalKnowledgeBaseService] Error in batch indexing:', error);
            return { total: 0, indexed: 0 };
        }
    }
}

// Export singleton instance
const personalKnowledgeBaseService = new PersonalKnowledgeBaseService();
module.exports = personalKnowledgeBaseService;
