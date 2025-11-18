const sqliteClient = require('./sqliteClient');

/**
 * Service d'adaptation dynamique du style
 * Analyse les interactions utilisateur et adapte automatiquement le style des réponses
 * Phase 3: Performance & Optimisation
 */
class StyleAdaptationService {
    constructor() {
        this.db = null;
    }

    /**
     * Initialise le service
     */
    initialize() {
        this.db = sqliteClient.getDb();
        console.log('[StyleAdaptationService] Service initialized');
    }

    /**
     * Analyse les préférences de style d'un utilisateur
     * @param {string} userId - ID de l'utilisateur
     * @param {number} sampleSize - Nombre de messages récents à analyser
     * @returns {Promise<Object>} Préférences détectées
     */
    async analyzeUserPreferences(userId, sampleSize = 50) {
        try {
            if (!this.db) this.initialize();

            // Récupérer les messages récents de l'utilisateur
            const messages = await this.getRecentUserMessages(userId, sampleSize);

            if (messages.length < 5) {
                console.log('[StyleAdaptationService] Not enough messages to analyze');
                return this.getDefaultPreferences();
            }

            // Analyser les patterns
            const patterns = {
                prefersBullets: this.detectBulletPreference(messages),
                prefersExamples: this.detectExamplePreference(messages),
                prefersCodeBlocks: this.detectCodeBlockPreference(messages),
                averageResponseLength: this.calculateAverageLength(messages),
                technicalLevel: this.inferTechnicalLevel(messages),
                formalityLevel: this.inferFormality(messages),
                questionStyle: this.analyzeQuestionStyle(messages),
                interactionFrequency: this.analyzeInteractionFrequency(messages)
            };

            // Enrichir avec feedback si disponible
            const feedbackPreferences = await this.analyzeFeedbackPatterns(userId);
            if (feedbackPreferences) {
                patterns.feedbackBased = feedbackPreferences;
            }

            console.log(`[StyleAdaptationService] Analyzed preferences for user ${userId}:`, JSON.stringify(patterns, null, 2));

            return patterns;

        } catch (error) {
            console.error('[StyleAdaptationService] Error analyzing preferences:', error);
            return this.getDefaultPreferences();
        }
    }

    /**
     * Détecte si l'utilisateur préfère les listes à puces
     */
    detectBulletPreference(messages) {
        const assistantMessages = messages.filter(m => m.role === 'assistant');
        if (assistantMessages.length === 0) return false;

        // Compter les réponses avec bullets qui ont reçu une interaction positive
        // (l'utilisateur a continué la conversation rapidement après)
        let bulletResponsesWithFollowUp = 0;
        let totalBulletResponses = 0;

        for (let i = 0; i < assistantMessages.length - 1; i++) {
            const msg = assistantMessages[i];
            const hasBullets = /^[\s]*[-*•]\s+/m.test(msg.content);

            if (hasBullets) {
                totalBulletResponses++;

                // Check si l'utilisateur a répondu dans les 2 minutes
                const nextMsg = messages.find(m =>
                    m.role === 'user' &&
                    m.created_at > msg.created_at &&
                    m.created_at - msg.created_at < 120
                );

                if (nextMsg && nextMsg.content.length > 10) {
                    bulletResponsesWithFollowUp++;
                }
            }
        }

        return totalBulletResponses > 3 && (bulletResponsesWithFollowUp / totalBulletResponses) > 0.6;
    }

    /**
     * Détecte si l'utilisateur apprécie les exemples
     */
    detectExamplePreference(messages) {
        const userMessages = messages.filter(m => m.role === 'user');

        // Keywords indiquant une demande d'exemples
        const exampleKeywords = [
            'exemple', 'concret', 'pratique', 'illustre',
            'montre', 'démontre', 'cas d\'usage'
        ];

        let requestsWithExamples = 0;
        for (const msg of userMessages) {
            const contentLower = msg.content.toLowerCase();
            if (exampleKeywords.some(kw => contentLower.includes(kw))) {
                requestsWithExamples++;
            }
        }

        return requestsWithExamples >= 2 || (requestsWithExamples / userMessages.length) > 0.3;
    }

    /**
     * Détecte si l'utilisateur travaille avec du code
     */
    detectCodeBlockPreference(messages) {
        const userMessages = messages.filter(m => m.role === 'user');

        let messagesWithCode = 0;
        for (const msg of userMessages) {
            if (/```[\s\S]*?```/.test(msg.content) || /`[^`]+`/.test(msg.content)) {
                messagesWithCode++;
            }
        }

        return messagesWithCode >= 2 || (messagesWithCode / userMessages.length) > 0.2;
    }

    /**
     * Calcule la longueur moyenne des réponses assistant
     */
    calculateAverageLength(messages) {
        const assistantMessages = messages.filter(m => m.role === 'assistant');
        if (assistantMessages.length === 0) return 0;

        const totalLength = assistantMessages.reduce((sum, m) => sum + m.content.length, 0);
        return Math.round(totalLength / assistantMessages.length);
    }

    /**
     * Infère le niveau technique de l'utilisateur
     */
    inferTechnicalLevel(messages) {
        const userMessages = messages.filter(m => m.role === 'user');

        // Keywords techniques avancés
        const advancedKeywords = [
            'algorithme', 'complexité', 'architecture', 'scalabilité',
            'concurrence', 'async', 'promise', 'closure', 'prototype',
            'kubernetes', 'docker', 'microservices', 'api rest',
            'machine learning', 'neural network', 'gradient descent'
        ];

        // Keywords intermédiaires
        const intermediateKeywords = [
            'fonction', 'variable', 'boucle', 'condition', 'array',
            'objet', 'class', 'méthode', 'api', 'database', 'sql'
        ];

        let advancedCount = 0;
        let intermediateCount = 0;

        for (const msg of userMessages) {
            const contentLower = msg.content.toLowerCase();
            advancedCount += advancedKeywords.filter(kw => contentLower.includes(kw)).length;
            intermediateCount += intermediateKeywords.filter(kw => contentLower.includes(kw)).length;
        }

        if (advancedCount >= 3) return 'expert';
        if (advancedCount >= 1 || intermediateCount >= 3) return 'intermediate';
        if (intermediateCount >= 1) return 'beginner';
        return 'non-technical';
    }

    /**
     * Infère le niveau de formalité préféré
     */
    inferFormality(messages) {
        const userMessages = messages.filter(m => m.role === 'user');

        let formalIndicators = 0;
        let casualIndicators = 0;

        // Formal indicators
        const formalPatterns = [
            /\bpourrais-je\b/i,
            /\bpourriez-vous\b/i,
            /\bje vous prie\b/i,
            /\bveuillez\b/i,
            /\bje souhaiterais\b/i
        ];

        // Casual indicators
        const casualPatterns = [
            /\bmerci\b/i,
            /\bsalut\b/i,
            /\bcool\b/i,
            /\bsuper\b/i,
            /\bgenial\b/i,
            /\bpeux-tu\b/i
        ];

        for (const msg of userMessages) {
            formalIndicators += formalPatterns.filter(p => p.test(msg.content)).length;
            casualIndicators += casualPatterns.filter(p => p.test(msg.content)).length;
        }

        if (formalIndicators > casualIndicators * 1.5) return 'formal';
        if (casualIndicators > formalIndicators * 1.5) return 'casual';
        return 'balanced';
    }

    /**
     * Analyse le style des questions
     */
    analyzeQuestionStyle(messages) {
        const userMessages = messages.filter(m => m.role === 'user');

        let directQuestions = 0; // "Comment faire X?"
        let contextualQuestions = 0; // "Je travaille sur X, comment Y?"
        let openEndedQuestions = 0; // "Que penses-tu de X?"

        for (const msg of userMessages) {
            const content = msg.content;

            if (/^(comment|pourquoi|quand|où|qui|quoi)\b/i.test(content)) {
                directQuestions++;
            }

            if (content.length > 100 && /\bje\b/i.test(content)) {
                contextualQuestions++;
            }

            if (/\bque penses|ton avis|suggestions|idées\b/i.test(content)) {
                openEndedQuestions++;
            }
        }

        const total = userMessages.length;
        return {
            direct: Math.round((directQuestions / total) * 100),
            contextual: Math.round((contextualQuestions / total) * 100),
            openEnded: Math.round((openEndedQuestions / total) * 100),
            dominant: directQuestions > contextualQuestions ? 'direct' : 'contextual'
        };
    }

    /**
     * Analyse la fréquence d'interaction
     */
    analyzeInteractionFrequency(messages) {
        if (messages.length < 2) return { frequency: 'unknown', avgInterval: 0 };

        const timestamps = messages.map(m => m.created_at).sort((a, b) => a - b);
        const intervals = [];

        for (let i = 1; i < timestamps.length; i++) {
            intervals.push(timestamps[i] - timestamps[i - 1]);
        }

        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const avgMinutes = avgInterval / 60;

        let frequency = 'moderate';
        if (avgMinutes < 2) frequency = 'rapid'; // < 2min entre messages
        else if (avgMinutes > 60) frequency = 'slow'; // > 1h entre messages

        return {
            frequency,
            avgInterval: Math.round(avgInterval),
            avgMinutes: Math.round(avgMinutes)
        };
    }

    /**
     * Analyse les patterns de feedback
     */
    async analyzeFeedbackPatterns(userId) {
        try {
            if (!this.db) return null;

            // Check if response_feedback table exists
            const tableExists = this.db.prepare(`
                SELECT name FROM sqlite_master
                WHERE type='table' AND name='response_feedback'
            `).get();

            if (!tableExists) return null;

            const stmt = this.db.prepare(`
                SELECT feedback_type, is_positive, comment
                FROM response_feedback
                WHERE uid = ?
                ORDER BY created_at DESC
                LIMIT 20
            `);

            const feedbacks = stmt.all(userId);
            if (feedbacks.length === 0) return null;

            // Analyser les types de feedback négatifs
            const negativeTypes = feedbacks
                .filter(f => f.is_positive === 0)
                .map(f => f.feedback_type);

            const typeCounts = {};
            for (const type of negativeTypes) {
                typeCounts[type] = (typeCounts[type] || 0) + 1;
            }

            return {
                totalFeedbacks: feedbacks.length,
                positiveRate: feedbacks.filter(f => f.is_positive === 1).length / feedbacks.length,
                negativeTypes: typeCounts,
                mainIssue: Object.keys(typeCounts).sort((a, b) => typeCounts[b] - typeCounts[a])[0]
            };
        } catch (error) {
            return null;
        }
    }

    /**
     * Construit des instructions de style basées sur les préférences
     * @param {Object} preferences - Préférences détectées
     * @param {string} agentProfile - Profil de l'agent
     * @returns {string} Instructions de style
     */
    buildStyleInstructions(preferences, agentProfile) {
        const instructions = [];

        // Structure
        if (preferences.prefersBullets) {
            instructions.push('📋 **Structure**: Privilégie les listes à puces et la présentation structurée pour plus de clarté.');
        }

        if (preferences.prefersExamples) {
            instructions.push('💡 **Exemples**: Inclus systématiquement 1-2 exemples concrets et pratiques.');
        }

        if (preferences.prefersCodeBlocks) {
            instructions.push('💻 **Code**: Fournis des exemples de code formatés avec syntax highlighting quand pertinent.');
        }

        // Longueur
        if (preferences.averageResponseLength < 300) {
            instructions.push('✂️ **Concision**: Sois concis et va droit au but. Limite-toi à 2-3 paragraphes courts.');
        } else if (preferences.averageResponseLength > 800) {
            instructions.push('📚 **Détail**: Fournis des réponses détaillées et exhaustives avec explications approfondies.');
        } else {
            instructions.push('⚖️ **Équilibre**: Maintiens un équilibre entre concision et complétude.');
        }

        // Niveau technique
        const technicalInstructions = {
            'expert': '🎓 **Niveau**: L\'utilisateur est expert. Utilise le jargon technique sans sur-expliquer les concepts de base.',
            'intermediate': '📖 **Niveau**: L\'utilisateur a des connaissances intermédiaires. Explique les concepts avancés mais reste accessible.',
            'beginner': '🌱 **Niveau**: L\'utilisateur débute. Explique clairement les concepts et évite le jargon sans définition.',
            'non-technical': '👤 **Niveau**: L\'utilisateur n\'est pas technique. Utilise des analogies et un langage simple.'
        };
        instructions.push(technicalInstructions[preferences.technicalLevel] || technicalInstructions['intermediate']);

        // Formalité
        const formalityInstructions = {
            'formal': '🎩 **Ton**: Maintiens un ton professionnel et formel.',
            'casual': '😊 **Ton**: Adopte un ton accessible, conversationnel et amical.',
            'balanced': '🤝 **Ton**: Reste professionnel mais accessible.'
        };
        instructions.push(formalityInstructions[preferences.formalityLevel] || formalityInstructions['balanced']);

        // Feedback-based adjustments
        if (preferences.feedbackBased && preferences.feedbackBased.mainIssue) {
            const issueInstructions = {
                'tone': '⚠️ **Attention**: L\'utilisateur a signalé des problèmes de ton. Adapte le niveau de formalité.',
                'format': '⚠️ **Attention**: L\'utilisateur préfère un format différent. Varie la structure des réponses.',
                'accuracy': '⚠️ **Attention**: Sois particulièrement précis et vérifie les informations.',
                'helpful': '⚠️ **Attention**: Focus sur l\'utilité pratique et les actions concrètes.'
            };

            const issue = preferences.feedbackBased.mainIssue;
            if (issueInstructions[issue]) {
                instructions.push(issueInstructions[issue]);
            }
        }

        return '\n\n## 🎯 Style Adaptatif (Préférences Détectées)\n\n' + instructions.join('\n\n');
    }

    /**
     * Préférences par défaut
     */
    getDefaultPreferences() {
        return {
            prefersBullets: false,
            prefersExamples: false,
            prefersCodeBlocks: false,
            averageResponseLength: 500,
            technicalLevel: 'intermediate',
            formalityLevel: 'balanced',
            questionStyle: { dominant: 'direct' },
            interactionFrequency: { frequency: 'moderate' }
        };
    }

    /**
     * Récupère les messages récents d'un utilisateur
     */
    async getRecentUserMessages(userId, limit) {
        try {
            if (!this.db) this.initialize();

            const stmt = this.db.prepare(`
                SELECT m.role, m.content, m.created_at, s.id as session_id
                FROM ai_messages m
                JOIN sessions s ON m.session_id = s.id
                WHERE s.uid = ?
                ORDER BY m.created_at DESC
                LIMIT ?
            `);

            return stmt.all(userId, limit);
        } catch (error) {
            console.error('[StyleAdaptationService] Error getting recent messages:', error);
            return [];
        }
    }

    /**
     * Récupère ou met à jour les préférences cachées
     */
    async getCachedPreferences(userId, maxAge = 24 * 60 * 60 * 1000) {
        try {
            // TODO: Implémenter un système de cache pour éviter de re-analyser trop souvent
            // Pour l'instant, toujours ré-analyser
            return await this.analyzeUserPreferences(userId);
        } catch (error) {
            console.error('[StyleAdaptationService] Error getting cached preferences:', error);
            return this.getDefaultPreferences();
        }
    }
}

// Export singleton instance
const styleAdaptationService = new StyleAdaptationService();
module.exports = styleAdaptationService;
