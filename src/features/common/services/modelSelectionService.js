/**
 * Service de sélection intelligente de modèles
 * Analyse la complexité des questions et route vers le modèle optimal
 * (modèles légers pour questions simples, modèles puissants pour complexité élevée)
 * Phase 3: Performance & Optimisation
 */
class ModelSelectionService {
    constructor() {
        // Définition des modèles disponibles avec leurs caractéristiques
        this.models = {
            // Modèles légers/rapides
            light: {
                'openai': { model: 'gpt-4o-mini', cost: { input: 0.15, output: 0.60 } },
                'anthropic': { model: 'claude-3-haiku', cost: { input: 0.25, output: 1.25 } },
                'gemini': { model: 'gemini-1.5-flash', cost: { input: 0.075, output: 0.30 } }
            },
            // Modèles standards/équilibrés
            standard: {
                'openai': { model: 'gpt-4o', cost: { input: 5, output: 15 } },
                'anthropic': { model: 'claude-3.5-sonnet', cost: { input: 3, output: 15 } },
                'gemini': { model: 'gemini-1.5-pro', cost: { input: 1.25, output: 5 } }
            },
            // Modèles puissants/premium
            powerful: {
                'openai': { model: 'gpt-4', cost: { input: 30, output: 60 } },
                'anthropic': { model: 'claude-3-opus', cost: { input: 15, output: 75 } },
                'gemini': { model: 'gemini-1.5-pro', cost: { input: 1.25, output: 5 } }
            }
        };

        // Seuils de complexité
        this.complexityThresholds = {
            simple: 3,      // Score < 3 = simple
            moderate: 7,    // Score 3-7 = moderate
            complex: 7      // Score > 7 = complex
        };
    }

    /**
     * Analyse la complexité d'une question
     * @param {string} question - La question à analyser
     * @param {Array} conversationHistory - Historique de conversation (optionnel)
     * @returns {Object} Analyse de complexité
     */
    analyzeComplexity(question, conversationHistory = []) {
        let complexityScore = 0;
        const features = {};

        // 1. Longueur de la question
        features.questionLength = question.length;
        if (features.questionLength > 500) complexityScore += 2;
        else if (features.questionLength > 200) complexityScore += 1;

        // 2. Présence de contexte (historique)
        features.hasContext = conversationHistory.length > 0;
        if (features.hasContext) complexityScore += 1;

        // 3. Présence de code
        features.hasCodeBlock = /```[\s\S]*?```/.test(question);
        if (features.hasCodeBlock) complexityScore += 2;

        // 4. Questions multi-parties
        const sentences = question.split(/[.?!]+/).filter(s => s.trim().length > 0);
        features.hasMultipleParts = sentences.length > 3;
        if (features.hasMultipleParts) complexityScore += 1;

        // 5. Détection de mots-clés de raisonnement complexe
        const reasoningKeywords = [
            'pourquoi', 'comment', 'expliquer', 'analyser', 'comparer',
            'évaluer', 'stratégie', 'architecture', 'optimiser', 'déboguer',
            'complexe', 'détaillé', 'approfondi', 'complet'
        ];
        features.requiresReasoning = reasoningKeywords.some(keyword =>
            question.toLowerCase().includes(keyword)
        );
        if (features.requiresReasoning) complexityScore += 3;

        // 6. Détection de demandes créatives
        const creativeKeywords = [
            'créer', 'générer', 'rédiger', 'écrire', 'concevoir',
            'imaginer', 'proposer', 'inventer', 'brainstorm'
        ];
        features.requiresCreativity = creativeKeywords.some(keyword =>
            question.toLowerCase().includes(keyword)
        );
        if (features.requiresCreativity) complexityScore += 2;

        // 7. Détection de mots-clés techniques avancés
        const advancedKeywords = [
            'algorithme', 'performance', 'scalabilité', 'concurrent',
            'asynchrone', 'microservices', 'kubernetes', 'terraform',
            'machine learning', 'deep learning', 'neural network'
        ];
        features.requiresAdvancedKnowledge = advancedKeywords.some(keyword =>
            question.toLowerCase().includes(keyword)
        );
        if (features.requiresAdvancedKnowledge) complexityScore += 3;

        // 8. Longueur attendue de la réponse (inférée)
        const longResponseIndicators = [
            'détaille', 'liste complète', 'tous les', 'étape par étape',
            'guide complet', 'tutoriel', 'documentation'
        ];
        features.expectsLongResponse = longResponseIndicators.some(indicator =>
            question.toLowerCase().includes(indicator)
        );
        if (features.expectsLongResponse) complexityScore += 2;

        // Déterminer le niveau de complexité
        let level = 'simple';
        if (complexityScore >= this.complexityThresholds.complex) {
            level = 'complex';
        } else if (complexityScore >= this.complexityThresholds.simple) {
            level = 'moderate';
        }

        return {
            score: complexityScore,
            level,
            features,
            confidence: this.calculateConfidence(features)
        };
    }

    /**
     * Calcule la confiance de l'analyse
     */
    calculateConfidence(features) {
        let indicators = 0;
        if (features.questionLength) indicators++;
        if (features.hasCodeBlock) indicators++;
        if (features.requiresReasoning) indicators++;
        if (features.requiresCreativity) indicators++;
        if (features.requiresAdvancedKnowledge) indicators++;

        return Math.min(0.9, 0.5 + (indicators * 0.1));
    }

    /**
     * Sélectionne le modèle optimal
     * @param {Object} complexity - Analyse de complexité
     * @param {string} agentProfile - Profil de l'agent actuel
     * @param {Object} userSettings - Préférences utilisateur
     * @param {string} currentProvider - Provider actuellement configuré
     * @returns {Object} Modèle sélectionné avec justification
     */
    selectOptimalModel(complexity, agentProfile, userSettings = {}, currentProvider = 'openai') {
        // Vérifier si l'utilisateur a désactivé l'auto-selection
        if (userSettings.disableAutoModelSelection) {
            return {
                tier: 'user-preference',
                provider: currentProvider,
                model: userSettings.preferredModel || this.models.standard[currentProvider]?.model,
                reason: 'User preference: auto-selection disabled',
                estimatedCost: 'variable'
            };
        }

        // Cas spécial : questions très simples → modèle léger
        if (complexity.level === 'simple' && !complexity.features.requiresReasoning) {
            const lightModel = this.models.light[currentProvider];
            if (lightModel) {
                return {
                    tier: 'light',
                    provider: currentProvider,
                    model: lightModel.model,
                    reason: 'Simple question detected, using fast/cheap model',
                    estimatedCost: `$${lightModel.cost.input}/$${lightModel.cost.output} per 1M tokens`,
                    costMultiplier: '0.05x' // ~20x moins cher que GPT-4
                };
            }
        }

        // Cas modéré : modèle standard (équilibre)
        if (complexity.level === 'moderate') {
            const standardModel = this.models.standard[currentProvider];
            if (standardModel) {
                return {
                    tier: 'standard',
                    provider: currentProvider,
                    model: standardModel.model,
                    reason: 'Moderate complexity, using balanced model',
                    estimatedCost: `$${standardModel.cost.input}/$${standardModel.cost.output} per 1M tokens`,
                    costMultiplier: '1x'
                };
            }
        }

        // Cas complexe : modèle puissant
        // Certains agents nécessitent toujours un modèle puissant
        const alwaysPowerfulAgents = ['ceo_advisor', 'it_expert', 'researcher_assistant'];
        const needsPowerful = complexity.level === 'complex' ||
                             alwaysPowerfulAgents.includes(agentProfile) ||
                             complexity.features.requiresAdvancedKnowledge;

        if (needsPowerful) {
            // Pour Anthropic et Gemini, "standard" est déjà très performant
            // Seulement OpenAI a vraiment besoin de GPT-4 pour les cas complexes
            const tier = currentProvider === 'openai' ? 'powerful' : 'standard';
            const selectedModel = this.models[tier][currentProvider];

            if (selectedModel) {
                return {
                    tier,
                    provider: currentProvider,
                    model: selectedModel.model,
                    reason: needsPowerful
                        ? `Complex task requiring ${tier} model (agent: ${agentProfile})`
                        : 'Complex reasoning required',
                    estimatedCost: `$${selectedModel.cost.input}/$${selectedModel.cost.output} per 1M tokens`,
                    costMultiplier: tier === 'powerful' ? '10x' : '1x'
                };
            }
        }

        // Fallback : modèle standard
        const standardModel = this.models.standard[currentProvider];
        return {
            tier: 'standard',
            provider: currentProvider,
            model: standardModel?.model || 'gpt-4o',
            reason: 'Default standard model',
            estimatedCost: standardModel ? `$${standardModel.cost.input}/$${standardModel.cost.output} per 1M tokens` : 'variable',
            costMultiplier: '1x'
        };
    }

    /**
     * Analyse complète et sélection de modèle
     * @param {string} question - La question
     * @param {Object} options - Options
     * @returns {Object} Résultat complet
     */
    analyzeAndSelect(question, options = {}) {
        const {
            conversationHistory = [],
            agentProfile = 'lucide_assistant',
            userSettings = {},
            currentProvider = 'openai'
        } = options;

        // 1. Analyser la complexité
        const complexity = this.analyzeComplexity(question, conversationHistory);

        // 2. Sélectionner le modèle
        const selection = this.selectOptimalModel(
            complexity,
            agentProfile,
            userSettings,
            currentProvider
        );

        return {
            complexity,
            selection,
            recommendation: {
                useCache: complexity.level === 'simple', // Cache très utile pour questions simples
                skipEmbeddings: complexity.level === 'simple' && !conversationHistory.length,
                temperature: this.recommendTemperature(complexity, agentProfile)
            }
        };
    }

    /**
     * Recommande une température selon complexité
     */
    recommendTemperature(complexity, agentProfile) {
        // Questions simples : température plus basse (plus déterministe)
        if (complexity.level === 'simple') {
            return 0.3;
        }

        // Questions créatives : température plus élevée
        if (complexity.features.requiresCreativity) {
            return 0.8;
        }

        // Questions techniques/raisonnement : température moyenne-basse
        if (complexity.features.requiresReasoning || complexity.features.requiresAdvancedKnowledge) {
            return 0.5;
        }

        // Default pour l'agent
        const agentDefaults = {
            'it_expert': 0.4,
            'ceo_advisor': 0.5,
            'marketing_expert': 0.7,
            'sales_expert': 0.6,
            'hr_specialist': 0.6
        };

        return agentDefaults[agentProfile] || 0.6;
    }

    /**
     * Estime les économies potentielles avec auto-selection
     * @param {Array} recentQuestions - Questions récentes avec leur complexité
     * @returns {Object} Estimation des économies
     */
    estimatePotentialSavings(recentQuestions) {
        if (recentQuestions.length === 0) {
            return { potentialSavings: 0, breakdown: {} };
        }

        let totalCostWithoutOptimization = 0;
        let totalCostWithOptimization = 0;

        const standardCost = 3; // Claude 3.5 Sonnet: $3/1M input tokens
        const lightCost = 0.25; // Claude 3 Haiku: $0.25/1M input tokens

        const breakdown = {
            simple: 0,
            moderate: 0,
            complex: 0
        };

        for (const q of recentQuestions) {
            const avgTokens = 1000; // Estimation moyenne

            // Sans optimisation : toujours standard
            totalCostWithoutOptimization += (avgTokens / 1000000) * standardCost;

            // Avec optimisation
            const complexity = this.analyzeComplexity(q.question, q.history || []);
            breakdown[complexity.level]++;

            if (complexity.level === 'simple') {
                totalCostWithOptimization += (avgTokens / 1000000) * lightCost;
            } else {
                totalCostWithOptimization += (avgTokens / 1000000) * standardCost;
            }
        }

        const savings = totalCostWithoutOptimization - totalCostWithOptimization;
        const savingsPercent = (savings / totalCostWithoutOptimization) * 100;

        return {
            potentialSavings: Math.round(savings * 100) / 100,
            savingsPercent: Math.round(savingsPercent * 10) / 10,
            breakdown,
            totalQuestions: recentQuestions.length,
            recommendation: savingsPercent > 20
                ? 'Significant savings possible with auto-selection'
                : 'Moderate savings expected'
        };
    }

    /**
     * Récupère les modèles disponibles par provider
     */
    getAvailableModels(provider) {
        return {
            light: this.models.light[provider] || null,
            standard: this.models.standard[provider] || null,
            powerful: this.models.powerful[provider] || null
        };
    }
}

// Export singleton instance
const modelSelectionService = new ModelSelectionService();
module.exports = modelSelectionService;
