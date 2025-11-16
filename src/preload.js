// src/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Platform information for renderer processes
  platform: {
    isLinux: process.platform === 'linux',
    isMacOS: process.platform === 'darwin',
    isWindows: process.platform === 'win32',
    platform: process.platform
  },
  
  // Common utilities used across multiple components
  common: {
    // User & Auth
    getCurrentUser: () => ipcRenderer.invoke('get-current-user'),
    startFirebaseAuth: () => ipcRenderer.invoke('start-firebase-auth'),
    firebaseLogout: () => ipcRenderer.invoke('firebase-logout'),
    
    // App Control
      quitApplication: () => ipcRenderer.invoke('quit-application'),
      openExternal: (url) => ipcRenderer.invoke('open-external', url),

    // User state listener (used by multiple components)
      onUserStateChanged: (callback) => ipcRenderer.on('user-state-changed', callback),
      removeOnUserStateChanged: (callback) => ipcRenderer.removeListener('user-state-changed', callback),
  },

  // UI Component specific namespaces
  // src/ui/app/ApiKeyHeader.js
  apiKeyHeader: {
    // Model & Provider Management
    getProviderConfig: () => ipcRenderer.invoke('model:get-provider-config'),
    // LocalAI 통합 API
    getLocalAIStatus: (service) => ipcRenderer.invoke('localai:get-status', service),
    installLocalAI: (service, options) => ipcRenderer.invoke('localai:install', { service, options }),
    startLocalAIService: (service) => ipcRenderer.invoke('localai:start-service', service),
    stopLocalAIService: (service) => ipcRenderer.invoke('localai:stop-service', service),
    installLocalAIModel: (service, modelId, options) => ipcRenderer.invoke('localai:install-model', { service, modelId, options }),
    getInstalledModels: (service) => ipcRenderer.invoke('localai:get-installed-models', service),
    
    // Legacy support (호환성 위해 유지)
    getOllamaStatus: () => ipcRenderer.invoke('localai:get-status', 'ollama'),
    getModelSuggestions: () => ipcRenderer.invoke('ollama:get-model-suggestions'),
    ensureOllamaReady: () => ipcRenderer.invoke('ollama:ensure-ready'),
    installOllama: () => ipcRenderer.invoke('localai:install', { service: 'ollama' }),
    startOllamaService: () => ipcRenderer.invoke('localai:start-service', 'ollama'),
    pullOllamaModel: (modelName) => ipcRenderer.invoke('ollama:pull-model', modelName),
    downloadWhisperModel: (modelId) => ipcRenderer.invoke('whisper:download-model', modelId),
    validateKey: (data) => ipcRenderer.invoke('model:validate-key', data),
    setSelectedModel: (data) => ipcRenderer.invoke('model:set-selected-model', data),
    areProvidersConfigured: () => ipcRenderer.invoke('model:are-providers-configured'),
    
    // Window Management
    getHeaderPosition: () => ipcRenderer.invoke('get-header-position'),
    moveHeaderTo: (x, y) => ipcRenderer.invoke('move-header-to', x, y),
    
    // Listeners
    // LocalAI 통합 이벤트 리스너
    onLocalAIProgress: (callback) => ipcRenderer.on('localai:install-progress', callback),
    removeOnLocalAIProgress: (callback) => ipcRenderer.removeListener('localai:install-progress', callback),
    onLocalAIComplete: (callback) => ipcRenderer.on('localai:installation-complete', callback),
    removeOnLocalAIComplete: (callback) => ipcRenderer.removeListener('localai:installation-complete', callback),
    onLocalAIError: (callback) => ipcRenderer.on('localai:error-notification', callback),
    removeOnLocalAIError: (callback) => ipcRenderer.removeListener('localai:error-notification', callback),
    onLocalAIModelReady: (callback) => ipcRenderer.on('localai:model-ready', callback),
    removeOnLocalAIModelReady: (callback) => ipcRenderer.removeListener('localai:model-ready', callback),
    

    // Remove all listeners (for cleanup)
    removeAllListeners: () => {
      // LocalAI 통합 이벤트
      ipcRenderer.removeAllListeners('localai:install-progress');
      ipcRenderer.removeAllListeners('localai:installation-complete');
      ipcRenderer.removeAllListeners('localai:error-notification');
      ipcRenderer.removeAllListeners('localai:model-ready');
      ipcRenderer.removeAllListeners('localai:service-status-changed');
    }
  },

  // src/ui/app/HeaderController.js
  headerController: {
    // State Management
    sendHeaderStateChanged: (state) => ipcRenderer.send('header-state-changed', state),
    reInitializeModelState: () => ipcRenderer.invoke('model:re-initialize-state'),
    
    // Window Management
    resizeHeaderWindow: (dimensions) => ipcRenderer.invoke('resize-header-window', dimensions),
    
    // Permissions
    checkSystemPermissions: () => ipcRenderer.invoke('check-system-permissions'),
    checkPermissionsCompleted: () => ipcRenderer.invoke('check-permissions-completed'),
    
    // Listeners
    onUserStateChanged: (callback) => ipcRenderer.on('user-state-changed', callback),
    removeOnUserStateChanged: (callback) => ipcRenderer.removeListener('user-state-changed', callback),
    onAuthFailed: (callback) => ipcRenderer.on('auth-failed', callback),
    removeOnAuthFailed: (callback) => ipcRenderer.removeListener('auth-failed', callback),
    onForceShowApiKeyHeader: (callback) => ipcRenderer.on('force-show-apikey-header', callback),
    removeOnForceShowApiKeyHeader: (callback) => ipcRenderer.removeListener('force-show-apikey-header', callback),
  },

  // src/ui/app/MainHeader.js
  mainHeader: {
    // Window Management
    getHeaderPosition: () => ipcRenderer.invoke('get-header-position'),
    moveHeaderTo: (x, y) => ipcRenderer.invoke('move-header-to', x, y),
    sendHeaderAnimationFinished: (state) => ipcRenderer.send('header-animation-finished', state),

    // Settings Window Management
    cancelHideSettingsWindow: () => ipcRenderer.send('cancel-hide-settings-window'),
    showSettingsWindow: () => ipcRenderer.send('show-settings-window'),
    hideSettingsWindow: () => ipcRenderer.send('hide-settings-window'),
    
    // Generic invoke (for dynamic channel names)
    // invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
    sendListenButtonClick: (listenButtonText) => ipcRenderer.invoke('listen:changeSession', listenButtonText),
    sendAskButtonClick: () => ipcRenderer.invoke('ask:toggleAskButton'),
    sendToggleAllWindowsVisibility: () => ipcRenderer.invoke('shortcut:toggleAllWindowsVisibility'),
    
    // Listeners
    onListenChangeSessionResult: (callback) => ipcRenderer.on('listen:changeSessionResult', callback),
    removeOnListenChangeSessionResult: (callback) => ipcRenderer.removeListener('listen:changeSessionResult', callback),
    onShortcutsUpdated: (callback) => ipcRenderer.on('shortcuts-updated', callback),
    removeOnShortcutsUpdated: (callback) => ipcRenderer.removeListener('shortcuts-updated', callback)
  },

  // src/ui/app/PermissionHeader.js
  permissionHeader: {
    // Permission Management
    checkSystemPermissions: () => ipcRenderer.invoke('check-system-permissions'),
    requestMicrophonePermission: () => ipcRenderer.invoke('request-microphone-permission'),
    openSystemPreferences: (preference) => ipcRenderer.invoke('open-system-preferences', preference),
    markKeychainCompleted: () => ipcRenderer.invoke('mark-keychain-completed'),
    checkKeychainCompleted: (uid) => ipcRenderer.invoke('check-keychain-completed', uid),
    initializeEncryptionKey: () => ipcRenderer.invoke('initialize-encryption-key') // New for keychain
  },

  // src/ui/app/LucideApp.js
  lucideApp: {
    // Listeners
    onClickThroughToggled: (callback) => ipcRenderer.on('click-through-toggled', callback),
    removeOnClickThroughToggled: (callback) => ipcRenderer.removeListener('click-through-toggled', callback),
    removeAllClickThroughListeners: () => ipcRenderer.removeAllListeners('click-through-toggled')
  },

  // src/ui/ask/AskView.js
  askView: {
    // Window Management
    closeAskWindow: () => ipcRenderer.invoke('ask:closeAskWindow'),
    minimizeAskWindow: () => ipcRenderer.invoke('ask:minimizeAskWindow'),
    showListenWindow: () => ipcRenderer.invoke('ask:showListenWindow'),
    adjustWindowHeight: (winName, height) => ipcRenderer.invoke('adjust-window-height', { winName, height }),
    setBrowserMode: (browserMode) => ipcRenderer.invoke('ask:setBrowserMode', browserMode),

    // Message Handling
    sendMessage: (text) => ipcRenderer.invoke('ask:sendQuestionFromAsk', text),

    // Listeners
    onAskStateUpdate: (callback) => ipcRenderer.on('ask:stateUpdate', callback),
    removeOnAskStateUpdate: (callback) => ipcRenderer.removeListener('ask:stateUpdate', callback),

    onAskStreamError: (callback) => ipcRenderer.on('ask-response-stream-error', callback),
    removeOnAskStreamError: (callback) => ipcRenderer.removeListener('ask-response-stream-error', callback),

    // Listeners
    onShowTextInput: (callback) => ipcRenderer.on('ask:showTextInput', callback),
    removeOnShowTextInput: (callback) => ipcRenderer.removeListener('ask:showTextInput', callback),

    onScrollResponseUp: (callback) => ipcRenderer.on('aks:scrollResponseUp', callback),
    removeOnScrollResponseUp: (callback) => ipcRenderer.removeListener('aks:scrollResponseUp', callback),
    onScrollResponseDown: (callback) => ipcRenderer.on('aks:scrollResponseDown', callback),
    removeOnScrollResponseDown: (callback) => ipcRenderer.removeListener('aks:scrollResponseDown', callback),

    // Browser mode - Ouvrir des URLs
    onOpenUrl: (callback) => ipcRenderer.on('ask:open-url', callback),
    removeOnOpenUrl: (callback) => ipcRenderer.removeListener('ask:open-url', callback)
  },

  // src/ui/listen/ListenView.js
  listenView: {
    // Window Management
    adjustWindowHeight: (winName, height) => ipcRenderer.invoke('adjust-window-height', { winName, height }),
    hideListenWindow: () => ipcRenderer.invoke('listen:hideWindow'),

    // Listeners
    onSessionStateChanged: (callback) => ipcRenderer.on('session-state-changed', callback),
    removeOnSessionStateChanged: (callback) => ipcRenderer.removeListener('session-state-changed', callback)
  },

  // src/ui/listen/stt/SttView.js
  sttView: {
    // Listeners
    onSttUpdate: (callback) => ipcRenderer.on('stt-update', callback),
    removeOnSttUpdate: (callback) => ipcRenderer.removeListener('stt-update', callback)
  },

  // src/ui/listen/summary/SummaryView.js
  summaryView: {
    // Message Handling
    sendQuestionFromSummary: (text) => ipcRenderer.invoke('ask:sendQuestionFromSummary', text),

    // Listeners
    onSummaryUpdate: (callback) => ipcRenderer.on('summary-update', callback),
    removeOnSummaryUpdate: (callback) => ipcRenderer.removeListener('summary-update', callback),
    removeAllSummaryUpdateListeners: () => ipcRenderer.removeAllListeners('summary-update')
  },

  // src/ui/listen/response/ResponseView.js
  responseView: {
    // Listeners for AI response suggestions
    onAiResponseReady: (callback) => ipcRenderer.on('ai-response-ready', callback),
    removeOnAiResponseReady: (callback) => ipcRenderer.removeListener('ai-response-ready', callback),
    onAiResponseError: (callback) => ipcRenderer.on('ai-response-error', callback),
    removeOnAiResponseError: (callback) => ipcRenderer.removeListener('ai-response-error', callback),
    onSessionStateChanged: (callback) => ipcRenderer.on('session-state-changed', callback),
    removeOnSessionStateChanged: (callback) => ipcRenderer.removeListener('session-state-changed', callback)
  },

  // src/ui/settings/SettingsView.js
  settingsView: {
    // User & Auth
    getCurrentUser: () => ipcRenderer.invoke('get-current-user'),
    openPersonalizePage: () => ipcRenderer.invoke('open-personalize-page'),
    firebaseLogout: () => ipcRenderer.invoke('firebase-logout'),
    startFirebaseAuth: () => ipcRenderer.invoke('start-firebase-auth'),

    // Model & Provider Management
    getModelSettings: () => ipcRenderer.invoke('settings:get-model-settings'), // Facade call
    getProviderConfig: () => ipcRenderer.invoke('model:get-provider-config'),
    getAllKeys: () => ipcRenderer.invoke('model:get-all-keys'),
    getAvailableModels: (type) => ipcRenderer.invoke('model:get-available-models', type),
    getSelectedModels: () => ipcRenderer.invoke('model:get-selected-models'),
    validateKey: (data) => ipcRenderer.invoke('model:validate-key', data),
    saveApiKey: (key) => ipcRenderer.invoke('model:save-api-key', key),
    removeApiKey: (provider) => ipcRenderer.invoke('model:remove-api-key', provider),
    setSelectedModel: (data) => ipcRenderer.invoke('model:set-selected-model', data),
    
    // Ollama Management
    getOllamaStatus: () => ipcRenderer.invoke('ollama:get-status'),
    ensureOllamaReady: () => ipcRenderer.invoke('ollama:ensure-ready'),
    shutdownOllama: (graceful) => ipcRenderer.invoke('ollama:shutdown', graceful),
    
    // Whisper Management
    getWhisperInstalledModels: () => ipcRenderer.invoke('whisper:get-installed-models'),
    downloadWhisperModel: (modelId) => ipcRenderer.invoke('whisper:download-model', modelId),
    
    // Settings Management
    getPresets: () => ipcRenderer.invoke('settings:getPresets'),
    getAutoUpdate: () => ipcRenderer.invoke('settings:get-auto-update'),
    setAutoUpdate: (isEnabled) => ipcRenderer.invoke('settings:set-auto-update', isEnabled),
    getContentProtectionStatus: () => ipcRenderer.invoke('get-content-protection-status'),
    toggleContentProtection: () => ipcRenderer.invoke('toggle-content-protection'),
    getCurrentShortcuts: () => ipcRenderer.invoke('settings:getCurrentShortcuts'),
    openShortcutSettingsWindow: () => ipcRenderer.invoke('shortcut:openShortcutSettingsWindow'),

    // Agent Profile Management
    getAvailableProfiles: () => ipcRenderer.invoke('agent:get-available-profiles'),
    getActiveProfile: () => ipcRenderer.invoke('agent:get-active-profile'),
    setActiveProfile: (profileId) => ipcRenderer.invoke('agent:set-active-profile', profileId),
    
    // Window Management
    moveWindowStep: (direction) => ipcRenderer.invoke('move-window-step', direction),
    cancelHideSettingsWindow: () => ipcRenderer.send('cancel-hide-settings-window'),
    hideSettingsWindow: () => ipcRenderer.send('hide-settings-window'),
    
    // App Control
    quitApplication: () => ipcRenderer.invoke('quit-application'),
    
    // Progress Tracking
    pullOllamaModel: (modelName) => ipcRenderer.invoke('ollama:pull-model', modelName),
    
    // Listeners
    onUserStateChanged: (callback) => ipcRenderer.on('user-state-changed', callback),
    removeOnUserStateChanged: (callback) => ipcRenderer.removeListener('user-state-changed', callback),
    onSettingsUpdated: (callback) => ipcRenderer.on('settings-updated', callback),
    removeOnSettingsUpdated: (callback) => ipcRenderer.removeListener('settings-updated', callback),
    onPresetsUpdated: (callback) => ipcRenderer.on('presets-updated', callback),
    removeOnPresetsUpdated: (callback) => ipcRenderer.removeListener('presets-updated', callback),
    onShortcutsUpdated: (callback) => ipcRenderer.on('shortcuts-updated', callback),
    removeOnShortcutsUpdated: (callback) => ipcRenderer.removeListener('shortcuts-updated', callback),
    // 통합 LocalAI 이벤트 사용
    onLocalAIInstallProgress: (callback) => ipcRenderer.on('localai:install-progress', callback),
    removeOnLocalAIInstallProgress: (callback) => ipcRenderer.removeListener('localai:install-progress', callback),
    onLocalAIInstallationComplete: (callback) => ipcRenderer.on('localai:installation-complete', callback),
    removeOnLocalAIInstallationComplete: (callback) => ipcRenderer.removeListener('localai:installation-complete', callback)
  },

  // src/ui/history/HistoryView.js - Phase 2: Conversation History
  history: {
    getAllSessions: (options) => ipcRenderer.invoke('history:get-all-sessions', options),
    searchSessions: (query, filters) => ipcRenderer.invoke('history:search-sessions', query, filters),
    getSessionMessages: (sessionId) => ipcRenderer.invoke('history:get-session-messages', sessionId),
    getStats: () => ipcRenderer.invoke('history:get-stats'),
    updateMetadata: (sessionId, metadata) => ipcRenderer.invoke('history:update-metadata', sessionId, metadata),
    deleteSession: (sessionId) => ipcRenderer.invoke('history:delete-session', sessionId),
    generateTitle: (sessionId) => ipcRenderer.invoke('history:generate-title', sessionId)
  },

  // Phase 3: Workflows - Quick Actions
  workflows: {
    getCurrentProfileWorkflows: () => ipcRenderer.invoke('workflows:get-current-profile-workflows'),
    getWorkflowsMetadata: (profileId) => ipcRenderer.invoke('workflows:get-workflows-metadata', profileId),
    getWorkflow: (profileId, workflowId) => ipcRenderer.invoke('workflows:get-workflow', profileId, workflowId),
    buildPrompt: (profileId, workflowId, formData) => ipcRenderer.invoke('workflows:build-prompt', profileId, workflowId, formData),
    getFormFields: (profileId, workflowId) => ipcRenderer.invoke('workflows:get-form-fields', profileId, workflowId),
    validateForm: (profileId, workflowId, formData) => ipcRenderer.invoke('workflows:validate-form', profileId, workflowId, formData)
  },

  // Phase 4: Knowledge Base - Documents
  documents: {
    getAllDocuments: () => ipcRenderer.invoke('documents:get-all'),
    searchDocuments: (query, filters) => ipcRenderer.invoke('documents:search', query, filters),
    getStats: () => ipcRenderer.invoke('documents:get-stats'),
    deleteDocument: (documentId) => ipcRenderer.invoke('documents:delete', documentId),
    uploadDocument: () => ipcRenderer.invoke('documents:upload')
  },

  // Phase 5: Export - Conversation Export
  export: {
    toJSON: (sessionId) => ipcRenderer.invoke('export:conversation-json', sessionId),
    toMarkdown: (sessionId) => ipcRenderer.invoke('export:conversation-markdown', sessionId),
    toPDF: (sessionId) => ipcRenderer.invoke('export:conversation-pdf', sessionId),
    toDOCX: (sessionId) => ipcRenderer.invoke('export:conversation-docx', sessionId)
  },

  // Phase 4: RAG (Retrieval Augmented Generation)
  rag: {
    retrieveContext: (query, options) => ipcRenderer.invoke('rag:retrieve-context', query, options),
    getSessionCitations: (sessionId) => ipcRenderer.invoke('rag:get-session-citations', sessionId)
  },

  // src/ui/settings/ShortCutSettingsView.js
  shortcutSettingsView: {
    // Shortcut Management
    saveShortcuts: (shortcuts) => ipcRenderer.invoke('shortcut:saveShortcuts', shortcuts),
    getDefaultShortcuts: () => ipcRenderer.invoke('shortcut:getDefaultShortcuts'),
    closeShortcutSettingsWindow: () => ipcRenderer.invoke('shortcut:closeShortcutSettingsWindow'),
    
    // Listeners
    onLoadShortcuts: (callback) => ipcRenderer.on('shortcut:loadShortcuts', callback),
    removeOnLoadShortcuts: (callback) => ipcRenderer.removeListener('shortcut:loadShortcuts', callback)
  },

  // src/ui/app/content.html inline scripts
  content: {
    // Listeners
    onSettingsWindowHideAnimation: (callback) => ipcRenderer.on('settings-window-hide-animation', callback),
    removeOnSettingsWindowHideAnimation: (callback) => ipcRenderer.removeListener('settings-window-hide-animation', callback),    
  },

  // src/ui/listen/audioCore/listenCapture.js
  listenCapture: {
    // Audio Management
    sendMicAudioContent: (data) => ipcRenderer.invoke('listen:sendMicAudio', data),
    sendSystemAudioContent: (data) => ipcRenderer.invoke('listen:sendSystemAudio', data),
    startMacosSystemAudio: () => ipcRenderer.invoke('listen:startMacosSystemAudio'),
    stopMacosSystemAudio: () => ipcRenderer.invoke('listen:stopMacosSystemAudio'),
    
    // Session Management
    isSessionActive: () => ipcRenderer.invoke('listen:isSessionActive'),
    
    // Listeners
    onSystemAudioData: (callback) => ipcRenderer.on('system-audio-data', callback),
    removeOnSystemAudioData: (callback) => ipcRenderer.removeListener('system-audio-data', callback)
  },

  // src/ui/listen/audioCore/renderer.js
  renderer: {
    // Listeners
    onChangeListenCaptureState: (callback) => ipcRenderer.on('change-listen-capture-state', callback),
    removeOnChangeListenCaptureState: (callback) => ipcRenderer.removeListener('change-listen-capture-state', callback)
  },

  // src/ui/onboarding/OnboardingWizard.js & Profile Management
  profile: {
    // User Profile Management
    getCurrentProfile: () => ipcRenderer.invoke('profile:get-current'),
    needsOnboarding: () => ipcRenderer.invoke('profile:needs-onboarding'),
    startOnboarding: () => ipcRenderer.invoke('profile:start-onboarding'),
    completeOnboarding: (data) => ipcRenderer.invoke('profile:complete-onboarding', data),
    switchProfile: (profileId, reason) => ipcRenderer.invoke('profile:switch', { profileId, reason }),
    updatePreferences: (preferences) => ipcRenderer.invoke('profile:update-preferences', preferences),
    getSwitchHistory: (limit) => ipcRenderer.invoke('profile:get-switch-history', limit),
    getUsageStats: () => ipcRenderer.invoke('profile:get-usage-stats'),

    // Agent Profile Management
    getAgentProfiles: () => ipcRenderer.invoke('profile:get-agent-profiles'),
    getCurrentAgent: () => ipcRenderer.invoke('profile:get-current-agent'),
    getOnboardingQuestions: (profileId) => ipcRenderer.invoke('profile:get-onboarding-questions', profileId),

    // Theme Management (Phase WOW 1 - Jour 3)
    getTheme: (profileId) => ipcRenderer.invoke('profile:get-theme', profileId),
    getCurrentTheme: () => ipcRenderer.invoke('profile:get-current-theme'),
    getAllThemes: () => ipcRenderer.invoke('profile:get-all-themes'),

    // Agent Router & Suggestions (Phase WOW 1 - Jour 4)
    analyzeSuggestion: (question, currentProfile) => ipcRenderer.invoke('profile:analyze-suggestion', { question, currentProfile }),
    acceptSuggestion: (suggestion) => ipcRenderer.invoke('profile:accept-suggestion', suggestion),
    rejectSuggestion: (suggestion) => ipcRenderer.invoke('profile:reject-suggestion', suggestion),
    getSuggestionHistory: (limit) => ipcRenderer.invoke('profile:get-suggestion-history', limit),
    getSuggestionStats: () => ipcRenderer.invoke('profile:get-suggestion-stats'),
    setSuggestionsEnabled: (enabled) => ipcRenderer.invoke('profile:set-suggestions-enabled', enabled),

    // Listeners
    onThemeChanged: (callback) => ipcRenderer.on('profile:theme-changed', (event, data) => callback(data)),
    removeOnThemeChanged: (callback) => ipcRenderer.removeListener('profile:theme-changed', callback),
    onProfileSwitched: (callback) => ipcRenderer.on('profile-switched', (event, data) => callback(data)),
    removeOnProfileSwitched: (callback) => ipcRenderer.removeListener('profile-switched', callback)
  },

  // Phase WOW 1 - Jour 5: Prompt Engineering & User Context
  prompt: {
    // Generate enriched prompt for AI
    generate: ({ question, profileId, uid, sessionId, customContext }) =>
      ipcRenderer.invoke('prompt:generate', { question, profileId, uid, sessionId, customContext }),

    // Get profile information
    getProfileInfo: (profileId) => ipcRenderer.invoke('prompt:get-profile-info', profileId),

    // Get available profiles
    getAvailableProfiles: () => ipcRenderer.invoke('prompt:get-available-profiles')
  },

  context: {
    // Get user context
    get: (uid) => ipcRenderer.invoke('context:get', uid),

    // Save user context
    save: (uid, context) => ipcRenderer.invoke('context:save', { uid, context }),

    // Update user context
    update: (uid, updates) => ipcRenderer.invoke('context:update', { uid, updates }),

    // Complete onboarding
    completeOnboarding: (uid) => ipcRenderer.invoke('context:complete-onboarding', uid),

    // Skip onboarding
    skipOnboarding: (uid) => ipcRenderer.invoke('context:skip-onboarding', uid),

    // Check if onboarding completed
    hasCompletedOnboarding: (uid) => ipcRenderer.invoke('context:has-completed-onboarding', uid),

    // Get context summary
    getSummary: (uid) => ipcRenderer.invoke('context:get-summary', uid)
  }
});