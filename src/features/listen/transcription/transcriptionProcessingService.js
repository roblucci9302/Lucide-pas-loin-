/**
 * Transcription Processing Service - Phase 6.4: Outils AI Interactifs
 *
 * Provides AI-powered tools for working with transcriptions:
 * - Summarize selected text
 * - Expand/develop text
 * - Extract key points
 * - Rewrite in different styles
 * - Generate contextual insights
 */

const { createLLM } = require('../../ai/llm/llmProvider');

class TranscriptionProcessingService {
    constructor() {
        this.llm = null;
        console.log('[TranscriptionProcessingService] Service initialized');
    }

    /**
     * Initialize LLM provider
     * @private
     */
    _getLLM() {
        if (!this.llm) {
            this.llm = createLLM();
        }
        return this.llm;
    }

    /**
     * Summarize selected text
     * @param {string} text - Text to summarize
     * @param {Object} options - Summarization options
     * @param {string} options.style - Summary style: 'concise', 'detailed', 'executive'
     * @param {string} options.language - Target language
     * @param {Object} options.context - Optional context (full transcription, etc.)
     * @returns {Promise<Object>} Summary result
     */
    async summarizeSelection(text, options = {}) {
        const {
            style = 'concise',
            language = 'en',
            context = null
        } = options;

        console.log(`[TranscriptionProcessingService] Summarizing text (${style}, ${language})`);

        const llm = this._getLLM();

        // Build prompt based on style
        let systemPrompt = '';
        let userPrompt = '';

        switch (style) {
            case 'concise':
                systemPrompt = language === 'fr'
                    ? 'Tu es un assistant expert en synthèse de texte. Résume de manière concise et claire.'
                    : 'You are an expert at text summarization. Summarize concisely and clearly.';

                userPrompt = language === 'fr'
                    ? `Résume ce texte en 2-3 phrases maximum :\n\n${text}`
                    : `Summarize this text in 2-3 sentences maximum:\n\n${text}`;
                break;

            case 'detailed':
                systemPrompt = language === 'fr'
                    ? 'Tu es un assistant expert en analyse de texte. Fournis un résumé détaillé et structuré.'
                    : 'You are an expert at text analysis. Provide a detailed and structured summary.';

                userPrompt = language === 'fr'
                    ? `Fournis un résumé détaillé de ce texte avec les points principaux :\n\n${text}`
                    : `Provide a detailed summary of this text with main points:\n\n${text}`;
                break;

            case 'executive':
                systemPrompt = language === 'fr'
                    ? 'Tu es un assistant pour dirigeants. Fournis un résumé exécutif orienté business.'
                    : 'You are an executive assistant. Provide a business-oriented executive summary.';

                userPrompt = language === 'fr'
                    ? `Crée un résumé exécutif de ce texte (décisions, impacts, recommandations) :\n\n${text}`
                    : `Create an executive summary of this text (decisions, impacts, recommendations):\n\n${text}`;
                break;
        }

        try {
            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ];

            const response = await llm.chat(messages, {
                temperature: 0.3, // Low for factual summaries
                max_tokens: style === 'concise' ? 200 : 800
            });

            return {
                success: true,
                summary: response.content.trim(),
                style,
                language,
                originalLength: text.length,
                summaryLength: response.content.length
            };

        } catch (error) {
            console.error('[TranscriptionProcessingService] Error summarizing:', error);
            throw new Error(`Failed to summarize: ${error.message}`);
        }
    }

    /**
     * Expand/develop selected text with more details
     * @param {string} text - Text to expand
     * @param {Object} options - Expansion options
     * @param {string} options.targetLength - 'medium', 'long'
     * @param {string} options.language - Target language
     * @param {Object} options.context - Optional context
     * @returns {Promise<Object>} Expanded text
     */
    async expandSelection(text, options = {}) {
        const {
            targetLength = 'medium',
            language = 'en',
            context = null
        } = options;

        console.log(`[TranscriptionProcessingService] Expanding text (${targetLength}, ${language})`);

        const llm = this._getLLM();

        const systemPrompt = language === 'fr'
            ? 'Tu es un assistant expert en rédaction. Développe et enrichis le texte avec plus de détails, exemples et contexte.'
            : 'You are an expert writing assistant. Expand and enrich the text with more details, examples and context.';

        const targetWordCount = targetLength === 'medium' ? '2-3x' : '3-5x';

        const userPrompt = language === 'fr'
            ? `Développe ce texte en ajoutant des détails, exemples et explications (environ ${targetWordCount} la longueur originale) :\n\n${text}\n\nTexte développé :`
            : `Expand this text by adding details, examples and explanations (approximately ${targetWordCount} the original length):\n\n${text}\n\nExpanded text:`;

        try {
            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ];

            const response = await llm.chat(messages, {
                temperature: 0.5, // Moderate for creative expansion
                max_tokens: targetLength === 'medium' ? 800 : 1500
            });

            return {
                success: true,
                expandedText: response.content.trim(),
                targetLength,
                language,
                originalLength: text.length,
                expandedLength: response.content.length,
                expansionRatio: (response.content.length / text.length).toFixed(2)
            };

        } catch (error) {
            console.error('[TranscriptionProcessingService] Error expanding:', error);
            throw new Error(`Failed to expand: ${error.message}`);
        }
    }

    /**
     * Extract key points from selected text
     * @param {string} text - Text to analyze
     * @param {Object} options - Extraction options
     * @param {number} options.maxPoints - Maximum number of points (default: 5)
     * @param {string} options.language - Target language
     * @param {boolean} options.includeContext - Include brief context for each point
     * @returns {Promise<Object>} Key points
     */
    async extractKeyPoints(text, options = {}) {
        const {
            maxPoints = 5,
            language = 'en',
            includeContext = false
        } = options;

        console.log(`[TranscriptionProcessingService] Extracting key points (max: ${maxPoints})`);

        const llm = this._getLLM();

        const systemPrompt = language === 'fr'
            ? 'Tu es un assistant expert en analyse de contenu. Extrais les points clés les plus importants.'
            : 'You are an expert content analyst. Extract the most important key points.';

        const formatInstructions = includeContext
            ? (language === 'fr'
                ? `Pour chaque point, fournis:\n- Le point principal\n- Un bref contexte ou explication`
                : `For each point, provide:\n- The main point\n- A brief context or explanation`)
            : (language === 'fr' ? 'Liste seulement les points clés, un par ligne.' : 'List only the key points, one per line.');

        const userPrompt = language === 'fr'
            ? `Extrais les ${maxPoints} points clés les plus importants de ce texte.\n\n${formatInstructions}\n\nTexte :\n${text}\n\nPoints clés :`
            : `Extract the ${maxPoints} most important key points from this text.\n\n${formatInstructions}\n\nText:\n${text}\n\nKey points:`;

        try {
            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ];

            const response = await llm.chat(messages, {
                temperature: 0.2, // Very low for factual extraction
                max_tokens: 600
            });

            // Parse response into structured points
            const points = this._parseKeyPoints(response.content, includeContext);

            return {
                success: true,
                keyPoints: points,
                count: points.length,
                language,
                includesContext: includeContext
            };

        } catch (error) {
            console.error('[TranscriptionProcessingService] Error extracting key points:', error);
            throw new Error(`Failed to extract key points: ${error.message}`);
        }
    }

    /**
     * Parse LLM response into structured key points
     * @private
     * @param {string} content - LLM response
     * @param {boolean} includeContext - Whether points include context
     * @returns {Array} Structured points
     */
    _parseKeyPoints(content, includeContext) {
        const lines = content.trim().split('\n').filter(line => line.trim());
        const points = [];

        if (includeContext) {
            // Parse structured format with context
            let currentPoint = null;
            for (const line of lines) {
                if (line.match(/^[-•*\d.]/)) {
                    // New point
                    const text = line.replace(/^[-•*\d.]\s*/, '').trim();
                    currentPoint = { point: text, context: '' };
                    points.push(currentPoint);
                } else if (currentPoint && line.trim()) {
                    // Context for current point
                    currentPoint.context += (currentPoint.context ? ' ' : '') + line.trim();
                }
            }
        } else {
            // Simple list format
            for (const line of lines) {
                if (line.match(/^[-•*\d.]/)) {
                    const text = line.replace(/^[-•*\d.]\s*/, '').trim();
                    if (text) {
                        points.push({ point: text });
                    }
                }
            }
        }

        return points;
    }

    /**
     * Rewrite text in a different style
     * @param {string} text - Text to rewrite
     * @param {Object} options - Rewrite options
     * @param {string} options.style - Target style: 'formal', 'casual', 'professional', 'technical', 'simple'
     * @param {string} options.language - Target language
     * @returns {Promise<Object>} Rewritten text
     */
    async rewriteText(text, options = {}) {
        const {
            style = 'formal',
            language = 'en'
        } = options;

        console.log(`[TranscriptionProcessingService] Rewriting text (${style}, ${language})`);

        const llm = this._getLLM();

        let systemPrompt = '';
        let styleInstructions = '';

        switch (style) {
            case 'formal':
                styleInstructions = language === 'fr'
                    ? 'un style formel et professionnel, adapté pour des documents officiels'
                    : 'a formal and professional style, suitable for official documents';
                break;

            case 'casual':
                styleInstructions = language === 'fr'
                    ? 'un style décontracté et conversationnel, facile à lire'
                    : 'a casual and conversational style, easy to read';
                break;

            case 'professional':
                styleInstructions = language === 'fr'
                    ? 'un style professionnel clair et concis, adapté au monde du travail'
                    : 'a clear and concise professional style, suitable for business';
                break;

            case 'technical':
                styleInstructions = language === 'fr'
                    ? 'un style technique et précis, avec terminologie appropriée'
                    : 'a technical and precise style, with appropriate terminology';
                break;

            case 'simple':
                styleInstructions = language === 'fr'
                    ? 'un style simple et accessible, facile à comprendre pour tous'
                    : 'a simple and accessible style, easy for everyone to understand';
                break;
        }

        systemPrompt = language === 'fr'
            ? `Tu es un expert en réécriture de texte. Réécris le texte en utilisant ${styleInstructions}.`
            : `You are an expert at text rewriting. Rewrite the text using ${styleInstructions}.`;

        const userPrompt = language === 'fr'
            ? `Réécris ce texte dans le style demandé, en conservant le sens et les informations importantes :\n\n${text}\n\nTexte réécrit :`
            : `Rewrite this text in the requested style, preserving the meaning and important information:\n\n${text}\n\nRewritten text:`;

        try {
            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ];

            const response = await llm.chat(messages, {
                temperature: 0.4, // Moderate for style variation
                max_tokens: 1000
            });

            return {
                success: true,
                rewrittenText: response.content.trim(),
                style,
                language,
                originalLength: text.length,
                rewrittenLength: response.content.length
            };

        } catch (error) {
            console.error('[TranscriptionProcessingService] Error rewriting:', error);
            throw new Error(`Failed to rewrite: ${error.message}`);
        }
    }

    /**
     * Generate a concise title from text
     * @param {string} text - Text to generate title from
     * @param {Object} options - Options
     * @param {string} options.language - Target language
     * @param {number} options.maxLength - Maximum title length in characters
     * @returns {Promise<Object>} Generated title
     */
    async generateTitle(text, options = {}) {
        const {
            language = 'en',
            maxLength = 60
        } = options;

        console.log(`[TranscriptionProcessingService] Generating title (${language})`);

        const llm = this._getLLM();

        const systemPrompt = language === 'fr'
            ? `Tu es un expert en création de titres. Génère un titre concis et descriptif (${maxLength} caractères max).`
            : `You are an expert at creating titles. Generate a concise and descriptive title (${maxLength} characters max).`;

        const userPrompt = language === 'fr'
            ? `Génère un titre concis pour ce texte :\n\n${text.substring(0, 1000)}\n\nTitre :`
            : `Generate a concise title for this text:\n\n${text.substring(0, 1000)}\n\nTitle:`;

        try {
            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ];

            const response = await llm.chat(messages, {
                temperature: 0.3,
                max_tokens: 50
            });

            let title = response.content.trim();

            // Remove quotes if present
            title = title.replace(/^["']|["']$/g, '');

            // Truncate if too long
            if (title.length > maxLength) {
                title = title.substring(0, maxLength - 3) + '...';
            }

            return {
                success: true,
                title,
                language
            };

        } catch (error) {
            console.error('[TranscriptionProcessingService] Error generating title:', error);
            throw new Error(`Failed to generate title: ${error.message}`);
        }
    }

    /**
     * Analyze sentiment of text
     * @param {string} text - Text to analyze
     * @param {Object} options - Options
     * @param {string} options.language - Text language
     * @returns {Promise<Object>} Sentiment analysis
     */
    async analyzeSentiment(text, options = {}) {
        const { language = 'en' } = options;

        console.log(`[TranscriptionProcessingService] Analyzing sentiment`);

        const llm = this._getLLM();

        const systemPrompt = language === 'fr'
            ? 'Tu es un expert en analyse de sentiment. Analyse le ton et le sentiment du texte.'
            : 'You are an expert at sentiment analysis. Analyze the tone and sentiment of the text.';

        const userPrompt = language === 'fr'
            ? `Analyse le sentiment de ce texte et fournis:\n- Sentiment global (positif/neutre/négatif)\n- Ton (formel/décontracté/professionnel/etc.)\n- Émotions principales détectées\n\nTexte :\n${text}\n\nAnalyse :`
            : `Analyze the sentiment of this text and provide:\n- Overall sentiment (positive/neutral/negative)\n- Tone (formal/casual/professional/etc.)\n- Main emotions detected\n\nText:\n${text}\n\nAnalysis:`;

        try {
            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ];

            const response = await llm.chat(messages, {
                temperature: 0.2,
                max_tokens: 300
            });

            return {
                success: true,
                analysis: response.content.trim(),
                language
            };

        } catch (error) {
            console.error('[TranscriptionProcessingService] Error analyzing sentiment:', error);
            throw new Error(`Failed to analyze sentiment: ${error.message}`);
        }
    }
}

// Singleton instance
const transcriptionProcessingService = new TranscriptionProcessingService();

module.exports = transcriptionProcessingService;
