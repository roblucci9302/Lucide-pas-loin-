/**
 * Settings Bridge - IPC handlers for settings and shortcuts
 */
const { ipcMain } = require('electron');
const settingsService = require('../../features/settings/settingsService');
const shortcutsService = require('../../features/shortcuts/shortcutsService');
const presetRepository = require('../../features/common/repositories/preset');

module.exports = {
    initialize() {
        // Settings Service
        ipcMain.handle('settings:getPresets', async () => await settingsService.getPresets());
        ipcMain.handle('settings:get-auto-update', async () => await settingsService.getAutoUpdateSetting());
        ipcMain.handle('settings:set-auto-update', async (event, isEnabled) => await settingsService.setAutoUpdateSetting(isEnabled));
        ipcMain.handle('settings:get-model-settings', async () => await settingsService.getModelSettings());
        ipcMain.handle('settings:clear-api-key', async (e, { provider }) => await settingsService.clearApiKey(provider));
        ipcMain.handle('settings:set-selected-model', async (e, { type, modelId }) => await settingsService.setSelectedModel(type, modelId));

        ipcMain.handle('settings:get-ollama-status', async () => await settingsService.getOllamaStatus());
        ipcMain.handle('settings:ensure-ollama-ready', async () => await settingsService.ensureOllamaReady());
        ipcMain.handle('settings:shutdown-ollama', async () => await settingsService.shutdownOllama());

        // Shortcuts
        ipcMain.handle('settings:getCurrentShortcuts', async () => await shortcutsService.loadKeybinds());
        ipcMain.handle('shortcut:getDefaultShortcuts', async () => await shortcutsService.handleRestoreDefaults());
        ipcMain.handle('shortcut:closeShortcutSettingsWindow', async () => await shortcutsService.closeShortcutSettingsWindow());
        ipcMain.handle('shortcut:openShortcutSettingsWindow', async () => await shortcutsService.openShortcutSettingsWindow());
        ipcMain.handle('shortcut:saveShortcuts', async (event, newKeybinds) => await shortcutsService.handleSaveShortcuts(newKeybinds));
        ipcMain.handle('shortcut:toggleAllWindowsVisibility', async () => await shortcutsService.toggleAllWindowsVisibility());

        // General
        ipcMain.handle('get-preset-templates', () => presetRepository.getPresetTemplates());
        ipcMain.handle('get-web-url', () => process.env.pickleglass_WEB_URL || 'http://localhost:3000');

        console.log('[SettingsBridge] Initialized');
    }
};
