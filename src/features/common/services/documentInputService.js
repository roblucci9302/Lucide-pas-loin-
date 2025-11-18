/**
 * Document Input Service - Phase 5: Advanced Document Management (INPUT)
 *
 * Handles advanced document parsing and upload:
 * - PDF: text + images + tables (pdf-parse, pdf2pic)
 * - Excel: sheets + data + formulas (xlsx)
 * - PowerPoint: slides + images + notes
 * - Images: OCR (Tesseract.js)
 * - DOCX: text + images + tables (mammoth)
 *
 * Features:
 * - Drag & drop upload
 * - Multi-file batch processing
 * - Preview generation
 * - Security validation
 * - Metadata extraction
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { loaders } = require('../utils/dependencyLoader');
const uuid = loaders.loadUuid();
const uuidv4 = uuid.v4;

// Lazy load heavy dependencies to improve startup time
let pdfParse = null;
let XLSX = null;
let mammoth = null;
let Tesseract = null;

/**
 * @class DocumentInputService
 * @description Advanced document parsing and upload service
 */
class DocumentInputService {
    constructor() {
        this.documentsRepository = null;
        this.chunksRepository = null;
        this.uploadDir = path.join(process.cwd(), 'data', 'uploads');
        this.maxFileSize = 50 * 1024 * 1024; // 50MB

        // Allowed MIME types (whitelist)
        this.allowedTypes = {
            'application/pdf': { ext: '.pdf', parser: 'parsePDF' },
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: '.docx', parser: 'parseDOCX' },
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { ext: '.xlsx', parser: 'parseExcel' },
            'application/vnd.ms-excel': { ext: '.xls', parser: 'parseExcel' },
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': { ext: '.pptx', parser: 'parsePowerPoint' },
            'text/plain': { ext: '.txt', parser: 'parseText' },
            'text/markdown': { ext: '.md', parser: 'parseText' },
            'image/png': { ext: '.png', parser: 'parseImageOCR' },
            'image/jpeg': { ext: '.jpg', parser: 'parseImageOCR' },
            'image/jpg': { ext: '.jpg', parser: 'parseImageOCR' }
        };

        console.log('[DocumentInputService] Service initialized');
        this.ensureUploadDir();
    }

    /**
     * Initialize service with repositories
     */
    initialize(documentsRepo, chunksRepo) {
        this.documentsRepository = documentsRepo;
        this.chunksRepository = chunksRepo;
        console.log('[DocumentInputService] Repositories connected');
    }

    /**
     * Ensure upload directory exists
     */
    async ensureUploadDir() {
        try {
            await fs.mkdir(this.uploadDir, { recursive: true });
        } catch (error) {
            console.error('[DocumentInputService] Failed to create upload directory:', error);
        }
    }

    /**
     * Process uploaded file with advanced parsing
     * @param {Object} file - File object { name, size, type, buffer }
     * @param {string} userId - User ID
     * @param {Object} options - Processing options
     * @returns {Promise<Object>} Processed document result
     */
    async processFile(file, userId, options = {}) {
        console.log(`[DocumentInputService] Processing file: ${file.name} (${file.type})`);

        try {
            // 1. Validate file
            await this.validateFile(file);

            // 2. Save file to disk
            const savedFile = await this.saveFile(file, userId);

            // 3. Parse content based on type
            const content = await this.extractContent(savedFile, file.type);

            // 4. Extract metadata
            const metadata = await this.extractMetadata(file, content);

            // 5. Generate preview
            const preview = await this.generatePreview(content, file.type);

            // 6. Store in database
            const document = await this.storeDocument({
                userId,
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                filePath: savedFile.path,
                content,
                metadata,
                preview
            });

            console.log(`[DocumentInputService] ✅ File processed successfully: ${document.id}`);

            return {
                success: true,
                documentId: document.id,
                preview,
                metadata,
                stats: {
                    size: file.size,
                    type: file.type,
                    pages: content.pages || content.sheets?.length || content.slides?.length || null
                }
            };
        } catch (error) {
            console.error('[DocumentInputService] Error processing file:', error);
            throw new Error(`Failed to process file: ${error.message}`);
        }
    }

    /**
     * Validate file (security, size, type)
     */
    async validateFile(file) {
        // Check if file exists
        if (!file || !file.buffer) {
            throw new Error('No file provided');
        }

        // Check size
        if (file.size > this.maxFileSize) {
            throw new Error(`File too large (max ${this.maxFileSize / 1024 / 1024}MB)`);
        }

        // Check type (whitelist)
        if (!this.allowedTypes[file.type]) {
            throw new Error(`File type not allowed: ${file.type}`);
        }

        // Basic security: check for executable headers
        const buffer = Buffer.from(file.buffer);
        const header = buffer.slice(0, 4).toString('hex');

        // Block common executable signatures
        const dangerousHeaders = [
            '4d5a9000', // EXE
            '7f454c46', // ELF
            'cafebabe', // Java class
            '504b0304', // ZIP (could contain executables)
        ];

        if (dangerousHeaders.includes(header)) {
            // Exception for DOCX/XLSX/PPTX which are actually ZIP files
            if (!file.type.includes('officedocument')) {
                throw new Error('Potentially dangerous file detected');
            }
        }

        return true;
    }

    /**
     * Save file to disk
     */
    async saveFile(file, userId) {
        const fileId = uuidv4();
        const ext = path.extname(file.name);
        const sanitizedName = file.name.replace(/[^a-z0-9_\-\.]/gi, '_');
        const fileName = `${fileId}${ext}`;
        const userDir = path.join(this.uploadDir, userId);
        const filePath = path.join(userDir, fileName);

        // Create user directory
        await fs.mkdir(userDir, { recursive: true });

        // Write file
        await fs.writeFile(filePath, Buffer.from(file.buffer));

        console.log(`[DocumentInputService] File saved: ${filePath}`);

        return {
            id: fileId,
            path: filePath,
            originalName: file.name,
            sanitizedName
        };
    }

    /**
     * Extract content based on file type
     */
    async extractContent(savedFile, mimeType) {
        const typeInfo = this.allowedTypes[mimeType];
        if (!typeInfo || !typeInfo.parser) {
            throw new Error(`No parser for type: ${mimeType}`);
        }

        const parserMethod = this[typeInfo.parser];
        if (!parserMethod) {
            throw new Error(`Parser method not found: ${typeInfo.parser}`);
        }

        return await parserMethod.call(this, savedFile.path);
    }

    /**
     * Parse PDF (text + images + tables)
     * Uses pdf-parse for text extraction
     */
    async parsePDF(filePath) {
        console.log('[DocumentInputService] Parsing PDF...');

        try {
            // Lazy load pdf-parse
            if (!pdfParse) {
                pdfParse = require('pdf-parse');
            }

            const buffer = await fs.readFile(filePath);
            const data = await pdfParse(buffer);

            // Extract basic text
            const text = data.text;
            const pages = data.numpages;
            const metadata = data.info || {};

            // TODO: Extract images (requires pdf2pic or similar)
            // const images = await this.extractPDFImages(buffer);

            // TODO: Extract tables (requires tabula-js or custom logic)
            // const tables = await this.extractPDFTables(buffer);

            console.log(`[DocumentInputService] PDF parsed: ${pages} pages, ${text.length} chars`);

            return {
                type: 'pdf',
                text,
                pages,
                metadata,
                images: [], // Placeholder
                tables: []  // Placeholder
            };
        } catch (error) {
            console.error('[DocumentInputService] PDF parsing error:', error);
            throw new Error(`Failed to parse PDF: ${error.message}`);
        }
    }

    /**
     * Parse Excel (sheets + data + formulas)
     * Uses xlsx library
     */
    async parseExcel(filePath) {
        console.log('[DocumentInputService] Parsing Excel...');

        try {
            // Lazy load xlsx
            if (!XLSX) {
                XLSX = require('xlsx');
            }

            const workbook = XLSX.readFile(filePath);
            const sheets = [];

            for (const sheetName of workbook.SheetNames) {
                const sheet = workbook.Sheets[sheetName];

                // Convert to JSON (array of arrays)
                const data = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });

                // Extract formulas
                const formulas = XLSX.utils.sheet_to_formulae(sheet);

                // Get range
                const range = sheet['!ref'] || 'A1';

                sheets.push({
                    name: sheetName,
                    data,
                    formulas,
                    range,
                    rows: data.length,
                    cols: data[0]?.length || 0
                });
            }

            // Combine all sheets text for indexing
            const text = sheets.map(sheet =>
                `Sheet: ${sheet.name}\n` +
                sheet.data.map(row => row.join('\t')).join('\n')
            ).join('\n\n');

            console.log(`[DocumentInputService] Excel parsed: ${sheets.length} sheets`);

            return {
                type: 'excel',
                text,
                sheets,
                totalSheets: sheets.length
            };
        } catch (error) {
            console.error('[DocumentInputService] Excel parsing error:', error);
            throw new Error(`Failed to parse Excel: ${error.message}`);
        }
    }

    /**
     * Parse DOCX (text + images + tables)
     * Uses mammoth library
     */
    async parseDOCX(filePath) {
        console.log('[DocumentInputService] Parsing DOCX...');

        try {
            // Lazy load mammoth
            if (!mammoth) {
                mammoth = require('mammoth');
            }

            const buffer = await fs.readFile(filePath);
            const result = await mammoth.extractRawText({ buffer });

            const text = result.value;
            const messages = result.messages || [];

            console.log(`[DocumentInputService] DOCX parsed: ${text.length} chars`);

            return {
                type: 'docx',
                text,
                metadata: { messages }
            };
        } catch (error) {
            console.error('[DocumentInputService] DOCX parsing error:', error);
            throw new Error(`Failed to parse DOCX: ${error.message}`);
        }
    }

    /**
     * Parse PowerPoint (slides + text + images)
     * TODO: Implement with officegen or pptxgenjs
     */
    async parsePowerPoint(filePath) {
        console.log('[DocumentInputService] Parsing PowerPoint...');

        // For now, treat as unsupported - requires additional library
        console.warn('[DocumentInputService] PowerPoint parsing not yet implemented');

        return {
            type: 'pptx',
            text: '[PowerPoint file - parsing not yet implemented]',
            slides: []
        };
    }

    /**
     * Parse image with OCR (Tesseract.js)
     * Extracts text from images
     */
    async parseImageOCR(filePath) {
        console.log('[DocumentInputService] Parsing image with OCR...');

        try {
            // Lazy load Tesseract
            if (!Tesseract) {
                // Tesseract = require('tesseract.js');
                // Note: Tesseract.js is heavy, requires ~50MB download
                // For production, consider using a cloud OCR service
                console.warn('[DocumentInputService] Tesseract not available - OCR disabled');

                return {
                    type: 'image',
                    text: '[Image file - OCR not available]',
                    ocrAvailable: false
                };
            }

            const { data: { text } } = await Tesseract.recognize(
                filePath,
                'fra+eng', // French + English
                {
                    logger: m => console.log('[OCR]', m.status, m.progress)
                }
            );

            console.log(`[DocumentInputService] OCR completed: ${text.length} chars`);

            return {
                type: 'image',
                text,
                ocrAvailable: true
            };
        } catch (error) {
            console.error('[DocumentInputService] OCR error:', error);
            return {
                type: 'image',
                text: '[Image file - OCR failed]',
                ocrAvailable: false,
                error: error.message
            };
        }
    }

    /**
     * Parse plain text files
     */
    async parseText(filePath) {
        console.log('[DocumentInputService] Parsing text file...');

        try {
            const text = await fs.readFile(filePath, 'utf-8');

            return {
                type: 'text',
                text
            };
        } catch (error) {
            console.error('[DocumentInputService] Text parsing error:', error);
            throw new Error(`Failed to parse text: ${error.message}`);
        }
    }

    /**
     * Extract metadata from file and content
     */
    async extractMetadata(file, content) {
        const metadata = {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            uploadedAt: Date.now(),
            ...content.metadata
        };

        // Add content-specific metadata
        if (content.pages) {
            metadata.pages = content.pages;
        }

        if (content.sheets) {
            metadata.sheets = content.sheets.length;
        }

        if (content.slides) {
            metadata.slides = content.slides.length;
        }

        return metadata;
    }

    /**
     * Generate preview (first page/lines/rows)
     */
    async generatePreview(content, fileType) {
        if (content.text) {
            // Text preview: first 500 chars
            return {
                type: 'text',
                content: content.text.substring(0, 500) + (content.text.length > 500 ? '...' : '')
            };
        }

        if (content.sheets && content.sheets.length > 0) {
            // Excel preview: first sheet, first 5 rows
            const firstSheet = content.sheets[0];
            return {
                type: 'table',
                sheetName: firstSheet.name,
                rows: firstSheet.data.slice(0, 5),
                totalRows: firstSheet.rows,
                totalCols: firstSheet.cols
            };
        }

        if (content.slides && content.slides.length > 0) {
            // PowerPoint preview: first slide
            return {
                type: 'slide',
                content: content.slides[0]
            };
        }

        return {
            type: 'none',
            content: 'No preview available'
        };
    }

    /**
     * Store document in database
     */
    async storeDocument(data) {
        const documentId = uuidv4();

        const document = {
            id: documentId,
            uid: data.userId,
            title: data.fileName,
            filename: data.fileName,
            file_type: data.fileType,
            file_size: data.fileSize,
            file_path: data.filePath,
            content_text: data.content.text || '',
            tags: JSON.stringify([]),
            description: '',
            chunk_count: 0, // Will be updated when chunked
            indexed: 0, // Not yet indexed
            created_at: Date.now(),
            updated_at: Date.now()
        };

        if (this.documentsRepository) {
            await this.documentsRepository.insert(document);
            console.log(`[DocumentInputService] Document stored: ${documentId}`);
        } else {
            console.warn('[DocumentInputService] No repository - document not persisted');
        }

        return document;
    }

    /**
     * Handle multiple file uploads (batch processing)
     */
    async handleMultipleUploads(files, userId, options = {}) {
        console.log(`[DocumentInputService] Processing ${files.length} files...`);

        const results = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            try {
                const result = await this.processFile(file, userId, options);
                results.push({
                    success: true,
                    fileName: file.name,
                    documentId: result.documentId,
                    preview: result.preview
                });

                console.log(`[DocumentInputService] [${i + 1}/${files.length}] ✅ ${file.name}`);
            } catch (error) {
                results.push({
                    success: false,
                    fileName: file.name,
                    error: error.message
                });

                console.error(`[DocumentInputService] [${i + 1}/${files.length}] ❌ ${file.name}:`, error.message);
            }
        }

        const summary = {
            total: files.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results
        };

        console.log(`[DocumentInputService] Batch complete: ${summary.successful}/${summary.total} successful`);

        return summary;
    }

    /**
     * Get document by ID with content
     */
    async getDocument(documentId, userId) {
        if (!this.documentsRepository) {
            throw new Error('Repository not initialized');
        }

        const doc = await this.documentsRepository.findOne({ id: documentId, uid: userId });

        if (!doc) {
            throw new Error(`Document not found: ${documentId}`);
        }

        return doc;
    }

    /**
     * Delete document
     */
    async deleteDocument(documentId, userId) {
        if (!this.documentsRepository) {
            throw new Error('Repository not initialized');
        }

        const doc = await this.getDocument(documentId, userId);

        // Delete file from disk
        try {
            await fs.unlink(doc.file_path);
            console.log(`[DocumentInputService] File deleted: ${doc.file_path}`);
        } catch (error) {
            console.warn('[DocumentInputService] Failed to delete file:', error.message);
        }

        // Delete from database
        await this.documentsRepository.delete({ id: documentId, uid: userId });

        console.log(`[DocumentInputService] Document deleted: ${documentId}`);

        return { success: true };
    }
}

// Singleton instance
const documentInputService = new DocumentInputService();

module.exports = documentInputService;
