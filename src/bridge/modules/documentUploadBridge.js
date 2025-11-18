/**
 * Document Upload Bridge - Phase 5: Document Management (INPUT)
 * IPC handlers for advanced document upload and parsing
 */

const { ipcMain } = require('electron');
const documentInputService = require('../../features/common/services/documentInputService');
const sessionRepository = require('../../features/common/repositories/session');

module.exports = {
    /**
     * Initialize all IPC handlers for document upload
     */
    initialize() {
        console.log('[DocumentUploadBridge] Initializing IPC handlers...');

        /**
         * Upload single file with advanced parsing
         * @param {Object} file - File object { name, size, type, buffer }
         * @param {Object} options - Processing options
         * @returns {Object} Upload result
         */
        ipcMain.handle('upload:file', async (event, { file, options = {} }) => {
            try {
                const userId = await sessionRepository.getCurrentUserId();
                if (!userId) {
                    throw new Error('User not authenticated');
                }

                const result = await documentInputService.processFile(file, userId, options);

                return {
                    success: true,
                    ...result
                };
            } catch (error) {
                console.error('[DocumentUploadBridge] Error uploading file:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        /**
         * Upload multiple files (batch processing)
         * @param {Array} files - Array of file objects
         * @param {Object} options - Processing options
         * @returns {Object} Batch upload result
         */
        ipcMain.handle('upload:multiple', async (event, { files, options = {} }) => {
            try {
                const userId = await sessionRepository.getCurrentUserId();
                if (!userId) {
                    throw new Error('User not authenticated');
                }

                const result = await documentInputService.handleMultipleUploads(files, userId, options);

                return {
                    success: true,
                    ...result
                };
            } catch (error) {
                console.error('[DocumentUploadBridge] Error uploading multiple files:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        /**
         * Generate preview for file before upload
         * Useful for drag & drop preview
         * @param {Object} file - File object
         * @returns {Object} Preview data
         */
        ipcMain.handle('upload:preview', async (event, { file }) => {
            try {
                // Validate file first
                await documentInputService.validateFile(file);

                // Generate preview without full processing
                const mimeType = file.type;
                const typeInfo = documentInputService.allowedTypes[mimeType];

                if (!typeInfo) {
                    throw new Error(`File type not supported: ${mimeType}`);
                }

                return {
                    success: true,
                    preview: {
                        fileName: file.name,
                        fileSize: file.size,
                        fileType: file.type,
                        supported: true,
                        ext: typeInfo.ext
                    }
                };
            } catch (error) {
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        /**
         * Get document by ID
         * @param {string} documentId - Document ID
         * @returns {Object} Document data
         */
        ipcMain.handle('upload:get-document', async (event, { documentId }) => {
            try {
                const userId = await sessionRepository.getCurrentUserId();
                if (!userId) {
                    throw new Error('User not authenticated');
                }

                const document = await documentInputService.getDocument(documentId, userId);

                return {
                    success: true,
                    document
                };
            } catch (error) {
                console.error('[DocumentUploadBridge] Error getting document:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        /**
         * Delete document
         * @param {string} documentId - Document ID
         * @returns {Object} Deletion result
         */
        ipcMain.handle('upload:delete-document', async (event, { documentId }) => {
            try {
                const userId = await sessionRepository.getCurrentUserId();
                if (!userId) {
                    throw new Error('User not authenticated');
                }

                const result = await documentInputService.deleteDocument(documentId, userId);

                return {
                    success: true,
                    ...result
                };
            } catch (error) {
                console.error('[DocumentUploadBridge] Error deleting document:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        /**
         * Get supported file types
         * Useful for UI to show allowed formats
         * @returns {Object} Supported types info
         */
        ipcMain.handle('upload:get-supported-types', async () => {
            try {
                const types = Object.keys(documentInputService.allowedTypes).map(mimeType => {
                    const info = documentInputService.allowedTypes[mimeType];
                    return {
                        mimeType,
                        ext: info.ext,
                        parser: info.parser
                    };
                });

                return {
                    success: true,
                    types,
                    maxFileSize: documentInputService.maxFileSize
                };
            } catch (error) {
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        console.log('[DocumentUploadBridge] IPC handlers initialized successfully (6 handlers)');
    }
};
