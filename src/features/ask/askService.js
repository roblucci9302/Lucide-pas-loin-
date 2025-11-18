const { BrowserWindow } = require('electron');
const { createStreamingLLM } = require('../common/ai/factory');
// Lazy require helper to avoid circular dependency issues
const getWindowManager = () => require('../../window/windowManager');
const internalBridge = require('../../bridge/internalBridge');

const getWindowPool = () => {
    try {
        return getWindowManager().windowPool;
    } catch {
        return null;
    }
};

const sessionRepository = require('../common/repositories/session');
const askRepository = require('./repositories');
const { getSystemPrompt } = require('../common/prompts/promptBuilder');
const path = require('node:path');
const fs = require('node:fs');
const os = require('os');
const util = require('util');
const execFile = util.promisify(require('child_process').execFile);
const { desktopCapturer } = require('electron');
const modelStateService = require('../common/services/modelStateService');
const agentProfileService = require('../common/services/agentProfileService');
const agentRouterService = require('../common/services/agentRouterService');
const conversationHistoryService = require('../common/services/conversationHistoryService');
const documentService = require('../common/services/documentService');
const ragService = require('../common/services/ragService');
const promptEngineeringService = require('../common/services/promptEngineeringService'); // Phase WOW 1 - Jour 5
const responseQualityService = require('../common/services/responseQualityService'); // Phase 3 - Agent Improvement
const userLearningService = require('../common/services/userLearningService'); // Phase 2 - Long-term memory
const personalKnowledgeBaseService = require('../common/services/personalKnowledgeBaseService'); // Phase 2 - Long-term memory
const semanticCacheService = require('../common/services/semanticCacheService'); // Phase 3 - Performance & Optimization
const modelSelectionService = require('../common/services/modelSelectionService'); // Phase 3 - Performance & Optimization
const styleAdaptationService = require('../common/services/styleAdaptationService'); // Phase 3 - Performance & Optimization
const chunkedGenerationService = require('../common/services/chunkedGenerationService'); // Phase 2 - Chunked Generation

// Try to load sharp, but don't fail if it's not available
let sharp;
try {
    sharp = require('sharp');
    console.log('[AskService] Sharp module loaded successfully');
} catch (error) {
    console.warn('[AskService] Sharp module not available:', error.message);
    console.warn('[AskService] Screenshot functionality will work with reduced image processing capabilities');
    sharp = null;
}
let lastScreenshot = null;

// 🆕 LENGTH_PRESETS - Configuration pour le contrôle de la longueur des réponses
const LENGTH_PRESETS = {
    concise: 512,        // Réponse courte et concise
    standard: 2048,      // Longueur standard (ancienne valeur par défaut)
    detailed: 4096,      // Réponse détaillée (nouvelle valeur par défaut)
    comprehensive: 8192  // Document complet et exhaustif (nécessite Gemini)
};

async function captureScreenshot(options = {}) {
    if (process.platform === 'darwin') {
        try {
            const tempPath = path.join(os.tmpdir(), `screenshot-${Date.now()}.jpg`);

            await execFile('screencapture', ['-x', '-t', 'jpg', tempPath]);

            const imageBuffer = await fs.promises.readFile(tempPath);
            await fs.promises.unlink(tempPath);

            if (sharp) {
                try {
                    // Try using sharp for optimal image processing
                    const resizedBuffer = await sharp(imageBuffer)
                        .resize({ height: 384 })
                        .jpeg({ quality: 80 })
                        .toBuffer();

                    const base64 = resizedBuffer.toString('base64');
                    const metadata = await sharp(resizedBuffer).metadata();

                    lastScreenshot = {
                        base64,
                        width: metadata.width,
                        height: metadata.height,
                        timestamp: Date.now(),
                    };

                    return { success: true, base64, width: metadata.width, height: metadata.height };
                } catch (sharpError) {
                    console.warn('Sharp module failed, falling back to basic image processing:', sharpError.message);
                }
            }
            
            // Fallback: Return the original image without resizing
            console.log('[AskService] Using fallback image processing (no resize/compression)');
            const base64 = imageBuffer.toString('base64');
            
            lastScreenshot = {
                base64,
                width: null, // We don't have metadata without sharp
                height: null,
                timestamp: Date.now(),
            };

            return { success: true, base64, width: null, height: null };
        } catch (error) {
            console.error('Failed to capture screenshot:', error);
            return { success: false, error: error.message };
        }
    }

    try {
        const sources = await desktopCapturer.getSources({
            types: ['screen'],
            thumbnailSize: {
                width: 1920,
                height: 1080,
            },
        });

        if (sources.length === 0) {
            throw new Error('No screen sources available');
        }
        const source = sources[0];
        const buffer = source.thumbnail.toJPEG(70);
        const base64 = buffer.toString('base64');
        const size = source.thumbnail.getSize();

        return {
            success: true,
            base64,
            width: size.width,
            height: size.height,
        };
    } catch (error) {
        console.error('Failed to capture screenshot using desktopCapturer:', error);
        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * @class
 * @description
 */
class AskService {
    constructor() {
        this.abortController = null;
        this.state = {
            isVisible: false,
            isLoading: false,
            isStreaming: false,
            currentQuestion: '',
            currentResponse: '',
            showTextInput: true,
        };
        console.log('[AskService] Service instance created.');
    }

    _broadcastState() {
        const askWindow = getWindowPool()?.get('ask');
        if (askWindow && !askWindow.isDestroyed()) {
            askWindow.webContents.send('ask:stateUpdate', this.state);
        }
    }

    async toggleAskButton(inputScreenOnly = false) {
        console.log('[AskService] ===========================================');
        console.log('[AskService] toggleAskButton() called');
        const askWindow = getWindowPool()?.get('ask');

        let shouldSendScreenOnly = false;
        if (inputScreenOnly && this.state.showTextInput && askWindow && askWindow.isVisible()) {
            shouldSendScreenOnly = true;
            await this.sendMessage('', []);
            console.log('[AskService] ===========================================');
            return;
        }

        // CORRECTION BUG #3b : Toujours afficher la fenêtre et focus l'input
        // Ne plus faire de toggle, toujours activer
        if (!askWindow || !askWindow.isVisible()) {
            console.log('[AskService] Showing hidden Ask window');
            internalBridge.emit('window:requestVisibility', { name: 'ask', visible: true });
            this.state.isVisible = true;
        } else {
            console.log('[AskService] Ask window already visible');
        }

        // Toujours activer l'input et le focus
        console.log('[AskService] Activating text input and focusing...');
        this.state.showTextInput = true;
        this._broadcastState();

        // Envoyer un signal explicite pour focaliser le champ de texte après un délai plus long
        setTimeout(() => {
            if (askWindow && !askWindow.isDestroyed()) {
                console.log('[AskService] Sending focus signal to Ask window');
                askWindow.webContents.send('ask:showTextInput');
            } else {
                console.warn('[AskService] Ask window not available for focusing');
            }
        }, 200); // Augmentation du délai à 200ms

        console.log('[AskService] ===========================================');
    }

    async openBrowser(url = 'https://www.google.com') {
        console.log('[AskService] ===========================================');
        console.log('[AskService] openBrowser() called with URL:', url);
        const askWindow = getWindowPool()?.get('ask');

        // Afficher la fenêtre Ask si elle n'est pas visible
        if (!askWindow || !askWindow.isVisible()) {
            console.log('[AskService] Showing Ask window for browser mode');
            internalBridge.emit('window:requestVisibility', { name: 'ask', visible: true });
            this.state.isVisible = true;
            this._broadcastState();

            // Attendre un peu pour que la fenêtre soit complètement chargée
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        // Envoyer l'URL au renderer pour ouvrir le navigateur
        if (askWindow && !askWindow.isDestroyed()) {
            console.log('[AskService] Sending open-url event to renderer');
            askWindow.webContents.send('ask:open-url', url);
        } else {
            console.error('[AskService] Ask window not available');
        }

        console.log('[AskService] ===========================================');
    }

    async closeAskWindow () {
            if (this.abortController) {
                this.abortController.abort('Window closed by user');
                this.abortController = null;
            }

            this.state = {
                isVisible      : false,
                isLoading      : false,
                isStreaming    : false,
                currentQuestion: '',
                currentResponse: '',
                showTextInput  : true,
            };
            this._broadcastState();

            internalBridge.emit('window:requestVisibility', { name: 'ask', visible: false });

            return { success: true };
        }

    async minimizeAskWindow() {
        // Masquer la fenêtre Ask sans effacer le contenu
        this.state.isVisible = false;
        internalBridge.emit('window:requestVisibility', { name: 'ask', visible: false });
        return { success: true };
    }

    async showListenWindow() {
        // Afficher la fenêtre Listen (conversation)
        internalBridge.emit('window:requestVisibility', { name: 'listen', visible: true });
        return { success: true };
    }
    

    /**
     * 
     * @param {string[]} conversationTexts
     * @returns {string}
     * @private
     */
    _formatConversationForPrompt(conversationTexts) {
        if (!conversationTexts || conversationTexts.length === 0) {
            return 'No conversation history available.';
        }
        return conversationTexts.slice(-30).join('\n');
    }

    /**
     * 
     * @param {string} userPrompt
     * @returns {Promise<{success: boolean, response?: string, error?: string}>}
     */
    async sendMessage(userPrompt, conversationHistoryRaw=[], targetLength='detailed') {
        internalBridge.emit('window:requestVisibility', { name: 'ask', visible: true });
        this.state = {
            ...this.state,
            isLoading: true,
            isStreaming: false,
            currentQuestion: userPrompt,
            currentResponse: '',
            showTextInput: false,
        };
        this._broadcastState();

        if (this.abortController) {
            this.abortController.abort('New request received.');
        }
        this.abortController = new AbortController();
        const { signal } = this.abortController;

        // Track response time for quality metrics
        const responseStartTime = Date.now();

        let sessionId;

        try {
            console.log(`[AskService] 🤖 Processing message: ${userPrompt.substring(0, 50)}...`);

            sessionId = await sessionRepository.getOrCreateActive('ask');
            await askRepository.addAiMessage({ sessionId, role: 'user', content: userPrompt.trim() });
            console.log(`[AskService] DB: Saved user prompt to session ${sessionId}`);

            // PHASE 1: AGENT ROUTER - Intelligent routing to specialized agents
            // Auto-detect and switch to the most appropriate agent based on question
            const userId = sessionRepository.getCurrentUserId ? await sessionRepository.getCurrentUserId() : null;

            if (userId && userPrompt && userPrompt.trim().length > 0) {
                try {
                    const routing = await agentRouterService.routeQuestion(userPrompt, userId);
                    const currentProfile = agentProfileService.getCurrentProfile();

                    // Auto-switch if confidence is high and different from current profile
                    if (routing.confidence > 0.75 && routing.agent !== currentProfile) {
                        console.log(`[AskService] 🔄 Auto-switching agent: ${currentProfile} → ${routing.agent} (confidence: ${routing.confidence.toFixed(2)})`);

                        await agentProfileService.setActiveProfile(userId, routing.agent);

                        // Notify UI of agent switch
                        const askWindow = getWindowPool()?.get('ask');
                        if (askWindow && !askWindow.isDestroyed()) {
                            const profileInfo = agentProfileService.getProfileById(routing.agent);
                            askWindow.webContents.send('agent-switched', {
                                agent: routing.agent,
                                agentName: profileInfo?.name || routing.agent,
                                agentIcon: profileInfo?.icon || '🤖',
                                confidence: routing.confidence,
                                reason: routing.reason,
                                previousAgent: currentProfile
                            });
                        }
                    } else {
                        console.log(`[AskService] ✓ Agent routing confirmed: ${routing.agent} (confidence: ${routing.confidence.toFixed(2)})`);
                    }
                } catch (routingError) {
                    console.warn('[AskService] Agent routing failed, using current profile:', routingError);
                    // Continue with current profile if routing fails
                }
            }

            // Get the current active agent profile (potentially updated by router)
            const activeProfile = agentProfileService.getCurrentProfile();
            console.log(`[AskService] Using agent profile: ${activeProfile}`);

            // Phase 3: Performance - Check semantic cache before processing
            if (userId) {
                try {
                    const cachedResult = await semanticCacheService.getCachedResponse(
                        userPrompt,
                        userId,
                        activeProfile
                    );

                    if (cachedResult.hit) {
                        console.log(`[AskService] 🎯 Cache HIT! Using cached response (similarity: ${Math.round(cachedResult.similarity * 100)}%)`);

                        // Send cached response directly to UI
                        const askWin = getWindowPool()?.get('ask');
                        if (askWin && !askWin.isDestroyed()) {
                            this.state.isLoading = false;
                            this.state.isStreaming = false;
                            this.state.currentResponse = cachedResult.response;
                            this._broadcastState();

                            // Save the cached response as assistant message
                            await askRepository.addAiMessage({
                                sessionId,
                                role: 'assistant',
                                content: cachedResult.response
                            });

                            // Update session metadata
                            await conversationHistoryService.updateSessionMetadata(sessionId, {
                                agent_profile: activeProfile
                            });

                            this.state.showTextInput = true;
                            this._broadcastState();

                            return {
                                success: true,
                                cached: true,
                                similarity: cachedResult.similarity,
                                source: cachedResult.source
                            };
                        }
                    } else {
                        console.log('[AskService] ❌ Cache MISS - Generating new response');
                    }
                } catch (cacheError) {
                    console.warn('[AskService] Cache lookup failed (non-critical):', cacheError.message);
                    // Continue with normal flow if cache fails
                }
            }

            // Update session metadata with agent profile
            await conversationHistoryService.updateSessionMetadata(sessionId, {
                agent_profile: activeProfile
            });

            // Update message count
            const messageCount = await conversationHistoryService.updateMessageCount(sessionId);

            // Auto-generate title if this is the first message
            if (messageCount === 1) {
                const generatedTitle = await conversationHistoryService.generateTitleFromContent(sessionId);
                await conversationHistoryService.updateSessionMetadata(sessionId, {
                    title: generatedTitle,
                    auto_title: 1
                });
                console.log(`[AskService] Auto-generated title: "${generatedTitle}"`);
            }

            // Phase 4: RAG - Retrieve relevant context from knowledge base
            // userId already declared at line 253
            let ragContext = null;
            let ragSources = [];

            if (userId) {
                try {
                    // Check if user has indexed documents
                    const stats = await documentService.getDocumentStats(userId);

                    if (stats && stats.indexed_documents > 0) {
                        console.log(`[AskService] RAG: User has ${stats.indexed_documents} indexed documents, retrieving context...`);

                        // Retrieve relevant context
                        ragContext = await ragService.retrieveContext(userPrompt, {
                            maxChunks: 5,
                            minScore: 0.7
                        });

                        if (ragContext && ragContext.hasContext) {
                            ragSources = ragContext.sources || [];
                            console.log(`[AskService] RAG: Retrieved ${ragSources.length} relevant chunks (${ragContext.totalTokens} tokens)`);
                        }
                    }
                } catch (ragError) {
                    console.warn('[AskService] RAG: Error retrieving context, continuing without RAG:', ragError);
                    // Continue without RAG if it fails
                }
            }

            // Phase 3: Performance - Intelligent model selection based on complexity
            let selectedModel = null;
            let complexityAnalysis = null;

            try {
                // Retrieve conversation history for complexity analysis
                const previousMessagesForAnalysis = await conversationHistoryService.getSessionMessages(sessionId);

                complexityAnalysis = modelSelectionService.analyzeAndSelect(userPrompt, {
                    conversationHistory: previousMessagesForAnalysis.slice(-10), // Last 5 exchanges
                    agentProfile: activeProfile,
                    currentProvider: 'openai' // Default, will be overridden if available
                });

                selectedModel = complexityAnalysis.selection;
                console.log(`[AskService] 🎯 Model Selection: ${selectedModel.tier} tier - ${selectedModel.model} (${selectedModel.reason})`);
                console.log(`[AskService] 📊 Complexity: level=${complexityAnalysis.complexity.level}, score=${complexityAnalysis.complexity.score}, confidence=${Math.round(complexityAnalysis.complexity.confidence * 100)}%`);
            } catch (modelSelectionError) {
                console.warn('[AskService] Model selection failed (non-critical):', modelSelectionError.message);
                // Continue with default model if selection fails
            }

            const modelInfo = await modelStateService.getCurrentModelInfo('llm');
            if (!modelInfo || !modelInfo.apiKey) {
                throw new Error('AI model or API key not configured.');
            }

            // Override with selected model if available
            if (selectedModel && selectedModel.model) {
                console.log(`[AskService] Using optimized model: ${selectedModel.model} (was: ${modelInfo.model})`);
                modelInfo.model = selectedModel.model;
            } else {
                console.log(`[AskService] Using default model: ${modelInfo.model} for provider: ${modelInfo.provider}`);
            }

            // 🆕 PHASE 1.3: Auto-switch to Gemini for comprehensive (long) documents
            if (targetLength === 'comprehensive') {
                const providerSettingsRepository = require('../common/repositories/providerSettings');
                const geminiSettings = await providerSettingsRepository.getByProvider('gemini');

                if (geminiSettings && geminiSettings.api_key) {
                    console.log(`[AskService] 📄 Comprehensive document requested (8192 tokens)`);
                    console.log(`[AskService] 🔄 Auto-switching to Gemini for optimal long-form generation`);
                    console.log(`[AskService] Previous: ${modelInfo.provider}/${modelInfo.model}`);

                    // Switch to Gemini
                    modelInfo.provider = 'gemini';
                    modelInfo.apiKey = geminiSettings.api_key;
                    modelInfo.model = geminiSettings.selected_llm_model || 'gemini-2.5-flash';

                    console.log(`[AskService] New: ${modelInfo.provider}/${modelInfo.model}`);
                } else {
                    console.warn(`[AskService] ⚠️ Comprehensive length requested but Gemini not configured`);
                    console.warn(`[AskService] Continuing with ${modelInfo.provider} (may have token limitations)`);
                }
            }

            // Vérifier si les captures d'écran sont activées
            const isScreenshotEnabled = getWindowManager().getScreenshotEnabled();
            console.log(`[AskService] Screenshot capture is ${isScreenshotEnabled ? 'enabled' : 'disabled'}`);

            const screenshotResult = isScreenshotEnabled
                ? await captureScreenshot({ quality: 'medium' })
                : { success: false, base64: null };
            const screenshotBase64 = screenshotResult.success ? screenshotResult.base64 : null;

            // Récupérer l'historique de la session actuelle depuis la DB
            const previousMessages = await conversationHistoryService.getSessionMessages(sessionId);
            console.log(`[AskService] 📝 Retrieved ${previousMessages.length} previous messages from session ${sessionId}`);

            // Phase 3: Performance - Analyze user style preferences
            let stylePreferences = null;
            let styleInstructions = '';

            if (userId) {
                try {
                    stylePreferences = await styleAdaptationService.analyzeUserPreferences(userId, 50);
                    styleInstructions = styleAdaptationService.buildStyleInstructions(stylePreferences, activeProfile);
                    console.log(`[AskService] 🎨 Style Adaptation: Analyzed user preferences (technical: ${stylePreferences.technicalLevel}, formality: ${stylePreferences.formalityLevel})`);
                } catch (styleError) {
                    console.warn('[AskService] Style adaptation failed (non-critical):', styleError.message);
                }
            }

            // Phase WOW 1 - Jour 5: Generate enriched prompt with prompt engineering service
            let systemPrompt;
            try {
                const enrichedPrompt = await promptEngineeringService.generatePrompt({
                    question: userPrompt,
                    profileId: activeProfile,
                    uid: userId || 'default_user',
                    sessionId: sessionId,
                    customContext: {}
                });

                systemPrompt = enrichedPrompt.systemPrompt;

                // Phase 3: Inject style instructions into system prompt
                if (styleInstructions && styleInstructions.length > 0) {
                    systemPrompt += styleInstructions;
                    console.log(`[AskService] 🎨 Style instructions injected into prompt`);
                }

                console.log(`[AskService] 🎯 Prompt Engineering: Generated enriched prompt for ${activeProfile} (temp: ${enrichedPrompt.temperature})`);

                // Log metadata for debugging
                if (enrichedPrompt.metadata) {
                    console.log(`[AskService] 📊 Prompt metadata: type=${enrichedPrompt.metadata.questionType}, complexity=${enrichedPrompt.metadata.complexity}, hasContext=${enrichedPrompt.metadata.hasContext}`);
                }
            } catch (promptError) {
                console.warn('[AskService] Prompt engineering failed, falling back to default:', promptError);
                // Fallback to original system prompt generation
                const conversationHistory = this._formatConversationForPrompt(conversationHistoryRaw);
                systemPrompt = getSystemPrompt(activeProfile, conversationHistory, false);

                // Still inject style instructions in fallback
                if (styleInstructions && styleInstructions.length > 0) {
                    systemPrompt += styleInstructions;
                }
            }

            // Phase 4: RAG - Enrich system prompt with knowledge base context
            if (ragContext && ragContext.hasContext) {
                try {
                    const enriched = await ragService.buildEnrichedPrompt(
                        userPrompt,
                        systemPrompt,
                        ragContext
                    );

                    systemPrompt = enriched.prompt;
                    console.log(`[AskService] RAG: System prompt enriched with ${ragSources.length} sources`);
                } catch (enrichError) {
                    console.warn('[AskService] RAG: Error enriching prompt, using base prompt:', enrichError);
                    // Continue with base prompt if enrichment fails
                }
            }

            // 🆕 PHASE 2: CHUNKED GENERATION - Detect if we need chunking for long documents
            const chunkedGenService = chunkedGenerationService.getInstance();
            const needsChunking = chunkedGenService.shouldUseChunking(userPrompt, targetLength);

            if (needsChunking) {
                console.log('[AskService] 📚 Long document detected - using chunked generation');

                // Broadcast initial state
                this.state.isLoading = false;
                this.state.isStreaming = true;
                this.state.currentResponse = '📋 **Génération de document en cours...**\n\nAnalyse de votre demande et création de la structure...';
                this._broadcastState();

                // Generate document with progress updates
                const askWin = getWindowPool()?.get('ask');
                let fullDocument = '';

                try {
                    const result = await chunkedGenService.generateDocument(
                        userPrompt,
                        modelInfo,
                        systemPrompt,
                        (progressUpdate) => {
                            // Update UI with progress
                            if (progressUpdate.stage === 'outline') {
                                this.state.currentResponse = '📋 **Génération de document en cours...**\n\nCréation de la structure du document...';
                            } else if (progressUpdate.stage === 'introduction') {
                                this.state.currentResponse = `📋 **Structure créée !**\n\n${progressUpdate.outline.sections.length} sections identifiées\n\nGénération de l'introduction...`;
                            } else if (progressUpdate.stage === 'section') {
                                fullDocument = fullDocument || `# ${progressUpdate.outline?.title || 'Document'}\n\n`;
                                this.state.currentResponse = `📝 **Section ${progressUpdate.currentSection}/${progressUpdate.totalSections}**\n\n${progressUpdate.sectionTitle}\n\nGénération en cours... (${progressUpdate.progress}%)`;
                            } else if (progressUpdate.stage === 'conclusion') {
                                this.state.currentResponse = '🎯 **Rédaction de la conclusion...**\n\nSynthèse finale et recommandations...';
                            } else if (progressUpdate.stage === 'complete') {
                                this.state.currentResponse = '✅ **Document terminé !**';
                            }

                            this._broadcastState();

                            // Also send to window if available
                            if (askWin && !askWin.isDestroyed()) {
                                askWin.webContents.send('ask-response-stream-chunk', {
                                    content: this.state.currentResponse
                                });
                            }
                        }
                    );

                    if (result.success) {
                        fullDocument = result.content;

                        // Update final state
                        this.state.isStreaming = false;
                        this.state.currentResponse = fullDocument;
                        this._broadcastState();

                        if (askWin && !askWin.isDestroyed()) {
                            askWin.webContents.send('ask-response-stream-complete', {
                                content: fullDocument
                            });
                        }

                        // Save to database
                        await askRepository.addAiMessage({
                            sessionId,
                            role: 'assistant',
                            content: fullDocument
                        });

                        console.log(`[AskService] ✅ Chunked document generated: ${result.stats.estimatedPages} pages, ${result.stats.estimatedWords} words`);

                        return { success: true };
                    } else {
                        throw new Error(result.error || 'Chunked generation failed');
                    }
                } catch (chunkError) {
                    console.error('[AskService] Chunked generation failed, falling back to normal generation:', chunkError);
                    // Fall through to normal generation as fallback
                }
            }

            // Construire le tableau de messages avec l'historique pour maintenir le contexte
            const messages = [
                { role: 'system', content: systemPrompt }
            ];

            // Ajouter les messages précédents de la session (en excluant le tout dernier qui est la question actuelle)
            // Limiter à 10 derniers échanges pour éviter de dépasser les limites de tokens
            // On exclut le dernier message car c'est celui qu'on vient d'ajouter à la ligne 261
            const messagesForContext = previousMessages.slice(0, -1); // Exclure le dernier message
            const recentMessages = messagesForContext.slice(-20); // 20 messages = ~10 échanges user/assistant

            for (const msg of recentMessages) {
                messages.push({
                    role: msg.role,
                    content: msg.content
                });
            }

            // Ajouter le nouveau message utilisateur
            messages.push({
                role: 'user',
                content: [
                    { type: 'text', text: `User Request: ${userPrompt.trim()}` },
                ],
            });

            // Ajouter le screenshot au dernier message utilisateur (si disponible)
            if (screenshotBase64) {
                const lastMessageIndex = messages.length - 1;
                messages[lastMessageIndex].content.push({
                    type: 'image_url',
                    image_url: { url: `data:image/jpeg;base64,${screenshotBase64}` },
                });
            }
            
            // 🆕 Déterminer maxTokens basé sur targetLength
            const maxTokens = LENGTH_PRESETS[targetLength] || LENGTH_PRESETS.detailed;
            console.log(`[AskService] Using targetLength: ${targetLength} (maxTokens: ${maxTokens})`);

            const streamingLLM = createStreamingLLM(modelInfo.provider, {
                apiKey: modelInfo.apiKey,
                model: modelInfo.model,
                temperature: 0.7,
                maxTokens: maxTokens,
                usePortkey: modelInfo.provider === 'openai-glass',
                portkeyVirtualKey: modelInfo.provider === 'openai-glass' ? modelInfo.apiKey : undefined,
            });

            try {
                const response = await streamingLLM.streamChat(messages);
                const askWin = getWindowPool()?.get('ask');

                if (!askWin || askWin.isDestroyed()) {
                    console.error("[AskService] Ask window is not available to send stream to.");
                    response.body.getReader().cancel();
                    return { success: false, error: 'Ask window is not available.' };
                }

                const reader = response.body.getReader();
                signal.addEventListener('abort', () => {
                    console.log(`[AskService] Aborting stream reader. Reason: ${signal.reason}`);
                    reader.cancel(signal.reason).catch(() => { /* 이미 취소된 경우의 오류는 무시 */ });
                });

                await this._processStream(reader, askWin, sessionId, signal, ragSources, {
                    question: userPrompt,
                    agentProfile: activeProfile,
                    userId: userId,
                    model: modelInfo.model,
                    provider: modelInfo.provider,
                    responseStartTime: responseStartTime
                });
                return { success: true };

            } catch (multimodalError) {
                // 멀티모달 요청이 실패했고 스크린샷이 포함되어 있다면 텍스트만으로 재시도
                if (screenshotBase64 && this._isMultimodalError(multimodalError)) {
                    console.log(`[AskService] Multimodal request failed, retrying with text-only: ${multimodalError.message}`);
                    
                    // 텍스트만으로 메시지 재구성
                    const textOnlyMessages = [
                        { role: 'system', content: systemPrompt },
                        {
                            role: 'user',
                            content: `User Request: ${userPrompt.trim()}`
                        }
                    ];

                    const fallbackResponse = await streamingLLM.streamChat(textOnlyMessages);
                    const askWin = getWindowPool()?.get('ask');

                    if (!askWin || askWin.isDestroyed()) {
                        console.error("[AskService] Ask window is not available for fallback response.");
                        fallbackResponse.body.getReader().cancel();
                        return { success: false, error: 'Ask window is not available.' };
                    }

                    const fallbackReader = fallbackResponse.body.getReader();
                    signal.addEventListener('abort', () => {
                        console.log(`[AskService] Aborting fallback stream reader. Reason: ${signal.reason}`);
                        fallbackReader.cancel(signal.reason).catch(() => {});
                    });

                    await this._processStream(fallbackReader, askWin, sessionId, signal, ragSources, {
                        question: userPrompt,
                        agentProfile: activeProfile,
                        userId: userId,
                        model: modelInfo.model,
                        provider: modelInfo.provider,
                        responseStartTime: responseStartTime
                    });
                    return { success: true };
                } else {
                    // 다른 종류의 에러이거나 스크린샷이 없었다면 그대로 throw
                    throw multimodalError;
                }
            }

        } catch (error) {
            console.error('[AskService] Error during message processing:', error);
            this.state = {
                ...this.state,
                isLoading: false,
                isStreaming: false,
                showTextInput: true,
            };
            this._broadcastState();

            const askWin = getWindowPool()?.get('ask');
            if (askWin && !askWin.isDestroyed()) {
                const streamError = error.message || 'Unknown error occurred';
                askWin.webContents.send('ask-response-stream-error', { error: streamError });
            }

            return { success: false, error: error.message };
        }
    }

    /**
     *
     * @param {ReadableStreamDefaultReader} reader
     * @param {BrowserWindow} askWin
     * @param {number} sessionId
     * @param {AbortSignal} signal
     * @param {Array} ragSources - RAG sources used
     * @param {Object} metadata - Metadata for quality evaluation
     * @returns {Promise<void>}
     * @private
     */
    async _processStream(reader, askWin, sessionId, signal, ragSources = [], metadata = {}) {
        const decoder = new TextDecoder();
        let fullResponse = '';

        try {
            this.state.isLoading = false;
            this.state.isStreaming = true;
            this._broadcastState();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim() !== '');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.substring(6);
                        if (data === '[DONE]') {
                            return; 
                        }
                        try {
                            const json = JSON.parse(data);
                            const token = json.choices[0]?.delta?.content || '';
                            if (token) {
                                fullResponse += token;
                                this.state.currentResponse = fullResponse;
                                this._broadcastState();
                            }
                        } catch (error) {
                        }
                    }
                }
            }
        } catch (streamError) {
            if (signal.aborted) {
                console.log(`[AskService] Stream reading was intentionally cancelled. Reason: ${signal.reason}`);
            } else {
                console.error('[AskService] Error while processing stream:', streamError);
                if (askWin && !askWin.isDestroyed()) {
                    askWin.webContents.send('ask-response-stream-error', { error: streamError.message });
                }
            }
        } finally {
            this.state.isStreaming = false;
            this.state.currentResponse = fullResponse;
            this._broadcastState();
            if (fullResponse) {
                 try {
                    const messageRecord = await askRepository.addAiMessage({ sessionId, role: 'assistant', content: fullResponse });
                    console.log(`[AskService] DB: Saved partial or full assistant response to session ${sessionId} after stream ended.`);

                    // Phase 4: RAG - Track citations if context was used
                    if (ragSources && ragSources.length > 0) {
                        try {
                            const messageId = messageRecord?.id || null;
                            await ragService.trackCitations(sessionId, messageId, ragSources);
                            console.log(`[AskService] RAG: Tracked ${ragSources.length} citations for session ${sessionId}`);
                        } catch (citationError) {
                            console.warn('[AskService] RAG: Error tracking citations:', citationError);
                            // Non-critical error, don't fail the whole operation
                        }
                    }

                    // Phase 3: Performance - Cache successful response for future reuse
                    if (metadata.userId && metadata.question && fullResponse.length > 50) {
                        try {
                            const estimatedTokens = Math.round((metadata.question.length + fullResponse.length) / 4);
                            await semanticCacheService.setCachedResponse({
                                question: metadata.question,
                                response: fullResponse,
                                userId: metadata.userId,
                                agentProfile: metadata.agentProfile || 'lucide_assistant',
                                model: metadata.model || 'unknown',
                                provider: metadata.provider || 'unknown',
                                tokensUsed: estimatedTokens
                            });
                            console.log(`[AskService] ✅ Response cached for future reuse`);
                        } catch (cacheError) {
                            console.warn('[AskService] Response caching failed (non-critical):', cacheError.message);
                        }
                    }

                    // Phase 3: Agent Improvement - Evaluate response quality automatically
                    try {
                        const messageId = messageRecord?.id || null;
                        const latencyMs = Date.now() - (metadata.responseStartTime || Date.now());

                        const qualityMetrics = await responseQualityService.evaluateResponse({
                            userId: metadata.userId || 'default_user',
                            sessionId: sessionId,
                            messageId: messageId,
                            agentProfile: metadata.agentProfile || 'lucide_assistant',
                            question: metadata.question || '',
                            response: fullResponse,
                            latencyMs: latencyMs,
                            tokensInput: 0, // TODO: Track from AI provider
                            tokensOutput: 0, // TODO: Track from AI provider
                            sourcesUsed: ragSources?.length || 0,
                            cacheHit: false, // TODO: Implement cache detection
                            model: metadata.model || 'unknown',
                            provider: metadata.provider || 'unknown',
                            temperature: 0.7
                        });

                        console.log(`[AskService] 📊 Quality evaluation: ${Math.round(qualityMetrics.overallScore * 100)}% (length: ${Math.round(qualityMetrics.lengthScore * 100)}%, structure: ${Math.round(qualityMetrics.structureScore * 100)}%, vocab: ${Math.round(qualityMetrics.vocabularyScore * 100)}%)`);
                    } catch (qualityError) {
                        console.warn('[AskService] Quality evaluation failed (non-critical):', qualityError);
                        // Non-critical error, don't fail the whole operation
                    }

                    // Phase 2: Long-term memory - Async learning and indexing (fire-and-forget)
                    // These operations run in background without blocking the user experience
                    if (metadata.userId && sessionId) {
                        // Index conversation for semantic search
                        personalKnowledgeBaseService.indexConversation(sessionId, metadata.userId)
                            .then(result => {
                                if (result.success) {
                                    console.log(`[AskService] 🧠 Conversation indexed: ${result.chunksIndexed} chunks`);
                                }
                            })
                            .catch(indexError => {
                                console.warn('[AskService] Conversation indexing failed (non-critical):', indexError.message);
                            });

                        // Analyze conversation to learn about user (every 5th message to avoid overhead)
                        const messageCount = await conversationHistoryService.getSessionMessages(sessionId).then(msgs => msgs.length);
                        if (messageCount % 5 === 0 || messageCount >= 10) {
                            userLearningService.analyzeConversationForLearning(sessionId, metadata.userId)
                                .then(insights => {
                                    if (insights && insights.hasInsights) {
                                        console.log(`[AskService] 🎓 Learned from conversation: ${insights.summary}`);
                                    }
                                })
                                .catch(learningError => {
                                    console.warn('[AskService] User learning failed (non-critical):', learningError.message);
                                });
                        }
                    }
                } catch(dbError) {
                    console.error("[AskService] DB: Failed to save assistant response after stream ended:", dbError);
                }
            }
        }
    }

    /**
     * 멀티모달 관련 에러인지 판단
     * @private
     */
    _isMultimodalError(error) {
        const errorMessage = error.message?.toLowerCase() || '';
        return (
            errorMessage.includes('vision') ||
            errorMessage.includes('image') ||
            errorMessage.includes('multimodal') ||
            errorMessage.includes('unsupported') ||
            errorMessage.includes('image_url') ||
            errorMessage.includes('400') ||  // Bad Request often for unsupported features
            errorMessage.includes('invalid') ||
            errorMessage.includes('not supported')
        );
    }

    /**
     * 🆕 PHASE 3: CONTINUE GENERATION
     * Continue la génération d'une réponse existante
     * @param {string} userInstruction - Instructions optionnelles de l'utilisateur (ex: "développe la section X")
     * @returns {Promise<{success: boolean, response?: string, error?: string}>}
     */
    async continueGeneration(userInstruction = '') {
        console.log('[AskService] 🔄 Continue generation requested');

        internalBridge.emit('window:requestVisibility', { name: 'ask', visible: true });

        this.state = {
            ...this.state,
            isLoading: true,
            isStreaming: false,
        };
        this._broadcastState();

        if (this.abortController) {
            this.abortController.abort('New continuation request received.');
        }
        this.abortController = new AbortController();
        const { signal } = this.abortController;

        const responseStartTime = Date.now();
        let sessionId;

        try {
            // Récupérer la session active et les messages récents
            sessionId = await sessionRepository.getOrCreateActive('ask');
            const previousMessages = await conversationHistoryService.getSessionMessages(sessionId);

            if (previousMessages.length < 2) {
                throw new Error('No previous conversation to continue from');
            }

            // Récupérer la dernière question et réponse
            const lastMessages = previousMessages.slice(-2);
            const lastUserMessage = lastMessages.find(m => m.role === 'user');
            const lastAssistantMessage = lastMessages.find(m => m.role === 'assistant');

            if (!lastAssistantMessage || !lastUserMessage) {
                throw new Error('Cannot find last exchange to continue');
            }

            console.log(`[AskService] Continuing from last response (${lastAssistantMessage.content.length} chars)`);

            // Construire le prompt de continuation
            const userId = sessionRepository.getCurrentUserId ? await sessionRepository.getCurrentUserId() : null;
            const activeProfile = agentProfileService.getCurrentProfile();

            // Récupérer les informations du modèle
            const modelInfo = await modelStateService.getCurrentModelInfo('llm');
            if (!modelInfo || !modelInfo.apiKey) {
                throw new Error('AI model or API key not configured.');
            }

            // Générer le système prompt avec le contexte de continuation
            const conversationHistory = this._formatConversationForPrompt(previousMessages.slice(0, -2));
            const baseSystemPrompt = getSystemPrompt(activeProfile, conversationHistory, false);

            const continuationPrompt = `${baseSystemPrompt}

CONTINUATION CONTEXT:
You previously provided a response to the user's question. The user now wants you to continue or expand on your previous answer.

ORIGINAL QUESTION:
${lastUserMessage.content}

YOUR PREVIOUS RESPONSE:
${lastAssistantMessage.content}

${userInstruction ? `USER CONTINUATION INSTRUCTION:\n${userInstruction}\n\n` : ''}TASK:
Continue your previous response seamlessly. You should:
1. Pick up exactly where you left off (don't repeat what you already said)
2. Maintain the same tone, style, and level of detail
3. Provide additional information, examples, or elaboration
4. ${userInstruction ? 'Follow the user\'s specific instruction above' : 'Expand on the topic naturally'}
5. Ensure the continuation flows naturally from your previous response

OUTPUT: Write ONLY the continuation content, starting directly with new information.`;

            const messages = [
                { role: 'system', content: continuationPrompt },
                { role: 'user', content: userInstruction || 'Continue your previous response with more details and examples.' }
            ];

            // Déterminer maxTokens basé sur targetLength par défaut 'detailed'
            const maxTokens = LENGTH_PRESETS.detailed || 4096;
            console.log(`[AskService] Continue generation with maxTokens: ${maxTokens}`);

            const streamingLLM = createStreamingLLM(modelInfo.provider, {
                apiKey: modelInfo.apiKey,
                model: modelInfo.model,
                temperature: 0.7,
                maxTokens: maxTokens,
                usePortkey: modelInfo.provider === 'openai-glass',
                portkeyVirtualKey: modelInfo.provider === 'openai-glass' ? modelInfo.apiKey : undefined,
            });

            const response = await streamingLLM.streamChat(messages);
            const askWin = getWindowPool()?.get('ask');

            if (!askWin || askWin.isDestroyed()) {
                console.error("[AskService] Ask window is not available to send stream to.");
                response.body.getReader().cancel();
                return { success: false, error: 'Ask window is not available.' };
            }

            const reader = response.body.getReader();
            signal.addEventListener('abort', () => {
                console.log(`[AskService] Aborting continuation stream reader. Reason: ${signal.reason}`);
                reader.cancel(signal.reason).catch(() => { /* ignore */ });
            });

            // Traiter le stream
            const decoder = new TextDecoder();
            let continuationContent = '';

            try {
                this.state.isLoading = false;
                this.state.isStreaming = true;
                this.state.currentResponse = lastAssistantMessage.content + '\n\n'; // Start with existing content
                this._broadcastState();

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n').filter(line => line.trim() !== '');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.substring(6);
                            if (data === '[DONE]') break;

                            try {
                                const json = JSON.parse(data);
                                const token = json.choices[0]?.delta?.content || '';
                                if (token) {
                                    continuationContent += token;
                                    this.state.currentResponse = lastAssistantMessage.content + '\n\n' + continuationContent;
                                    this._broadcastState();
                                }
                            } catch (error) {
                                // Ignore parsing errors
                            }
                        }
                    }
                }

                // Sauvegarder la continuation complète
                this.state.isStreaming = false;
                const fullUpdatedResponse = lastAssistantMessage.content + '\n\n' + continuationContent;
                this.state.currentResponse = fullUpdatedResponse;
                this._broadcastState();

                if (continuationContent) {
                    // Mettre à jour le message assistant existant en base de données
                    await askRepository.updateAiMessage({
                        sessionId,
                        messageId: lastAssistantMessage.id,
                        content: fullUpdatedResponse
                    });

                    console.log(`[AskService] ✅ Continuation added: ${continuationContent.length} new characters`);
                }

                return { success: true, response: fullUpdatedResponse };

            } catch (streamError) {
                if (signal.aborted) {
                    console.log(`[AskService] Continuation stream was intentionally cancelled. Reason: ${signal.reason}`);
                } else {
                    console.error('[AskService] Error while processing continuation stream:', streamError);
                    if (askWin && !askWin.isDestroyed()) {
                        askWin.webContents.send('ask-response-stream-error', { error: streamError.message });
                    }
                }
                throw streamError;
            }

        } catch (error) {
            console.error('[AskService] Error during continuation:', error);
            this.state = {
                ...this.state,
                isLoading: false,
                isStreaming: false,
                showTextInput: true,
            };
            this._broadcastState();

            const askWin = getWindowPool()?.get('ask');
            if (askWin && !askWin.isDestroyed()) {
                const streamError = error.message || 'Unknown error occurred';
                askWin.webContents.send('ask-response-stream-error', { error: streamError });
            }

            return { success: false, error: error.message };
        }
    }

}

const askService = new AskService();

module.exports = askService;