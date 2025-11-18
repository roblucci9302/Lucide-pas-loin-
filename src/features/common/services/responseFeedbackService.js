const { v4: uuidv4 } = require('uuid');
const sqliteClient = require('./sqliteClient');

/**
 * Service pour gérer le feedback utilisateur sur les réponses de l'IA
 * Permet de capturer les évaluations, commentaires et analyser la qualité perçue
 */
class ResponseFeedbackService {
    constructor() {
        this.db = null;
    }

    /**
     * Initialise le service avec la connexion à la base de données
     */
    initialize() {
        this.db = sqliteClient.getDb();
        console.log('[ResponseFeedbackService] Service initialized');
    }

    /**
     * Enregistre un feedback utilisateur simple (thumbs up/down)
     * @param {Object} feedbackData - Les données du feedback
     * @param {string} feedbackData.userId - ID de l'utilisateur
     * @param {string} feedbackData.sessionId - ID de la session
     * @param {string} feedbackData.messageId - ID du message
     * @param {string} feedbackData.agentProfile - Profil de l'agent utilisé
     * @param {boolean} feedbackData.isPositive - true = 👍, false = 👎
     * @param {string} feedbackData.question - La question posée
     * @param {string} feedbackData.responseText - La réponse complète
     * @param {number} feedbackData.responseTimeMs - Temps de génération
     * @returns {Object} Le feedback créé
     */
    recordSimpleFeedback({
        userId,
        sessionId,
        messageId,
        agentProfile,
        isPositive,
        question = '',
        responseText = '',
        responseTimeMs = 0
    }) {
        try {
            if (!this.db) this.initialize();

            const feedbackId = uuidv4();
            const rating = isPositive ? 1 : -1;
            const responsePreview = responseText.substring(0, 200);
            const responseLength = responseText.length;
            const createdAt = Math.floor(Date.now() / 1000);

            const stmt = this.db.prepare(`
                INSERT INTO response_feedback (
                    id, uid, session_id, message_id, agent_profile,
                    rating, is_positive, question, response_preview,
                    response_length, response_time_ms, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            stmt.run(
                feedbackId,
                userId,
                sessionId,
                messageId,
                agentProfile,
                rating,
                isPositive ? 1 : 0,
                question,
                responsePreview,
                responseLength,
                responseTimeMs,
                createdAt
            );

            console.log(`[ResponseFeedbackService] Simple feedback recorded: ${isPositive ? '👍' : '👎'} for message ${messageId}`);

            return {
                id: feedbackId,
                isPositive,
                createdAt
            };
        } catch (error) {
            console.error('[ResponseFeedbackService] Error recording simple feedback:', error);
            throw error;
        }
    }

    /**
     * Enregistre un feedback détaillé avec commentaire et type
     * @param {Object} feedbackData - Les données du feedback détaillé
     * @param {string} feedbackData.userId - ID de l'utilisateur
     * @param {string} feedbackData.sessionId - ID de la session
     * @param {string} feedbackData.messageId - ID du message
     * @param {string} feedbackData.agentProfile - Profil de l'agent
     * @param {number} feedbackData.rating - Note de 1 à 5
     * @param {string} feedbackData.feedbackType - Type: 'helpful', 'accurate', 'tone', 'format', 'other'
     * @param {string} feedbackData.comment - Commentaire libre (optionnel)
     * @param {string} feedbackData.question - La question posée
     * @param {string} feedbackData.responseText - La réponse complète
     * @param {number} feedbackData.responseTimeMs - Temps de génération
     * @returns {Object} Le feedback créé
     */
    recordDetailedFeedback({
        userId,
        sessionId,
        messageId,
        agentProfile,
        rating,
        feedbackType = 'other',
        comment = '',
        question = '',
        responseText = '',
        responseTimeMs = 0
    }) {
        try {
            if (!this.db) this.initialize();

            const feedbackId = uuidv4();
            const isPositive = rating >= 3 ? 1 : 0;
            const responsePreview = responseText.substring(0, 200);
            const responseLength = responseText.length;
            const createdAt = Math.floor(Date.now() / 1000);

            const stmt = this.db.prepare(`
                INSERT INTO response_feedback (
                    id, uid, session_id, message_id, agent_profile,
                    rating, feedback_type, comment, is_positive,
                    question, response_preview, response_length,
                    response_time_ms, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            stmt.run(
                feedbackId,
                userId,
                sessionId,
                messageId,
                agentProfile,
                rating,
                feedbackType,
                comment,
                isPositive,
                question,
                responsePreview,
                responseLength,
                responseTimeMs,
                createdAt
            );

            console.log(`[ResponseFeedbackService] Detailed feedback recorded: ${rating}/5 stars for message ${messageId}`);

            return {
                id: feedbackId,
                rating,
                feedbackType,
                createdAt
            };
        } catch (error) {
            console.error('[ResponseFeedbackService] Error recording detailed feedback:', error);
            throw error;
        }
    }

    /**
     * Récupère les feedbacks pour un agent spécifique
     * @param {string} agentProfile - ID du profil agent
     * @param {number} limit - Nombre maximum de feedbacks à retourner
     * @returns {Array} Liste des feedbacks
     */
    getFeedbacksByAgent(agentProfile, limit = 100) {
        try {
            if (!this.db) this.initialize();

            const stmt = this.db.prepare(`
                SELECT * FROM response_feedback
                WHERE agent_profile = ?
                ORDER BY created_at DESC
                LIMIT ?
            `);

            const feedbacks = stmt.all(agentProfile, limit);
            return feedbacks;
        } catch (error) {
            console.error('[ResponseFeedbackService] Error getting feedbacks by agent:', error);
            return [];
        }
    }

    /**
     * Récupère les feedbacks pour un utilisateur
     * @param {string} userId - ID de l'utilisateur
     * @param {number} limit - Nombre maximum de feedbacks
     * @returns {Array} Liste des feedbacks
     */
    getFeedbacksByUser(userId, limit = 100) {
        try {
            if (!this.db) this.initialize();

            const stmt = this.db.prepare(`
                SELECT * FROM response_feedback
                WHERE uid = ?
                ORDER BY created_at DESC
                LIMIT ?
            `);

            const feedbacks = stmt.all(userId, limit);
            return feedbacks;
        } catch (error) {
            console.error('[ResponseFeedbackService] Error getting feedbacks by user:', error);
            return [];
        }
    }

    /**
     * Récupère les feedbacks pour une session
     * @param {string} sessionId - ID de la session
     * @returns {Array} Liste des feedbacks
     */
    getFeedbacksBySession(sessionId) {
        try {
            if (!this.db) this.initialize();

            const stmt = this.db.prepare(`
                SELECT * FROM response_feedback
                WHERE session_id = ?
                ORDER BY created_at DESC
            `);

            const feedbacks = stmt.all(sessionId);
            return feedbacks;
        } catch (error) {
            console.error('[ResponseFeedbackService] Error getting feedbacks by session:', error);
            return [];
        }
    }

    /**
     * Calcule les métriques de qualité pour un agent
     * @param {string} agentProfile - ID du profil agent
     * @param {number} daysBack - Nombre de jours à analyser
     * @returns {Object} Statistiques du feedback
     */
    getAgentQualityMetrics(agentProfile, daysBack = 30) {
        try {
            if (!this.db) this.initialize();

            const timestampLimit = Math.floor(Date.now() / 1000) - (daysBack * 24 * 60 * 60);

            // Statistiques globales
            const statsStmt = this.db.prepare(`
                SELECT
                    COUNT(*) as total_feedbacks,
                    SUM(CASE WHEN is_positive = 1 THEN 1 ELSE 0 END) as positive_count,
                    SUM(CASE WHEN is_positive = 0 THEN 1 ELSE 0 END) as negative_count,
                    AVG(CASE WHEN rating IS NOT NULL THEN rating END) as avg_rating,
                    AVG(response_time_ms) as avg_response_time,
                    AVG(response_length) as avg_response_length
                FROM response_feedback
                WHERE agent_profile = ? AND created_at >= ?
            `);

            const stats = statsStmt.get(agentProfile, timestampLimit);

            // Distribution par type de feedback
            const typeStmt = this.db.prepare(`
                SELECT
                    feedback_type,
                    COUNT(*) as count,
                    AVG(rating) as avg_rating
                FROM response_feedback
                WHERE agent_profile = ?
                  AND created_at >= ?
                  AND feedback_type IS NOT NULL
                GROUP BY feedback_type
            `);

            const typeDistribution = typeStmt.all(agentProfile, timestampLimit);

            // Calcul du taux de satisfaction
            const satisfactionRate = stats.total_feedbacks > 0
                ? (stats.positive_count / stats.total_feedbacks) * 100
                : 0;

            return {
                agentProfile,
                period: `${daysBack} days`,
                totalFeedbacks: stats.total_feedbacks || 0,
                positiveCount: stats.positive_count || 0,
                negativeCount: stats.negative_count || 0,
                satisfactionRate: Math.round(satisfactionRate * 10) / 10,
                averageRating: stats.avg_rating ? Math.round(stats.avg_rating * 100) / 100 : null,
                averageResponseTime: Math.round(stats.avg_response_time || 0),
                averageResponseLength: Math.round(stats.avg_response_length || 0),
                feedbackTypeDistribution: typeDistribution
            };
        } catch (error) {
            console.error('[ResponseFeedbackService] Error getting agent quality metrics:', error);
            return null;
        }
    }

    /**
     * Récupère les feedbacks négatifs avec commentaires pour analyse
     * @param {string} agentProfile - ID du profil agent (optionnel)
     * @param {number} limit - Nombre maximum de feedbacks
     * @returns {Array} Liste des feedbacks négatifs
     */
    getNegativeFeedbacksWithComments(agentProfile = null, limit = 50) {
        try {
            if (!this.db) this.initialize();

            let query = `
                SELECT * FROM response_feedback
                WHERE is_positive = 0
                  AND (comment IS NOT NULL AND comment != '')
            `;

            const params = [];
            if (agentProfile) {
                query += ' AND agent_profile = ?';
                params.push(agentProfile);
            }

            query += ' ORDER BY created_at DESC LIMIT ?';
            params.push(limit);

            const stmt = this.db.prepare(query);
            const feedbacks = stmt.all(...params);

            return feedbacks;
        } catch (error) {
            console.error('[ResponseFeedbackService] Error getting negative feedbacks:', error);
            return [];
        }
    }

    /**
     * Récupère un résumé global de tous les agents
     * @param {number} daysBack - Nombre de jours à analyser
     * @returns {Array} Statistiques par agent
     */
    getAllAgentsMetrics(daysBack = 30) {
        try {
            if (!this.db) this.initialize();

            const timestampLimit = Math.floor(Date.now() / 1000) - (daysBack * 24 * 60 * 60);

            const stmt = this.db.prepare(`
                SELECT
                    agent_profile,
                    COUNT(*) as total_feedbacks,
                    SUM(CASE WHEN is_positive = 1 THEN 1 ELSE 0 END) as positive_count,
                    SUM(CASE WHEN is_positive = 0 THEN 1 ELSE 0 END) as negative_count,
                    AVG(CASE WHEN rating IS NOT NULL THEN rating END) as avg_rating,
                    AVG(response_time_ms) as avg_response_time
                FROM response_feedback
                WHERE created_at >= ?
                GROUP BY agent_profile
                ORDER BY total_feedbacks DESC
            `);

            const results = stmt.all(timestampLimit);

            return results.map(row => ({
                agentProfile: row.agent_profile,
                totalFeedbacks: row.total_feedbacks,
                positiveCount: row.positive_count || 0,
                negativeCount: row.negative_count || 0,
                satisfactionRate: row.total_feedbacks > 0
                    ? Math.round((row.positive_count / row.total_feedbacks) * 1000) / 10
                    : 0,
                averageRating: row.avg_rating ? Math.round(row.avg_rating * 100) / 100 : null,
                averageResponseTime: Math.round(row.avg_response_time || 0)
            }));
        } catch (error) {
            console.error('[ResponseFeedbackService] Error getting all agents metrics:', error);
            return [];
        }
    }

    /**
     * Vérifie si un message a déjà reçu un feedback
     * @param {string} messageId - ID du message
     * @returns {Object|null} Le feedback existant ou null
     */
    getFeedbackForMessage(messageId) {
        try {
            if (!this.db) this.initialize();

            const stmt = this.db.prepare(`
                SELECT * FROM response_feedback
                WHERE message_id = ?
                LIMIT 1
            `);

            const feedback = stmt.get(messageId);
            return feedback || null;
        } catch (error) {
            console.error('[ResponseFeedbackService] Error getting feedback for message:', error);
            return null;
        }
    }

    /**
     * Met à jour un feedback existant
     * @param {string} feedbackId - ID du feedback
     * @param {Object} updates - Champs à mettre à jour
     * @returns {boolean} Succès de la mise à jour
     */
    updateFeedback(feedbackId, updates) {
        try {
            if (!this.db) this.initialize();

            const allowedFields = ['rating', 'feedback_type', 'comment', 'is_positive'];
            const updateFields = [];
            const values = [];

            for (const [key, value] of Object.entries(updates)) {
                if (allowedFields.includes(key)) {
                    updateFields.push(`${key} = ?`);
                    values.push(value);
                }
            }

            if (updateFields.length === 0) {
                console.warn('[ResponseFeedbackService] No valid fields to update');
                return false;
            }

            values.push(feedbackId);
            const query = `UPDATE response_feedback SET ${updateFields.join(', ')} WHERE id = ?`;
            const stmt = this.db.prepare(query);
            const result = stmt.run(...values);

            console.log(`[ResponseFeedbackService] Feedback ${feedbackId} updated`);
            return result.changes > 0;
        } catch (error) {
            console.error('[ResponseFeedbackService] Error updating feedback:', error);
            return false;
        }
    }

    /**
     * Supprime un feedback
     * @param {string} feedbackId - ID du feedback
     * @returns {boolean} Succès de la suppression
     */
    deleteFeedback(feedbackId) {
        try {
            if (!this.db) this.initialize();

            const stmt = this.db.prepare('DELETE FROM response_feedback WHERE id = ?');
            const result = stmt.run(feedbackId);

            console.log(`[ResponseFeedbackService] Feedback ${feedbackId} deleted`);
            return result.changes > 0;
        } catch (error) {
            console.error('[ResponseFeedbackService] Error deleting feedback:', error);
            return false;
        }
    }
}

// Export singleton instance
const responseFeedbackService = new ResponseFeedbackService();
module.exports = responseFeedbackService;
