/**
 * Phase 4: Document Management Service
 *
 * Manages document upload, extraction, storage, and CRUD operations.
 * Supports: TXT, MD, PDF, DOCX files.
 */

const fs = require('fs').promises;
const path = require('path');
const { loaders } = require('../utils/dependencyLoader');
const uuid = loaders.loadUuid();
const uuidv4 = uuid.v4;
const { DocumentValidator, QueryValidator } = require('../utils/validators');

/**
 * @class DocumentService
 * @description Service for managing knowledge base documents
 */
class DocumentService {
    constructor() {
        this.documentsRepository = null;
        this.chunksRepository = null;
        console.log('[DocumentService] Service initialized');
    }

    /**
     * Initialize service with repositories
     * @param {Object} documentsRepo - Documents repository
     * @param {Object} chunksRepo - Document chunks repository
     */
    initialize(documentsRepo, chunksRepo) {
        this.documentsRepository = documentsRepo;
        this.chunksRepository = chunksRepo;
        console.log('[DocumentService] Repositories connected');
    }

    /**
     * Get all documents for a user
     * @param {string} uid - User ID
     * @param {Object} options - Query options (limit, offset, sortBy, order)
     * @returns {Promise<Array>} Array of documents
     */
    async getAllDocuments(uid, options = {}) {
        const {
            limit = 50,
            offset = 0,
            sortBy = 'created_at',
            order = 'DESC'
        } = options;

        console.log(`[DocumentService] Getting documents for user: ${uid}`);

        try {
            // Validate sortBy to prevent SQL injection
            const ALLOWED_SORT_COLUMNS = ['created_at', 'updated_at', 'title', 'filename', 'file_size', 'file_type'];
            const validSortBy = ALLOWED_SORT_COLUMNS.includes(sortBy) ? sortBy : 'created_at';

            // Validate order to prevent SQL injection
            const ALLOWED_ORDERS = ['ASC', 'DESC'];
            const validOrder = ALLOWED_ORDERS.includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';

            // Query documents from database
            const query = `
                SELECT
                    id, uid, title, filename, file_type, file_size,
                    tags, description, chunk_count, indexed,
                    created_at, updated_at
                FROM documents
                WHERE uid = ?
                ORDER BY ${validSortBy} ${validOrder}
                LIMIT ? OFFSET ?
            `;

            const documents = await this.documentsRepository.query(query, [uid, limit, offset]);

            // Parse JSON tags
            return documents.map(doc => ({
                ...doc,
                tags: doc.tags ? JSON.parse(doc.tags) : []
            }));
        } catch (error) {
            console.error('[DocumentService] Error getting documents:', error);
            throw error;
        }
    }

    /**
     * Get a single document by ID
     * @param {string} documentId - Document ID
     * @param {boolean} includeContent - Include full text content
     * @returns {Promise<Object|null>} Document object or null
     */
    async getDocument(documentId, includeContent = false) {
        console.log(`[DocumentService] Getting document: ${documentId}`);

        try {
            const columns = includeContent
                ? '*'
                : 'id, uid, title, filename, file_type, file_size, tags, description, chunk_count, indexed, created_at, updated_at';

            const query = `SELECT ${columns} FROM documents WHERE id = ?`;
            const result = await this.documentsRepository.queryOne(query, [documentId]);

            if (!result) return null;

            return {
                ...result,
                tags: result.tags ? JSON.parse(result.tags) : []
            };
        } catch (error) {
            console.error('[DocumentService] Error getting document:', error);
            throw error;
        }
    }

    /**
     * Search documents by title, filename, or content
     * @param {string} uid - User ID
     * @param {string} query - Search query
     * @param {Object} filters - Additional filters (file_type, tags)
     * @returns {Promise<Array>} Matching documents
     */
    async searchDocuments(uid, query, filters = {}) {
        console.log(`[DocumentService] Searching documents for "${query}"`);

        try {
            let sql = `
                SELECT
                    id, uid, title, filename, file_type, file_size,
                    tags, description, chunk_count, indexed,
                    created_at, updated_at
                FROM documents
                WHERE uid = ?
                AND (
                    title LIKE ? OR
                    filename LIKE ? OR
                    description LIKE ? OR
                    content LIKE ?
                )
            `;

            const params = [uid, `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`];

            // Add file type filter
            if (filters.file_type) {
                sql += ' AND file_type = ?';
                params.push(filters.file_type);
            }

            // Add tags filter
            if (filters.tags && filters.tags.length > 0) {
                const tagConditions = filters.tags.map(() => 'tags LIKE ?').join(' OR ');
                sql += ` AND (${tagConditions})`;
                filters.tags.forEach(tag => params.push(`%"${tag}"%`));
            }

            sql += ' ORDER BY created_at DESC';

            const documents = await this.documentsRepository.query(sql, params);

            return documents.map(doc => ({
                ...doc,
                tags: doc.tags ? JSON.parse(doc.tags) : []
            }));
        } catch (error) {
            console.error('[DocumentService] Error searching documents:', error);
            throw error;
        }
    }

    /**
     * Upload and process a new document
     * @param {string} uid - User ID
     * @param {Object} fileData - File data { filename, filepath, buffer }
     * @param {Object} metadata - Optional metadata { title, tags, description }
     * @returns {Promise<Object>} Created document
     */
    async uploadDocument(uid, fileData, metadata = {}) {
        const { filename, filepath, buffer } = fileData;
        const fileType = this._getFileType(filename);

        console.log(`[DocumentService] Uploading document: ${filename} (${fileType})`);

        try {
            // Validate file data
            const fileValidation = DocumentValidator.validateFile(fileData);
            if (!fileValidation.valid) {
                throw new Error(`Invalid file data: ${fileValidation.errors.join(', ')}`);
            }

            // Validate metadata
            const metadataValidation = DocumentValidator.validateMetadata(metadata);
            if (!metadataValidation.valid) {
                console.warn('[DocumentService] Invalid metadata:', metadataValidation.errors);
                // Continue with sanitized metadata (non-blocking)
            }

            // Extract text content
            const content = await this._extractText(filepath || buffer, fileType);

            // Generate document ID
            const documentId = uuidv4();
            const now = Date.now();

            // Prepare document data
            const document = {
                id: documentId,
                uid,
                title: metadata.title || this._generateTitle(filename),
                filename,
                file_type: fileType,
                file_size: buffer ? buffer.length : (await fs.stat(filepath)).size,
                file_path: filepath || null,
                content,
                tags: JSON.stringify(metadata.tags || []),
                description: metadata.description || null,
                chunk_count: 0,
                indexed: 0,
                created_at: now,
                updated_at: now,
                sync_state: 'clean'
            };

            // Insert into database
            await this.documentsRepository.create(document);

            console.log(`[DocumentService] Document uploaded: ${documentId}`);

            return {
                ...document,
                tags: metadata.tags || []
            };
        } catch (error) {
            console.error('[DocumentService] Error uploading document:', error);
            throw error;
        }
    }

    /**
     * Update document metadata
     * @param {string} documentId - Document ID
     * @param {Object} metadata - Updated metadata { title, tags, description }
     * @returns {Promise<boolean>} Success status
     */
    async updateDocument(documentId, metadata) {
        console.log(`[DocumentService] Updating document: ${documentId}`);

        try {
            const updates = {};

            if (metadata.title) updates.title = metadata.title;
            if (metadata.tags) updates.tags = JSON.stringify(metadata.tags);
            if (metadata.description !== undefined) updates.description = metadata.description;

            updates.updated_at = Date.now();

            const query = `
                UPDATE documents
                SET ${Object.keys(updates).map(k => `${k} = ?`).join(', ')}
                WHERE id = ?
            `;

            await this.documentsRepository.execute(query, [...Object.values(updates), documentId]);

            console.log(`[DocumentService] Document updated: ${documentId}`);
            return true;
        } catch (error) {
            console.error('[DocumentService] Error updating document:', error);
            throw error;
        }
    }

    /**
     * Delete a document and all its chunks
     * @param {string} documentId - Document ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteDocument(documentId) {
        console.log(`[DocumentService] Deleting document: ${documentId}`);

        try {
            // Delete chunks first
            await this.chunksRepository.execute(
                'DELETE FROM document_chunks WHERE document_id = ?',
                [documentId]
            );

            // Delete document
            await this.documentsRepository.execute(
                'DELETE FROM documents WHERE id = ?',
                [documentId]
            );

            console.log(`[DocumentService] Document deleted: ${documentId}`);
            return true;
        } catch (error) {
            console.error('[DocumentService] Error deleting document:', error);
            throw error;
        }
    }

    /**
     * Get document statistics for a user
     * @param {string} uid - User ID
     * @returns {Promise<Object>} Statistics
     */
    async getDocumentStats(uid) {
        console.log(`[DocumentService] Getting document stats for user: ${uid}`);

        try {
            const query = `
                SELECT
                    COUNT(*) as total_documents,
                    SUM(file_size) as total_size,
                    SUM(chunk_count) as total_chunks,
                    SUM(CASE WHEN indexed = 1 THEN 1 ELSE 0 END) as indexed_documents,
                    COUNT(DISTINCT file_type) as file_types
                FROM documents
                WHERE uid = ?
            `;

            const stats = await this.documentsRepository.queryOne(query, [uid]);

            return {
                total_documents: stats.total_documents || 0,
                total_size: stats.total_size || 0,
                total_chunks: stats.total_chunks || 0,
                indexed_documents: stats.indexed_documents || 0,
                file_types: stats.file_types || 0
            };
        } catch (error) {
            console.error('[DocumentService] Error getting stats:', error);
            throw error;
        }
    }

    /**
     * Extract text from file based on type
     * @private
     * @param {string|Buffer} source - File path or buffer
     * @param {string} fileType - File type
     * @returns {Promise<string>} Extracted text
     */
    async _extractText(source, fileType) {
        try {
            switch (fileType) {
                case 'txt':
                case 'md':
                    return await this._extractTextFile(source);

                case 'pdf':
                    return await this._extractPDF(source);

                case 'docx':
                    return await this._extractDOCX(source);

                default:
                    throw new Error(`Unsupported file type: ${fileType}`);
            }
        } catch (error) {
            console.error('[DocumentService] Error extracting text:', error);
            throw error;
        }
    }

    /**
     * Extract text from TXT/MD file
     * @private
     */
    async _extractTextFile(source) {
        if (Buffer.isBuffer(source)) {
            return source.toString('utf-8');
        }
        return await fs.readFile(source, 'utf-8');
    }

    /**
     * Extract text from PDF
     * @private
     * Uses pdf-parse library to extract text content from PDF files
     */
    async _extractPDF(source) {
        try {
            const pdfParse = require('pdf-parse');

            let dataBuffer;
            if (Buffer.isBuffer(source)) {
                dataBuffer = source;
            } else {
                dataBuffer = await fs.readFile(source);
            }

            const data = await pdfParse(dataBuffer);

            console.log(`[DocumentService] PDF extracted: ${data.numpages} pages, ${data.text.length} characters`);

            return data.text;
        } catch (error) {
            console.error('[DocumentService] Error extracting PDF:', error);
            throw new Error(`Failed to extract PDF content: ${error.message}`);
        }
    }

    /**
     * Extract text from DOCX
     * @private
     * Uses mammoth library to extract text content from DOCX files
     */
    async _extractDOCX(source) {
        try {
            const mammoth = require('mammoth');

            let result;
            if (Buffer.isBuffer(source)) {
                result = await mammoth.extractRawText({ buffer: source });
            } else {
                result = await mammoth.extractRawText({ path: source });
            }

            console.log(`[DocumentService] DOCX extracted: ${result.value.length} characters`);

            if (result.messages && result.messages.length > 0) {
                console.warn('[DocumentService] DOCX extraction warnings:', result.messages);
            }

            return result.value;
        } catch (error) {
            console.error('[DocumentService] Error extracting DOCX:', error);
            throw new Error(`Failed to extract DOCX content: ${error.message}`);
        }
    }

    /**
     * Get file type from filename
     * @private
     */
    _getFileType(filename) {
        const ext = path.extname(filename).toLowerCase().slice(1);
        return ext;
    }

    /**
     * Generate title from filename
     * @private
     */
    _generateTitle(filename) {
        return path.basename(filename, path.extname(filename))
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
    }
}

// Singleton instance
const documentService = new DocumentService();

module.exports = documentService;
