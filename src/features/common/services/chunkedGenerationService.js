/**
 * Chunked Generation Service
 *
 * Service pour générer des documents de longueur illimitée en utilisant
 * une approche par chunks (morceaux) avec outline et génération progressive.
 *
 * Phase 2 - AI Improvements Roadmap
 */

const { createStreamingLLM } = require('../ai/factory');

class ChunkedGenerationService {
    constructor() {
        this.currentGeneration = null;
    }

    /**
     * Détecte si une requête nécessite une génération par chunks
     * @param {string} userPrompt - La question de l'utilisateur
     * @param {string} targetLength - Le niveau de longueur demandé
     * @returns {boolean}
     */
    shouldUseChunking(userPrompt, targetLength) {
        // Critère 1: targetLength explicite
        if (targetLength === 'comprehensive') {
            return true;
        }

        // Critère 2: Mots-clés indiquant un document long
        const longDocumentKeywords = [
            'rapport complet',
            'guide détaillé',
            'guide complet',
            'documentation complète',
            'documentation détaillée',
            'analyse exhaustive',
            'analyse complète',
            'tutoriel complet',
            'manuel',
            'livre blanc',
            'whitepaper',
            'étude approfondie',
            'cours complet',
            'formation complète',
            'plusieurs pages',
            'document détaillé'
        ];

        const promptLower = userPrompt.toLowerCase();
        return longDocumentKeywords.some(keyword => promptLower.includes(keyword));
    }

    /**
     * Génère un outline structuré pour le document
     * @param {string} userPrompt - La demande de l'utilisateur
     * @param {Object} modelInfo - Informations sur le modèle à utiliser
     * @param {string} systemPrompt - Le prompt système de base
     * @returns {Promise<Object>} L'outline généré
     */
    async generateOutline(userPrompt, modelInfo, systemPrompt) {
        console.log('[ChunkedGeneration] 📋 Generating document outline...');

        const outlinePrompt = `${systemPrompt}

TASK: Generate a detailed outline for the following request.

USER REQUEST: ${userPrompt}

INSTRUCTIONS:
1. Analyze the request and create a comprehensive document structure
2. Break down the content into logical sections (aim for 3-7 main sections)
3. Each section should be substantial enough to provide value
4. Include an introduction and conclusion
5. Format your response as a JSON object with this structure:
{
  "title": "Document title",
  "sections": [
    {
      "id": 1,
      "title": "Section title",
      "description": "Brief description of what this section will cover",
      "estimatedTokens": 1500
    }
  ]
}

OUTPUT FORMAT: Respond ONLY with the JSON object, no additional text.`;

        const streamingLLM = createStreamingLLM(modelInfo.provider, {
            apiKey: modelInfo.apiKey,
            model: modelInfo.model,
            temperature: 0.5, // Lower temperature for structured output
            maxTokens: 2048,
            usePortkey: modelInfo.provider === 'openai-glass',
            portkeyVirtualKey: modelInfo.provider === 'openai-glass' ? modelInfo.apiKey : undefined,
        });

        const messages = [
            { role: 'system', content: outlinePrompt },
            { role: 'user', content: userPrompt }
        ];

        const response = await streamingLLM.streamChat(messages);
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        try {
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
                                fullResponse += token;
                            }
                        } catch (e) {
                            // Ignore parsing errors for individual chunks
                        }
                    }
                }
            }

            // Extract JSON from response (in case there's extra text)
            const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Failed to extract JSON outline from response');
            }

            const outline = JSON.parse(jsonMatch[0]);
            console.log(`[ChunkedGeneration] ✅ Outline generated: ${outline.sections.length} sections`);

            return outline;

        } catch (error) {
            console.error('[ChunkedGeneration] Error generating outline:', error);
            throw error;
        }
    }

    /**
     * Génère une section spécifique du document
     * @param {Object} section - La section à générer
     * @param {string} userPrompt - La demande originale
     * @param {Object} modelInfo - Informations sur le modèle
     * @param {string} systemPrompt - Le prompt système
     * @param {string} previousContent - Le contenu des sections précédentes
     * @param {number} sectionIndex - Index de la section (0-based)
     * @param {number} totalSections - Nombre total de sections
     * @returns {Promise<string>} Le contenu de la section
     */
    async generateSection(section, userPrompt, modelInfo, systemPrompt, previousContent, sectionIndex, totalSections) {
        console.log(`[ChunkedGeneration] 📝 Generating section ${sectionIndex + 1}/${totalSections}: ${section.title}`);

        const contextSummary = previousContent
            ? `\n\nPREVIOUS CONTENT SUMMARY:\n${this._summarizeContent(previousContent)}`
            : '';

        const sectionPrompt = `${systemPrompt}

DOCUMENT CONTEXT:
- Original request: ${userPrompt}
- Current section: ${sectionIndex + 1}/${totalSections}
- Section title: ${section.title}
- Section goal: ${section.description}${contextSummary}

TASK: Write the complete content for this section.

INSTRUCTIONS:
1. Write comprehensive, detailed content for this section
2. Maintain coherence with previous sections if any
3. Use clear structure with subsections if needed
4. Include examples, explanations, and details
5. Aim for approximately ${section.estimatedTokens} tokens (~${Math.round(section.estimatedTokens * 0.75)} words)
6. Use markdown formatting for better readability
7. Do NOT repeat content from previous sections
8. Ensure smooth transition from previous content

OUTPUT: Write ONLY the section content, no meta-commentary.`;

        const streamingLLM = createStreamingLLM(modelInfo.provider, {
            apiKey: modelInfo.apiKey,
            model: modelInfo.model,
            temperature: 0.7,
            maxTokens: section.estimatedTokens || 2048,
            usePortkey: modelInfo.provider === 'openai-glass',
            portkeyVirtualKey: modelInfo.provider === 'openai-glass' ? modelInfo.apiKey : undefined,
        });

        const messages = [
            { role: 'system', content: sectionPrompt },
            { role: 'user', content: `Generate the content for: ${section.title}` }
        ];

        return this._streamGeneration(streamingLLM, messages);
    }

    /**
     * Génère la conclusion du document
     * @param {string} userPrompt - La demande originale
     * @param {Object} outline - L'outline du document
     * @param {string} fullContent - Le contenu complet généré
     * @param {Object} modelInfo - Informations sur le modèle
     * @param {string} systemPrompt - Le prompt système
     * @returns {Promise<string>} La conclusion
     */
    async generateConclusion(userPrompt, outline, fullContent, modelInfo, systemPrompt) {
        console.log('[ChunkedGeneration] 🎯 Generating conclusion...');

        const conclusionPrompt = `${systemPrompt}

DOCUMENT CONTEXT:
- Original request: ${userPrompt}
- Document title: ${outline.title}
- Sections covered: ${outline.sections.map(s => s.title).join(', ')}

TASK: Write a comprehensive conclusion for this document.

INSTRUCTIONS:
1. Synthesize the key points covered across all sections
2. Provide actionable takeaways
3. Suggest next steps if applicable
4. Keep it concise but impactful (aim for 300-500 words)
5. Use markdown formatting

CONTENT SUMMARY:
${this._summarizeContent(fullContent, 1000)}

OUTPUT: Write ONLY the conclusion content, no meta-commentary.`;

        const streamingLLM = createStreamingLLM(modelInfo.provider, {
            apiKey: modelInfo.apiKey,
            model: modelInfo.model,
            temperature: 0.7,
            maxTokens: 1024,
            usePortkey: modelInfo.provider === 'openai-glass',
            portkeyVirtualKey: modelInfo.provider === 'openai-glass' ? modelInfo.apiKey : undefined,
        });

        const messages = [
            { role: 'system', content: conclusionPrompt },
            { role: 'user', content: 'Generate the conclusion' }
        ];

        return this._streamGeneration(streamingLLM, messages);
    }

    /**
     * Helper: Stream la génération et retourne le texte complet
     * @private
     */
    async _streamGeneration(streamingLLM, messages) {
        const response = await streamingLLM.streamChat(messages);
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        try {
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
                                fullResponse += token;
                            }
                        } catch (e) {
                            // Ignore parsing errors
                        }
                    }
                }
            }

            return fullResponse;

        } catch (error) {
            console.error('[ChunkedGeneration] Error in stream generation:', error);
            throw error;
        }
    }

    /**
     * Helper: Résume le contenu pour le contexte
     * @private
     */
    _summarizeContent(content, maxLength = 500) {
        if (!content) return '';

        // Extract first paragraph and key headers
        const lines = content.split('\n').filter(line => line.trim());
        const summary = [];
        let length = 0;

        for (const line of lines) {
            if (line.startsWith('#') || line.trim().length > 50) {
                summary.push(line);
                length += line.length;
                if (length > maxLength) break;
            }
        }

        return summary.slice(0, 10).join('\n') + '\n[... content continues ...]';
    }

    /**
     * Point d'entrée principal : Génère un document complet par chunks
     * @param {string} userPrompt - La demande de l'utilisateur
     * @param {Object} modelInfo - Informations sur le modèle
     * @param {string} systemPrompt - Le prompt système
     * @param {Function} onProgress - Callback pour les mises à jour de progression
     * @returns {Promise<Object>} Le document généré
     */
    async generateDocument(userPrompt, modelInfo, systemPrompt, onProgress = null) {
        console.log('[ChunkedGeneration] 🚀 Starting chunked document generation');

        try {
            // Étape 1: Générer l'outline
            if (onProgress) onProgress({ stage: 'outline', progress: 0 });
            const outline = await this.generateOutline(userPrompt, modelInfo, systemPrompt);

            // Étape 2: Générer l'introduction
            if (onProgress) onProgress({ stage: 'introduction', progress: 10, outline });
            const introduction = `# ${outline.title}\n\n`;

            let fullContent = introduction;
            let previousContent = introduction;

            // Étape 3: Générer chaque section
            const totalSections = outline.sections.length;
            for (let i = 0; i < totalSections; i++) {
                const section = outline.sections[i];
                const progress = 10 + (i / totalSections) * 70;

                if (onProgress) {
                    onProgress({
                        stage: 'section',
                        progress: Math.round(progress),
                        currentSection: i + 1,
                        totalSections,
                        sectionTitle: section.title
                    });
                }

                const sectionContent = await this.generateSection(
                    section,
                    userPrompt,
                    modelInfo,
                    systemPrompt,
                    previousContent,
                    i,
                    totalSections
                );

                const formattedSection = `\n\n## ${section.title}\n\n${sectionContent}`;
                fullContent += formattedSection;
                previousContent = this._summarizeContent(fullContent, 2000);
            }

            // Étape 4: Générer la conclusion
            if (onProgress) onProgress({ stage: 'conclusion', progress: 90 });
            const conclusion = await this.generateConclusion(
                userPrompt,
                outline,
                fullContent,
                modelInfo,
                systemPrompt
            );

            fullContent += `\n\n## Conclusion\n\n${conclusion}`;

            if (onProgress) onProgress({ stage: 'complete', progress: 100 });

            console.log(`[ChunkedGeneration] ✅ Document generation complete: ${fullContent.length} characters`);

            return {
                success: true,
                content: fullContent,
                outline: outline,
                stats: {
                    totalSections: totalSections,
                    totalLength: fullContent.length,
                    estimatedWords: Math.round(fullContent.length / 5),
                    estimatedPages: Math.round(fullContent.length / 3000)
                }
            };

        } catch (error) {
            console.error('[ChunkedGeneration] Error generating document:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Singleton pattern
let instance = null;

module.exports = {
    getInstance() {
        if (!instance) {
            instance = new ChunkedGenerationService();
        }
        return instance;
    }
};
