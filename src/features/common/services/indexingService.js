/**
 * Phase 4: Indexing Service
 *
 * Handles document chunking, embedding generation, and semantic search.
 * Supports multiple embedding providers (OpenAI, local models).
 */

const { loaders } = require('../utils/dependencyLoader');
const uuid = loaders.loadUuid();
const uuidv4 = uuid.v4;
const { estimateTokens } = require('../utils/tokenUtils');

/**
 * @class IndexingService
 * @description Service for indexing documents with embeddings for semantic search
 */
class IndexingService {
    constructor() {
        this.chunksRepository = null;
        this.embeddingProvider = null; // Will be set based on user settings
        this.CHUNK_SIZE = 500; // Characters per chunk
        this.CHUNK_OVERLAP = 100; // Overlap between chunks
        console.log('[IndexingService] Service initialized');
    }

    /**
     * Initialize service with repository
     * @param {Object} chunksRepo - Document chunks repository
     */
    initialize(chunksRepo) {
        this.chunksRepository = chunksRepo;
        console.log('[IndexingService] Repository connected');
    }

    /**
     * Chunk and index a document
     * @param {string} documentId - Document ID
     * @param {string} content - Document text content
     * @param {Object} options - Chunking options
     * @returns {Promise<Object>} Indexing result
     */
    async indexDocument(documentId, content, options = {}) {
        const {
            chunkSize = this.CHUNK_SIZE,
            chunkOverlap = this.CHUNK_OVERLAP,
            generateEmbeddings = true
        } = options;

        console.log(`[IndexingService] Indexing document: ${documentId}`);

        try {
            // Delete existing chunks for this document
            await this._deleteChunks(documentId);

            // Split content into chunks
            const chunks = this._chunkText(content, chunkSize, chunkOverlap);

            console.log(`[IndexingService] Created ${chunks.length} chunks`);

            // Generate embeddings if requested
            let chunkObjects = [];
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                let embedding = null;

                if (generateEmbeddings) {
                    embedding = await this._generateEmbedding(chunk.content);
                }

                const chunkObj = {
                    id: uuidv4(),
                    document_id: documentId,
                    chunk_index: i,
                    content: chunk.content,
                    char_start: chunk.start,
                    char_end: chunk.end,
                    token_count: estimateTokens(chunk.content),
                    embedding: embedding ? JSON.stringify(embedding) : null,
                    created_at: Date.now(),
                    sync_state: 'clean'
                };

                chunkObjects.push(chunkObj);
            }

            // Insert chunks into database
            await this._insertChunks(chunkObjects);

            console.log(`[IndexingService] Document indexed: ${documentId} (${chunkObjects.length} chunks)`);

            return {
                document_id: documentId,
                chunk_count: chunkObjects.length,
                indexed: generateEmbeddings,
                total_tokens: chunkObjects.reduce((sum, c) => sum + c.token_count, 0)
            };
        } catch (error) {
            console.error('[IndexingService] Error indexing document:', error);
            throw error;
        }
    }

    /**
     * Search for relevant chunks using semantic similarity
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {Promise<Array>} Relevant chunks with scores
     */
    async semanticSearch(query, options = {}) {
        const {
            limit = 5,
            minScore = 0.7,
            documentIds = null // Filter by specific documents
        } = options;

        console.log(`[IndexingService] Semantic search for: "${query}"`);

        try {
            // Generate query embedding
            const queryEmbedding = await this._generateEmbedding(query);

            if (!queryEmbedding) {
                console.warn('[IndexingService] No embedding generated for query, falling back to keyword search');
                return await this._keywordSearch(query, options);
            }

            // Get chunks (limited to 1000 most recent for performance)
            let sql = 'SELECT * FROM document_chunks WHERE embedding IS NOT NULL';
            const params = [];

            if (documentIds && documentIds.length > 0) {
                sql += ` AND document_id IN (${documentIds.map(() => '?').join(',')})`;
                params.push(...documentIds);
            }

            // Limit to 1000 most recent chunks to avoid memory issues
            sql += ' ORDER BY created_at DESC LIMIT 1000';

            const chunks = await this.chunksRepository.query(sql, params);

            // Calculate similarity scores
            const results = chunks.map(chunk => {
                const chunkEmbedding = JSON.parse(chunk.embedding);
                const score = this._cosineSimilarity(queryEmbedding, chunkEmbedding);

                return {
                    ...chunk,
                    relevance_score: score,
                    embedding: undefined // Don't return embedding in results
                };
            });

            // Filter by minimum score and sort
            const filtered = results
                .filter(r => r.relevance_score >= minScore)
                .sort((a, b) => b.relevance_score - a.relevance_score)
                .slice(0, limit);

            console.log(`[IndexingService] Found ${filtered.length} relevant chunks`);

            return filtered;
        } catch (error) {
            console.error('[IndexingService] Error in semantic search:', error);
            // Fallback to keyword search
            return await this._keywordSearch(query, options);
        }
    }

    /**
     * Get chunks for a specific document
     * @param {string} documentId - Document ID
     * @returns {Promise<Array>} Document chunks in order
     */
    async getDocumentChunks(documentId) {
        console.log(`[IndexingService] Getting chunks for document: ${documentId}`);

        try {
            const query = 'SELECT * FROM document_chunks WHERE document_id = ? ORDER BY chunk_index ASC';
            const chunks = await this.chunksRepository.query(query, [documentId]);

            return chunks.map(chunk => ({
                ...chunk,
                embedding: undefined // Don't return embedding
            }));
        } catch (error) {
            console.error('[IndexingService] Error getting chunks:', error);
            throw error;
        }
    }

    /**
     * Re-index a document (regenerate embeddings)
     * @param {string} documentId - Document ID
     * @param {string} content - Document content
     * @returns {Promise<Object>} Indexing result
     */
    async reindexDocument(documentId, content) {
        console.log(`[IndexingService] Re-indexing document: ${documentId}`);
        return await this.indexDocument(documentId, content, { generateEmbeddings: true });
    }

    /**
     * Set embedding provider
     * @param {Object} provider - Embedding provider with generateEmbedding method
     */
    setEmbeddingProvider(provider) {
        this.embeddingProvider = provider;
        console.log('[IndexingService] Embedding provider set');
    }

    /**
     * Chunk text into overlapping segments
     * @private
     * @param {string} text - Text to chunk
     * @param {number} size - Chunk size in characters
     * @param {number} overlap - Overlap size
     * @returns {Array} Chunks with start/end positions
     */
    _chunkText(text, size, overlap) {
        const chunks = [];
        let start = 0;

        while (start < text.length) {
            const end = Math.min(start + size, text.length);
            const content = text.slice(start, end).trim();

            if (content.length > 0) {
                chunks.push({
                    content,
                    start,
                    end
                });
            }

            start += size - overlap;
        }

        return chunks;
    }

    /**
     * Generate embedding for text
     * @private
     * @param {string} text - Text to embed
     * @returns {Promise<Array|null>} Embedding vector or null
     */
    async _generateEmbedding(text) {
        if (!this.embeddingProvider) {
            console.warn('[IndexingService] No embedding provider configured');
            return null;
        }

        try {
            return await this.embeddingProvider.generateEmbedding(text);
        } catch (error) {
            console.error('[IndexingService] Error generating embedding:', error);
            return null;
        }
    }

    /**
     * Calculate cosine similarity between two vectors
     * @private
     * @param {Array} a - Vector A
     * @param {Array} b - Vector B
     * @returns {number} Similarity score (0-1)
     */
    _cosineSimilarity(a, b) {
        if (!a || !b || a.length !== b.length) return 0;

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        if (normA === 0 || normB === 0) return 0;

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    /**
     * Keyword-based search fallback
     * @private
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {Promise<Array>} Matching chunks
     */
    async _keywordSearch(query, options = {}) {
        const { limit = 5, documentIds = null } = options;

        console.log(`[IndexingService] Keyword search fallback for: "${query}"`);

        try {
            let sql = 'SELECT * FROM document_chunks WHERE content LIKE ?';
            const params = [`%${query}%`];

            if (documentIds && documentIds.length > 0) {
                sql += ` AND document_id IN (${documentIds.map(() => '?').join(',')})`;
                params.push(...documentIds);
            }

            sql += ' LIMIT ?';
            params.push(limit);

            const chunks = await this.chunksRepository.query(sql, params);

            return chunks.map(chunk => ({
                ...chunk,
                relevance_score: 0.5, // Default score for keyword match
                embedding: undefined
            }));
        } catch (error) {
            console.error('[IndexingService] Error in keyword search:', error);
            return [];
        }
    }

    /**
     * Delete all chunks for a document
     * @private
     */
    async _deleteChunks(documentId) {
        await this.chunksRepository.execute(
            'DELETE FROM document_chunks WHERE document_id = ?',
            [documentId]
        );
    }

    /**
     * Insert chunks into database (batch insert for performance)
     * @private
     */
    async _insertChunks(chunks) {
        if (chunks.length === 0) return;

        // Batch insert: all chunks in one query
        const columns = Object.keys(chunks[0]).join(', ');
        const placeholderRow = `(${Object.keys(chunks[0]).map(() => '?').join(', ')})`;
        const allPlaceholders = chunks.map(() => placeholderRow).join(', ');

        const query = `INSERT INTO document_chunks (${columns}) VALUES ${allPlaceholders}`;
        const allValues = chunks.flatMap(chunk => Object.values(chunk));

        await this.chunksRepository.execute(query, allValues);
    }
}

// Singleton instance
const indexingService = new IndexingService();

module.exports = indexingService;
