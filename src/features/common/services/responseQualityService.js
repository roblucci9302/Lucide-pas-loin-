const { v4: uuidv4 } = require('uuid');
const sqliteClient = require('./sqliteClient');
const profileTemplates = require('../prompts/profileTemplates');

/**
 * Service pour évaluer automatiquement la qualité des réponses IA
 * Utilise plusieurs métriques pour mesurer la qualité sans feedback utilisateur
 */
class ResponseQualityService {
    constructor() {
        this.db = null;
    }

    /**
     * Initialise le service
     */
    initialize() {
        this.db = sqliteClient.getDb();
        console.log('[ResponseQualityService] Service initialized');
    }

    /**
     * Évalue la longueur de la réponse (est-elle appropriée?)
     * @param {string} response - La réponse à évaluer
     * @param {string} agentProfile - Le profil de l'agent
     * @returns {number} Score entre 0 et 1
     */
    evaluateLength(response, agentProfile) {
        const length = response.length;

        // Longueurs optimales par type d'agent (caractères)
        const optimalRanges = {
            'lucide_assistant': { min: 200, optimal: 500, max: 1000 },
            'hr_specialist': { min: 300, optimal: 600, max: 1200 },
            'it_expert': { min: 400, optimal: 800, max: 1500 },
            'marketing_expert': { min: 300, optimal: 700, max: 1400 },
            'ceo_advisor': { min: 400, optimal: 800, max: 1500 },
            'sales_expert': { min: 250, optimal: 500, max: 1000 },
            'manager_coach': { min: 300, optimal: 600, max: 1200 },
            'student_assistant': { min: 250, optimal: 500, max: 1000 },
            'researcher_assistant': { min: 400, optimal: 800, max: 1500 }
        };

        const range = optimalRanges[agentProfile] || optimalRanges['lucide_assistant'];

        // Score based on proximity to optimal length
        if (length < range.min) {
            return Math.max(0.3, length / range.min);
        } else if (length <= range.optimal) {
            return 0.9 + (0.1 * (length - range.min) / (range.optimal - range.min));
        } else if (length <= range.max) {
            return 1.0 - (0.2 * (length - range.optimal) / (range.max - range.optimal));
        } else {
            return Math.max(0.5, 0.8 - (0.3 * (length - range.max) / range.max));
        }
    }

    /**
     * Évalue la structure de la réponse (headers, bullets, organisation)
     * @param {string} response - La réponse à évaluer
     * @returns {number} Score entre 0 et 1
     */
    evaluateStructure(response) {
        let score = 0.5; // Base score

        // Vérifier présence de headers markdown
        const hasHeaders = /^#{1,3}\s+.+$/m.test(response);
        if (hasHeaders) score += 0.15;

        // Vérifier présence de listes à puces
        const hasBullets = /^[\s]*[-*•]\s+.+$/m.test(response);
        if (hasBullets) score += 0.15;

        // Vérifier présence de listes numérotées
        const hasNumberedLists = /^[\s]*\d+\.\s+.+$/m.test(response);
        if (hasNumberedLists) score += 0.1;

        // Vérifier présence de code blocks
        const hasCodeBlocks = /```[\s\S]*?```/.test(response);
        if (hasCodeBlocks) score += 0.05;

        // Vérifier présence de sections bien séparées (paragraphes)
        const paragraphs = response.split(/\n\s*\n/).filter(p => p.trim().length > 0);
        if (paragraphs.length >= 2) score += 0.05;

        return Math.min(1.0, score);
    }

    /**
     * Évalue l'utilisation du vocabulaire métier spécifique
     * @param {string} response - La réponse à évaluer
     * @param {string} agentProfile - Le profil de l'agent
     * @returns {number} Score entre 0 et 1
     */
    evaluateVocabulary(response, agentProfile) {
        try {
            // Récupérer le vocabulaire du profil
            const profile = profileTemplates[agentProfile];
            if (!profile || !profile.vocabulary) {
                return 0.5; // Score neutre si pas de vocabulaire défini
            }

            const vocabulary = profile.vocabulary;
            const responseLower = response.toLowerCase();

            // Compter combien de termes métier sont utilisés
            let matchCount = 0;
            for (const term of vocabulary) {
                const termLower = term.toLowerCase();
                // Utiliser une regex pour détecter le terme complet (avec word boundaries)
                const regex = new RegExp(`\\b${termLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
                if (regex.test(responseLower)) {
                    matchCount++;
                }
            }

            // Score basé sur le pourcentage de termes utilisés
            const usageRate = matchCount / Math.min(vocabulary.length, 20); // Cap à 20 termes

            // Normaliser entre 0.3 et 1.0
            return Math.min(1.0, 0.3 + (usageRate * 0.7));
        } catch (error) {
            console.error('[ResponseQualityService] Error evaluating vocabulary:', error);
            return 0.5;
        }
    }

    /**
     * Détecte l'utilisation de frameworks méthodologiques
     * @param {string} response - La réponse à évaluer
     * @param {string} agentProfile - Le profil de l'agent
     * @returns {number} Score entre 0 et 1
     */
    detectFrameworks(response, agentProfile) {
        // Frameworks par agent
        const frameworksByAgent = {
            'hr_specialist': ['STAR', 'SBI', '9-box', '30-60-90', 'OKR', 'competency matrix'],
            'it_expert': ['SOLID', 'DRY', 'KISS', 'design pattern', 'MVC', 'REST', 'OWASP'],
            'marketing_expert': ['AIDA', 'funnel', 'SEO', 'CAC', 'LTV', 'conversion', 'A/B test'],
            'ceo_advisor': ['OKR', 'KPI', 'burn rate', 'runway', 'unit economics', 'PMF', 'TAM'],
            'sales_expert': ['BANT', 'SPIN', 'MEDDIC', 'pipeline', 'qualification', 'objection'],
            'manager_coach': ['1:1', 'feedback loop', 'coaching', 'delegation', 'accountability'],
            'student_assistant': ['Pomodoro', 'active recall', 'spaced repetition', 'mind map'],
            'researcher_assistant': ['hypothesis', 'methodology', 'literature review', 'peer review', 'citation']
        };

        const frameworks = frameworksByAgent[agentProfile] || [];
        if (frameworks.length === 0) return 0.5;

        const responseLower = response.toLowerCase();
        let frameworkCount = 0;

        for (const framework of frameworks) {
            const regex = new RegExp(`\\b${framework.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
            if (regex.test(responseLower)) {
                frameworkCount++;
            }
        }

        // Score: 0.4 base + 0.6 based on framework usage
        const usageRate = frameworkCount / Math.min(frameworks.length, 5);
        return Math.min(1.0, 0.4 + (usageRate * 0.6));
    }

    /**
     * Évalue la cohérence du texte (phrases complètes, ponctuation)
     * @param {string} response - La réponse à évaluer
     * @returns {number} Score entre 0 et 1
     */
    evaluateCoherence(response) {
        let score = 0.6; // Base score

        // Vérifier présence de ponctuation appropriée
        const hasPunctuation = /[.!?]/.test(response);
        if (hasPunctuation) score += 0.1;

        // Vérifier qu'il n'y a pas trop de répétitions
        const words = response.toLowerCase().split(/\s+/);
        const uniqueWords = new Set(words);
        const diversityRatio = uniqueWords.size / words.length;
        if (diversityRatio > 0.4) score += 0.15;

        // Vérifier que les phrases ne sont pas trop longues (> 40 mots = problème)
        const sentences = response.split(/[.!?]+/);
        const avgWordsPerSentence = words.length / sentences.length;
        if (avgWordsPerSentence < 30) score += 0.1;

        // Vérifier capitalization (phrases commencent par majuscule)
        const hasProperCapitalization = /^[A-ZÀ-Ž#*\d]/.test(response.trim());
        if (hasProperCapitalization) score += 0.05;

        return Math.min(1.0, score);
    }

    /**
     * Évalue une réponse complète et enregistre les métriques
     * @param {Object} evaluationData - Les données pour l'évaluation
     * @param {string} evaluationData.userId - ID de l'utilisateur
     * @param {string} evaluationData.sessionId - ID de la session
     * @param {string} evaluationData.messageId - ID du message
     * @param {string} evaluationData.agentProfile - Profil de l'agent
     * @param {string} evaluationData.question - La question posée
     * @param {string} evaluationData.response - La réponse générée
     * @param {number} evaluationData.latencyMs - Temps de génération (ms)
     * @param {number} evaluationData.tokensInput - Tokens d'entrée
     * @param {number} evaluationData.tokensOutput - Tokens de sortie
     * @param {number} evaluationData.sourcesUsed - Nombre de sources RAG utilisées
     * @param {boolean} evaluationData.cacheHit - Si réponse vient du cache
     * @param {string} evaluationData.model - Modèle utilisé
     * @param {string} evaluationData.provider - Provider utilisé
     * @param {number} evaluationData.temperature - Température utilisée
     * @returns {Object} Les métriques calculées
     */
    async evaluateResponse({
        userId,
        sessionId,
        messageId,
        agentProfile,
        question,
        response,
        latencyMs = 0,
        tokensInput = 0,
        tokensOutput = 0,
        sourcesUsed = 0,
        cacheHit = false,
        model = 'unknown',
        provider = 'unknown',
        temperature = 0.7
    }) {
        try {
            if (!this.db) this.initialize();

            // Calculer les scores
            const lengthScore = this.evaluateLength(response, agentProfile);
            const structureScore = this.evaluateStructure(response);
            const vocabularyScore = this.evaluateVocabulary(response, agentProfile);
            const frameworkScore = this.detectFrameworks(response, agentProfile);
            const coherenceScore = this.evaluateCoherence(response);

            // Calculer le score global (moyenne pondérée)
            const overallScore = (
                lengthScore * 0.15 +
                structureScore * 0.20 +
                vocabularyScore * 0.25 +
                frameworkScore * 0.20 +
                coherenceScore * 0.20
            );

            const metricsId = uuidv4();
            const createdAt = Math.floor(Date.now() / 1000);

            // Enregistrer dans la base de données
            const stmt = this.db.prepare(`
                INSERT INTO response_quality_metrics (
                    id, uid, session_id, message_id, agent_profile,
                    overall_score, length_score, structure_score,
                    vocabulary_score, framework_score, coherence_score,
                    latency_ms, tokens_input, tokens_output,
                    sources_used, cache_hit, model_used,
                    provider_used, temperature, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            stmt.run(
                metricsId,
                userId,
                sessionId,
                messageId,
                agentProfile,
                overallScore,
                lengthScore,
                structureScore,
                vocabularyScore,
                frameworkScore,
                coherenceScore,
                latencyMs,
                tokensInput,
                tokensOutput,
                sourcesUsed,
                cacheHit ? 1 : 0,
                model,
                provider,
                temperature,
                createdAt
            );

            console.log(`[ResponseQualityService] Metrics recorded for message ${messageId}: score ${Math.round(overallScore * 100)}%`);

            return {
                id: metricsId,
                overallScore: Math.round(overallScore * 100) / 100,
                lengthScore: Math.round(lengthScore * 100) / 100,
                structureScore: Math.round(structureScore * 100) / 100,
                vocabularyScore: Math.round(vocabularyScore * 100) / 100,
                frameworkScore: Math.round(frameworkScore * 100) / 100,
                coherenceScore: Math.round(coherenceScore * 100) / 100,
                createdAt
            };
        } catch (error) {
            console.error('[ResponseQualityService] Error evaluating response:', error);
            throw error;
        }
    }

    /**
     * Évaluation avec LLM-as-Judge (pour échantillonnage)
     * @param {string} question - La question
     * @param {string} response - La réponse
     * @param {Object} aiProvider - Le provider IA pour l'évaluation
     * @returns {Object} Score et justification
     */
    async llmJudgeEvaluation(question, response, aiProvider) {
        try {
            const judgePrompt = `Tu es un évaluateur expert de réponses d'IA. Évalue la réponse suivante selon 5 critères (note de 0 à 1 pour chaque):

1. **Pertinence**: La réponse répond-elle directement à la question?
2. **Clarté**: La réponse est-elle claire et facile à comprendre?
3. **Complétude**: La réponse couvre-t-elle tous les aspects importants?
4. **Précision**: Les informations sont-elles précises et fiables?
5. **Utilité**: La réponse apporte-t-elle une valeur pratique?

Question: ${question}

Réponse: ${response}

Réponds UNIQUEMENT avec un JSON dans ce format exact:
{
  "pertinence": 0.8,
  "clarte": 0.9,
  "completude": 0.7,
  "precision": 0.85,
  "utilite": 0.9,
  "score_global": 0.85,
  "justification": "Explication courte"
}`;

            const result = await aiProvider.generateText({
                messages: [
                    { role: 'system', content: 'Tu es un évaluateur expert. Réponds uniquement en JSON.' },
                    { role: 'user', content: judgePrompt }
                ],
                temperature: 0.1,
                maxTokens: 300
            });

            // Parser le JSON
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const evaluation = JSON.parse(jsonMatch[0]);
                return {
                    score: evaluation.score_global || 0.5,
                    reasoning: evaluation.justification || 'No reasoning provided',
                    details: evaluation
                };
            }

            return { score: 0.5, reasoning: 'Failed to parse LLM judge response' };
        } catch (error) {
            console.error('[ResponseQualityService] Error in LLM judge evaluation:', error);
            return { score: 0.5, reasoning: 'Error during evaluation' };
        }
    }

    /**
     * Récupère les métriques pour un message
     * @param {string} messageId - ID du message
     * @returns {Object|null} Les métriques ou null
     */
    getMetricsForMessage(messageId) {
        try {
            if (!this.db) this.initialize();

            const stmt = this.db.prepare(`
                SELECT * FROM response_quality_metrics
                WHERE message_id = ?
                LIMIT 1
            `);

            return stmt.get(messageId) || null;
        } catch (error) {
            console.error('[ResponseQualityService] Error getting metrics:', error);
            return null;
        }
    }

    /**
     * Récupère les statistiques de qualité pour un agent
     * @param {string} agentProfile - ID du profil agent
     * @param {number} daysBack - Nombre de jours à analyser
     * @returns {Object} Statistiques de qualité
     */
    getAgentQualityStats(agentProfile, daysBack = 30) {
        try {
            if (!this.db) this.initialize();

            const timestampLimit = Math.floor(Date.now() / 1000) - (daysBack * 24 * 60 * 60);

            const stmt = this.db.prepare(`
                SELECT
                    COUNT(*) as total_responses,
                    AVG(overall_score) as avg_overall_score,
                    AVG(length_score) as avg_length_score,
                    AVG(structure_score) as avg_structure_score,
                    AVG(vocabulary_score) as avg_vocabulary_score,
                    AVG(framework_score) as avg_framework_score,
                    AVG(coherence_score) as avg_coherence_score,
                    AVG(latency_ms) as avg_latency,
                    AVG(tokens_output) as avg_tokens,
                    SUM(cache_hit) as cache_hits
                FROM response_quality_metrics
                WHERE agent_profile = ? AND created_at >= ?
            `);

            const stats = stmt.get(agentProfile, timestampLimit);

            return {
                agentProfile,
                period: `${daysBack} days`,
                totalResponses: stats.total_responses || 0,
                averageOverallScore: Math.round((stats.avg_overall_score || 0) * 100) / 100,
                averageLengthScore: Math.round((stats.avg_length_score || 0) * 100) / 100,
                averageStructureScore: Math.round((stats.avg_structure_score || 0) * 100) / 100,
                averageVocabularyScore: Math.round((stats.avg_vocabulary_score || 0) * 100) / 100,
                averageFrameworkScore: Math.round((stats.avg_framework_score || 0) * 100) / 100,
                averageCoherenceScore: Math.round((stats.avg_coherence_score || 0) * 100) / 100,
                averageLatency: Math.round(stats.avg_latency || 0),
                averageTokens: Math.round(stats.avg_tokens || 0),
                cacheHits: stats.cache_hits || 0,
                cacheHitRate: stats.total_responses > 0
                    ? Math.round((stats.cache_hits / stats.total_responses) * 1000) / 10
                    : 0
            };
        } catch (error) {
            console.error('[ResponseQualityService] Error getting agent quality stats:', error);
            return null;
        }
    }

    /**
     * Compare les scores de qualité avec les feedbacks utilisateurs
     * @param {string} agentProfile - ID du profil agent
     * @param {number} daysBack - Nombre de jours
     * @returns {Object} Analyse de corrélation
     */
    analyzeQualityFeedbackCorrelation(agentProfile, daysBack = 30) {
        try {
            if (!this.db) this.initialize();

            const timestampLimit = Math.floor(Date.now() / 1000) - (daysBack * 24 * 60 * 60);

            const stmt = this.db.prepare(`
                SELECT
                    qm.overall_score,
                    qm.structure_score,
                    qm.vocabulary_score,
                    fb.rating,
                    fb.is_positive
                FROM response_quality_metrics qm
                JOIN response_feedback fb ON qm.message_id = fb.message_id
                WHERE qm.agent_profile = ? AND qm.created_at >= ?
            `);

            const data = stmt.all(agentProfile, timestampLimit);

            if (data.length === 0) {
                return {
                    agentProfile,
                    dataPoints: 0,
                    correlation: null,
                    message: 'Not enough data to analyze correlation'
                };
            }

            // Calculer corrélation simple entre overall_score et is_positive
            const positiveScores = data.filter(d => d.is_positive === 1).map(d => d.overall_score);
            const negativeScores = data.filter(d => d.is_positive === 0).map(d => d.overall_score);

            const avgPositive = positiveScores.reduce((a, b) => a + b, 0) / positiveScores.length || 0;
            const avgNegative = negativeScores.reduce((a, b) => a + b, 0) / negativeScores.length || 0;

            return {
                agentProfile,
                dataPoints: data.length,
                averageScoreForPositiveFeedback: Math.round(avgPositive * 100) / 100,
                averageScoreForNegativeFeedback: Math.round(avgNegative * 100) / 100,
                scoreDifference: Math.round((avgPositive - avgNegative) * 100) / 100,
                correlationStrength: avgPositive > avgNegative ? 'positive' : 'negative'
            };
        } catch (error) {
            console.error('[ResponseQualityService] Error analyzing correlation:', error);
            return null;
        }
    }
}

// Export singleton instance
const responseQualityService = new ResponseQualityService();
module.exports = responseQualityService;
