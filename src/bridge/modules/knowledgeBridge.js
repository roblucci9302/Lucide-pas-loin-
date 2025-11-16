/**
 * Knowledge Bridge - IPC handlers for workflows, documents, and RAG (Phase 3 & 4)
 */
const { ipcMain, dialog } = require('electron');
const fs = require('fs').promises;
const path = require('path');
const authService = require('../../features/common/services/authService');
const workflowService = require('../../features/common/services/workflowService');
const documentService = require('../../features/common/services/documentService');
const indexingService = require('../../features/common/services/indexingService');
const ragService = require('../../features/common/services/ragService');

module.exports = {
    initialize() {
        // Workflows (Phase 3)
        ipcMain.handle('workflows:get-current-profile-workflows', () => {
            return workflowService.getCurrentProfileWorkflows();
        });
        ipcMain.handle('workflows:get-workflows-metadata', (event, profileId) => {
            return workflowService.getProfileWorkflowsMetadata(profileId);
        });
        ipcMain.handle('workflows:get-workflow', (event, profileId, workflowId) => {
            return workflowService.getWorkflow(profileId, workflowId);
        });
        ipcMain.handle('workflows:build-prompt', (event, profileId, workflowId, formData) => {
            return workflowService.buildPrompt(profileId, workflowId, formData);
        });
        ipcMain.handle('workflows:get-form-fields', (event, profileId, workflowId) => {
            return workflowService.getWorkflowFormFields(profileId, workflowId);
        });
        ipcMain.handle('workflows:validate-form', (event, profileId, workflowId, formData) => {
            return workflowService.validateFormData(profileId, workflowId, formData);
        });

        // Knowledge Base - Documents (Phase 4)
        ipcMain.handle('documents:get-all', async () => {
            const userId = authService.getCurrentUserId();
            return await documentService.getAllDocuments(userId);
        });
        ipcMain.handle('documents:search', async (event, query, filters) => {
            const userId = authService.getCurrentUserId();
            return await documentService.searchDocuments(userId, query, filters);
        });
        ipcMain.handle('documents:get-stats', async () => {
            const userId = authService.getCurrentUserId();
            return await documentService.getDocumentStats(userId);
        });
        ipcMain.handle('documents:delete', async (event, documentId) => {
            return await documentService.deleteDocument(documentId);
        });
        ipcMain.handle('documents:upload', async () => {
            try {
                const userId = authService.getCurrentUserId();
                if (!userId) {
                    throw new Error('User not authenticated');
                }

                // Open file picker dialog
                const result = await dialog.showOpenDialog({
                    title: 'Upload Document',
                    properties: ['openFile'],
                    filters: [
                        { name: 'Documents', extensions: ['txt', 'md', 'pdf', 'docx'] },
                        { name: 'Text Files', extensions: ['txt', 'md'] },
                        { name: 'PDF Files', extensions: ['pdf'] },
                        { name: 'Word Documents', extensions: ['docx'] },
                        { name: 'All Files', extensions: ['*'] }
                    ]
                });

                if (result.canceled || result.filePaths.length === 0) {
                    return { success: false, cancelled: true };
                }

                const filePath = result.filePaths[0];
                const filename = path.basename(filePath);

                // Check file size before reading (prevent DoS)
                const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
                const stats = await fs.stat(filePath);

                if (stats.size > MAX_FILE_SIZE) {
                    console.warn(`[KnowledgeBridge] File too large: ${stats.size} bytes (max: ${MAX_FILE_SIZE})`);
                    return {
                        success: false,
                        error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
                    };
                }

                // Read file buffer
                const buffer = await fs.readFile(filePath);

                console.log(`[KnowledgeBridge] Uploading document: ${filename} (${buffer.length} bytes)`);

                // Upload document
                const document = await documentService.uploadDocument(userId, {
                    filename,
                    filepath: filePath,
                    buffer
                });

                // Index document for semantic search
                try {
                    console.log(`[KnowledgeBridge] Indexing document: ${document.id}`);
                    const indexResult = await indexingService.indexDocument(
                        document.id,
                        document.content,
                        { generateEmbeddings: true }
                    );

                    // Update document indexed status
                    await documentService.updateDocument(document.id, {
                        chunk_count: indexResult.chunk_count,
                        indexed: 1
                    });

                    console.log(`[KnowledgeBridge] Document indexed: ${indexResult.chunk_count} chunks`);
                } catch (indexError) {
                    console.error('[KnowledgeBridge] Error indexing document:', indexError);
                    // Continue even if indexing fails
                }

                return {
                    success: true,
                    document: {
                        id: document.id,
                        title: document.title,
                        filename: document.filename
                    }
                };
            } catch (error) {
                console.error('[KnowledgeBridge] Error uploading document:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        // RAG (Phase 4)
        ipcMain.handle('rag:retrieve-context', async (event, query, options) => {
            return await ragService.retrieveContext(query, options);
        });
        ipcMain.handle('rag:get-session-citations', async (event, sessionId) => {
            return await ragService.getSessionCitations(sessionId);
        });

        console.log('[KnowledgeBridge] Initialized');
    }
};
