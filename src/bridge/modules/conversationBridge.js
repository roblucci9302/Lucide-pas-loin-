/**
 * Conversation Bridge - IPC handlers for agents, history, ask, and listen features
 */
const { ipcMain, dialog } = require('electron');
const path = require('path');
const os = require('os');
const authService = require('../../features/common/services/authService');
const agentProfileService = require('../../features/common/services/agentProfileService');
const conversationHistoryService = require('../../features/common/services/conversationHistoryService');
const exportService = require('../../features/common/services/exportService');
const askService = require('../../features/ask/askService');
const listenService = require('../../features/listen/listenService');

module.exports = {
    initialize() {
        // Agent Profiles
        ipcMain.handle('agent:get-available-profiles', () => agentProfileService.getAvailableProfiles());
        ipcMain.handle('agent:get-active-profile', () => agentProfileService.getCurrentProfile());
        ipcMain.handle('agent:set-active-profile', async (event, profileId) => {
            const userId = authService.getCurrentUserId();
            const success = await agentProfileService.setActiveProfile(userId, profileId);
            return { success };
        });

        // Conversation History (Phase 2)
        ipcMain.handle('history:get-all-sessions', async (event, options) => {
            const userId = authService.getCurrentUserId();
            return await conversationHistoryService.getAllSessions(userId, options);
        });
        ipcMain.handle('history:search-sessions', async (event, query, filters) => {
            const userId = authService.getCurrentUserId();
            return await conversationHistoryService.searchSessions(userId, query, filters);
        });
        ipcMain.handle('history:get-session-messages', async (event, sessionId) => {
            return await conversationHistoryService.getSessionMessages(sessionId);
        });
        ipcMain.handle('history:get-stats', async () => {
            const userId = authService.getCurrentUserId();
            return await conversationHistoryService.getSessionStats(userId);
        });
        ipcMain.handle('history:update-metadata', async (event, sessionId, metadata) => {
            return await conversationHistoryService.updateSessionMetadata(sessionId, metadata);
        });
        ipcMain.handle('history:delete-session', async (event, sessionId) => {
            return await conversationHistoryService.deleteSession(sessionId);
        });
        ipcMain.handle('history:generate-title', async (event, sessionId) => {
            return await conversationHistoryService.generateTitleFromContent(sessionId);
        });

        // Export Features (Phase 5)
        ipcMain.handle('export:conversation-json', async (event, sessionId) => {
            try {
                const session = await conversationHistoryService.getSession(sessionId);
                if (!session) {
                    throw new Error('Session not found');
                }

                const suggestedFilename = exportService.getSuggestedFilename(session, 'json');

                const result = await dialog.showSaveDialog({
                    title: 'Export Conversation to JSON',
                    defaultPath: path.join(os.homedir(), 'Downloads', suggestedFilename),
                    filters: [
                        { name: 'JSON Files', extensions: ['json'] },
                        { name: 'All Files', extensions: ['*'] }
                    ]
                });

                if (result.canceled || !result.filePath) {
                    return { success: false, cancelled: true };
                }

                return await exportService.exportToJSON(sessionId, result.filePath);
            } catch (error) {
                console.error('[ConversationBridge] Error exporting to JSON:', error);
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('export:conversation-markdown', async (event, sessionId) => {
            try {
                const session = await conversationHistoryService.getSession(sessionId);
                if (!session) {
                    throw new Error('Session not found');
                }

                const suggestedFilename = exportService.getSuggestedFilename(session, 'markdown');

                const result = await dialog.showSaveDialog({
                    title: 'Export Conversation to Markdown',
                    defaultPath: path.join(os.homedir(), 'Downloads', suggestedFilename),
                    filters: [
                        { name: 'Markdown Files', extensions: ['md'] },
                        { name: 'All Files', extensions: ['*'] }
                    ]
                });

                if (result.canceled || !result.filePath) {
                    return { success: false, cancelled: true };
                }

                return await exportService.exportToMarkdown(sessionId, result.filePath);
            } catch (error) {
                console.error('[ConversationBridge] Error exporting to Markdown:', error);
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('export:conversation-pdf', async (event, sessionId) => {
            try {
                const session = await conversationHistoryService.getSession(sessionId);
                if (!session) {
                    throw new Error('Session not found');
                }

                const suggestedFilename = exportService.getSuggestedFilename(session, 'pdf');

                const result = await dialog.showSaveDialog({
                    title: 'Export Conversation to PDF',
                    defaultPath: path.join(os.homedir(), 'Downloads', suggestedFilename),
                    filters: [
                        { name: 'PDF Files', extensions: ['pdf'] },
                        { name: 'All Files', extensions: ['*'] }
                    ]
                });

                if (result.canceled || !result.filePath) {
                    return { success: false, cancelled: true };
                }

                return await exportService.exportToPDF(sessionId, result.filePath);
            } catch (error) {
                console.error('[ConversationBridge] Error exporting to PDF:', error);
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('export:conversation-docx', async (event, sessionId) => {
            try {
                const session = await conversationHistoryService.getSession(sessionId);
                if (!session) {
                    throw new Error('Session not found');
                }

                const suggestedFilename = exportService.getSuggestedFilename(session, 'docx');

                const result = await dialog.showSaveDialog({
                    title: 'Export Conversation to DOCX',
                    defaultPath: path.join(os.homedir(), 'Downloads', suggestedFilename),
                    filters: [
                        { name: 'Word Documents', extensions: ['docx'] },
                        { name: 'All Files', extensions: ['*'] }
                    ]
                });

                if (result.canceled || !result.filePath) {
                    return { success: false, cancelled: true };
                }

                return await exportService.exportToDOCX(sessionId, result.filePath);
            } catch (error) {
                console.error('[ConversationBridge] Error exporting to DOCX:', error);
                return { success: false, error: error.message };
            }
        });

        // Ask Feature
        ipcMain.handle('ask:sendQuestionFromAsk', async (event, { userPrompt, targetLength = 'detailed' }) => {
            return await askService.sendMessage(userPrompt, [], targetLength);
        });
        ipcMain.handle('ask:sendQuestionFromSummary', async (event, userPrompt) => await askService.sendMessage(userPrompt));
        ipcMain.handle('ask:toggleAskButton', async () => await askService.toggleAskButton());
        ipcMain.handle('ask:closeAskWindow', async () => await askService.closeAskWindow());
        ipcMain.handle('ask:minimizeAskWindow', async () => await askService.minimizeAskWindow());
        ipcMain.handle('ask:showListenWindow', async () => await askService.showListenWindow());
        ipcMain.handle('ask:setBrowserMode', async (event, browserMode) => {
            try {
                const internalBridge = require('../../bridge/internalBridge');
                internalBridge.emit('window:setAskBrowserMode', { browserMode });
                return { success: true };
            } catch (error) {
                console.error('[ConversationBridge] ask:setBrowserMode failed', error.message);
                return { success: false, error: error.message };
            }
        });
        // 🆕 PHASE 3: Continue Generation
        ipcMain.handle('ask:continueGeneration', async (event, userInstruction = '') => {
            try {
                return await askService.continueGeneration(userInstruction);
            } catch (error) {
                console.error('[ConversationBridge] ask:continueGeneration failed', error.message);
                return { success: false, error: error.message };
            }
        });

        // Listen Feature
        ipcMain.handle('listen:sendMicAudio', async (event, { data, mimeType }) => await listenService.handleSendMicAudioContent(data, mimeType));
        ipcMain.handle('listen:sendSystemAudio', async (event, { data, mimeType }) => {
            const result = await listenService.sttService.sendSystemAudioContent(data, mimeType);
            if (result.success) {
                listenService.sendToRenderer('system-audio-data', { data });
            }
            return result;
        });
        ipcMain.handle('listen:startMacosSystemAudio', async () => await listenService.handleStartMacosAudio());
        ipcMain.handle('listen:stopMacosSystemAudio', async () => await listenService.handleStopMacosAudio());
        ipcMain.handle('update-google-search-setting', async (event, enabled) => await listenService.handleUpdateGoogleSearchSetting(enabled));
        ipcMain.handle('listen:isSessionActive', async () => await listenService.isSessionActive());
        ipcMain.handle('listen:changeSession', async (event, listenButtonText) => {
            console.log('[ConversationBridge] listen:changeSession from mainheader', listenButtonText);
            try {
                await listenService.handleListenRequest(listenButtonText);
                return { success: true };
            } catch (error) {
                console.error('[ConversationBridge] listen:changeSession failed', error.message);
                return { success: false, error: error.message };
            }
        });
        ipcMain.handle('listen:hideWindow', async () => {
            try {
                const internalBridge = require('../../bridge/internalBridge');
                internalBridge.emit('window:requestVisibility', { name: 'listen', visible: false });
                return { success: true };
            } catch (error) {
                console.error('[ConversationBridge] listen:hideWindow failed', error.message);
                return { success: false, error: error.message };
            }
        });

        console.log('[ConversationBridge] Initialized');
    },

    // Renderer로 상태를 전송
    sendAskProgress(win, progress) {
        win.webContents.send('feature:ask:progress', progress);
    }
};
