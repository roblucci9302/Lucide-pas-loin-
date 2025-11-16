/**
 * Response Service - Real-time AI Response Suggestions During Meetings
 *
 * Generates intelligent response suggestions when the user finishes speaking,
 * helping them engage effectively in conversations and meetings.
 */

const { getSystemPrompt } = require('../../common/prompts/promptBuilder.js');
const { createLLM } = require('../../common/ai/factory');
const modelStateService = require('../../common/services/modelStateService');
const tokenTrackingService = require('../../common/services/tokenTrackingService');

class ResponseService {
    constructor() {
        this.conversationHistory = [];
        this.enabled = true;
        this.maxContextTurns = 10; // Use last 10 conversation turns for context
        this.onSuggestionsReady = null;
        this.onSuggestionsError = null;

        console.log('[ResponseService] Service initialized');
    }

    /**
     * Set callbacks for response events
     */
    setCallbacks({ onSuggestionsReady, onSuggestionsError }) {
        this.onSuggestionsReady = onSuggestionsReady;
        this.onSuggestionsError = onSuggestionsError;
    }

    /**
     * Enable or disable real-time suggestions
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        console.log(`[ResponseService] Real-time suggestions ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Add a conversation turn to the history
     */
    addConversationTurn(speaker, text) {
        const turn = {
            speaker: speaker.toLowerCase(),
            text: text.trim(),
            timestamp: Date.now()
        };

        this.conversationHistory.push(turn);
        console.log(`[ResponseService] Added turn: ${speaker} - "${text.substring(0, 50)}..."`);

        // Keep only the most recent turns
        if (this.conversationHistory.length > this.maxContextTurns) {
            this.conversationHistory.shift();
        }
    }

    /**
     * Get conversation history
     */
    getConversationHistory() {
        return this.conversationHistory;
    }

    /**
     * Reset conversation history
     */
    resetConversationHistory() {
        this.conversationHistory = [];
        console.log('[ResponseService] Conversation history reset');
    }

    /**
     * Format conversation history for prompt
     */
    formatConversationContext() {
        if (this.conversationHistory.length === 0) {
            return 'No conversation history yet.';
        }

        return this.conversationHistory
            .map(turn => `${turn.speaker}: ${turn.text}`)
            .join('\n');
    }

    /**
     * Generate response suggestions based on conversation history
     * Triggered when user ("Me") finishes speaking
     */
    async generateSuggestions() {
        if (!this.enabled) {
            console.log('[ResponseService] Suggestions disabled, skipping');
            return null;
        }

        if (this.conversationHistory.length === 0) {
            console.log('[ResponseService] No conversation history, skipping');
            return null;
        }

        console.log(`[ResponseService] Generating suggestions based on ${this.conversationHistory.length} turns`);

        try {
            const modelInfo = await modelStateService.getCurrentModelInfo('llm');
            if (!modelInfo || !modelInfo.apiKey) {
                throw new Error('AI model or API key is not configured.');
            }

            const conversationContext = this.formatConversationContext();

            // Get base prompt - reuse meeting_assistant for consistency
            const basePrompt = getSystemPrompt('meeting_assistant', '', false);

            const messages = [
                {
                    role: 'system',
                    content: `${basePrompt}

You are now in REAL-TIME RESPONSE MODE. Your task is to suggest helpful, contextually appropriate responses that the user could say next in the conversation.`,
                },
                {
                    role: 'user',
                    content: `Based on this conversation, suggest 2-3 brief, natural responses the user could say next.

Recent conversation:
${conversationContext}

Generate EXACTLY 2-3 response suggestions in this format:

**💬 Suggested Responses:**
1. [First suggestion - 1-2 sentences, natural and conversational]
2. [Second suggestion - 1-2 sentences, different angle or tone]
3. [Third suggestion - 1-2 sentences, optional follow-up or question]

Guidelines:
- Keep each suggestion under 25 words
- Make them sound natural and conversational
- Vary the types: question, affirmation, suggestion, or clarification
- Be specific to the conversation context
- Avoid generic responses like "That's interesting" or "Tell me more"
- Consider the user's role and the conversation flow

ONLY respond with the suggestions in the format above. No other commentary.`
                }
            ];

            console.log('[ResponseService] Sending request to AI...');

            const llm = createLLM(modelInfo.provider, {
                apiKey: modelInfo.apiKey,
                model: modelInfo.model,
                temperature: 0.8, // Higher for more creative suggestions
                maxTokens: 300, // Keep it short
                usePortkey: modelInfo.provider === 'openai-glass',
                portkeyVirtualKey: modelInfo.provider === 'openai-glass' ? modelInfo.apiKey : undefined,
            });

            const completion = await llm.chat(messages);
            const responseText = completion.content;

            // Track token usage and cost
            tokenTrackingService.trackUsage({
                provider: modelInfo.provider,
                model: modelInfo.model,
                response: completion,
                sessionId: null, // Response service doesn't have session ID
                feature: 'response'
            });

            console.log('[ResponseService] Suggestions received');

            // Parse the suggestions
            const suggestions = this.parseSuggestions(responseText);

            if (suggestions && suggestions.length > 0) {
                console.log(`[ResponseService] Parsed ${suggestions.length} suggestions`);

                // Notify callback
                if (this.onSuggestionsReady) {
                    this.onSuggestionsReady(suggestions);
                }

                return suggestions;
            } else {
                console.warn('[ResponseService] No valid suggestions parsed');
                return null;
            }
        } catch (error) {
            console.error('[ResponseService] Error generating suggestions:', error.message);

            if (this.onSuggestionsError) {
                this.onSuggestionsError(error);
            }

            return null;
        }
    }

    /**
     * Parse AI response to extract suggestions
     */
    parseSuggestions(responseText) {
        const suggestions = [];

        try {
            const lines = responseText.split('\n');

            for (const line of lines) {
                const trimmedLine = line.trim();

                // Match numbered suggestions like "1. [suggestion]" or "1) [suggestion]"
                const match = trimmedLine.match(/^\d+[\.)]\s*(.+)$/);

                if (match && suggestions.length < 3) {
                    const suggestion = match[1].trim();

                    // Remove markdown formatting if present
                    const cleanSuggestion = suggestion
                        .replace(/^\[/, '')
                        .replace(/\]$/, '')
                        .replace(/\*\*/g, '')
                        .trim();

                    if (cleanSuggestion.length > 0) {
                        suggestions.push(cleanSuggestion);
                    }
                }
            }

            // If no numbered suggestions found, try to extract any bullet points
            if (suggestions.length === 0) {
                for (const line of lines) {
                    const trimmedLine = line.trim();

                    if (trimmedLine.startsWith('-') || trimmedLine.startsWith('•')) {
                        const suggestion = trimmedLine.substring(1).trim();

                        if (suggestion.length > 0 && suggestions.length < 3) {
                            suggestions.push(suggestion);
                        }
                    }
                }
            }

            return suggestions;
        } catch (error) {
            console.error('[ResponseService] Error parsing suggestions:', error);
            return [];
        }
    }

    /**
     * Get current service state
     */
    getState() {
        return {
            enabled: this.enabled,
            conversationTurns: this.conversationHistory.length,
            maxContextTurns: this.maxContextTurns
        };
    }
}

// Singleton instance
const responseService = new ResponseService();

module.exports = responseService;
