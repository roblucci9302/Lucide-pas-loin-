const { loaders } = require('../utils/dependencyLoader');
const uuid = loaders.loadUuid();
const uuidv4 = uuid.v4;
const sqliteClient = require('./sqliteClient');
const { createStreamingLLM } = require('../ai/factory');
const modelStateService = require('./modelStateService');

/**
 * Service d'apprentissage automatique du profil utilisateur
 * Analyse les conversations pour extraire des insights et enrichir le profil
 * Phase 2: Mémoire Long-Terme
 */
class UserLearningService {
    constructor() {
        this.db = null;
        this.processingQueue = new Map(); // Éviter double processing
    }

    /**
     * Initialise le service
     */
    initialize() {
        this.db = sqliteClient.getDb();
        console.log('[UserLearningService] Service initialized');
    }

    /**
     * Analyse une conversation complète pour extraire des insights
     * @param {string} sessionId - ID de la session
     * @param {string} userId - ID de l'utilisateur
     * @returns {Promise<Object>} Les insights extraits
     */
    async analyzeConversationForLearning(sessionId, userId) {
        try {
            if (!this.db) this.initialize();

            // Vérifier si déjà en cours de traitement
            if (this.processingQueue.has(sessionId)) {
                console.log(`[UserLearningService] Session ${sessionId} already being processed, skipping`);
                return null;
            }

            this.processingQueue.set(sessionId, Date.now());

            // Récupérer les messages de la session
            const messages = await this.getSessionMessages(sessionId);
            if (messages.length < 2) {
                console.log('[UserLearningService] Session too short for learning, skipping');
                this.processingQueue.delete(sessionId);
                return null;
            }

            // Construire le texte de la conversation
            const conversationText = messages.map(m =>
                `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
            ).join('\n\n');

            // Extraire les insights avec LLM
            const insights = await this.extractInsights(conversationText, userId);

            if (insights && insights.hasInsights) {
                // Stocker les événements d'apprentissage
                await this.storeLearningEvents(userId, sessionId, insights);

                // Mettre à jour le profil utilisateur
                await this.updateUserProfileIncremental(userId, insights);

                console.log(`[UserLearningService] ✅ Learned from session ${sessionId}: ${JSON.stringify(insights.summary)}`);
            }

            this.processingQueue.delete(sessionId);
            return insights;

        } catch (error) {
            console.error('[UserLearningService] Error analyzing conversation:', error);
            this.processingQueue.delete(sessionId);
            return null;
        }
    }

    /**
     * Extrait des insights structurés d'une conversation avec LLM
     * @param {string} conversationText - Le texte de la conversation
     * @param {string} userId - ID de l'utilisateur
     * @returns {Promise<Object>} Les insights extraits
     */
    async extractInsights(conversationText, userId) {
        try {
            const modelInfo = await modelStateService.getCurrentModelInfo('llm');
            if (!modelInfo || !modelInfo.apiKey) {
                console.warn('[UserLearningService] No LLM configured, skipping extraction');
                return { hasInsights: false };
            }

            // Limiter la longueur du texte analysé (max 4000 tokens ≈ 16000 chars)
            const truncatedText = conversationText.substring(0, 16000);

            const extractionPrompt = `Analyse cette conversation et extrait des informations structurées sur l'utilisateur.

Conversation:
${truncatedText}

Identifie et extrait (uniquement si mentionné explicitement):
1. **Nouveaux challenges/problèmes** mentionnés
2. **Goals/objectifs** évoqués
3. **Projets en cours** discutés
4. **Frameworks/méthodologies** utilisés ou demandés
5. **Domaines d'expertise** révélés (technos, industries, compétences)
6. **Préférences de communication** (ton formel/casual, besoin d'exemples, niveau de détail)
7. **Contexte professionnel** (rôle, industrie, taille entreprise) si mentionné

Réponds UNIQUEMENT avec un JSON dans ce format exact:
{
  "hasInsights": true,
  "challenges": ["challenge 1", "challenge 2"],
  "goals": ["goal 1", "goal 2"],
  "projects": [{"name": "Project X", "description": "brief desc"}],
  "frameworks": ["framework1", "framework2"],
  "expertise": [{"domain": "React", "level": "intermediate"}],
  "preferences": {
    "tone": "casual|formal|balanced",
    "needsExamples": true,
    "detailLevel": "concise|detailed|comprehensive"
  },
  "context": {
    "role": "role if mentioned",
    "industry": "industry if mentioned",
    "companySize": "size if mentioned"
  },
  "summary": "One sentence summary of what was learned"
}

Si rien d'important n'est extrait, retourne: {"hasInsights": false}`;

            const llm = createStreamingLLM(modelInfo.provider, {
                apiKey: modelInfo.apiKey,
                model: modelInfo.model,
                temperature: 0.1, // Très précis
                maxTokens: 500
            });

            // Utiliser une méthode non-streaming pour simplicité
            const response = await this.generateNonStreaming(llm, extractionPrompt);

            // Parser le JSON
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const insights = JSON.parse(jsonMatch[0]);
                return insights;
            }

            return { hasInsights: false };

        } catch (error) {
            console.error('[UserLearningService] Error extracting insights:', error);
            return { hasInsights: false };
        }
    }

    /**
     * Génère une réponse complète (non-streaming) depuis le LLM
     * @param {Object} llm - Instance du LLM
     * @param {string} prompt - Le prompt
     * @returns {Promise<string>} La réponse complète
     */
    async generateNonStreaming(llm, prompt) {
        const response = await llm.streamChat([
            { role: 'system', content: 'Tu es un extracteur d\'informations. Réponds uniquement en JSON valide.' },
            { role: 'user', content: prompt }
        ]);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

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
                        fullText += token;
                    } catch (e) {
                        // Ignore parsing errors
                    }
                }
            }
        }

        return fullText;
    }

    /**
     * Stocke les événements d'apprentissage dans la table user_learning_events
     * Note: Cette table n'existe pas encore dans le schéma, on va l'ajouter
     * Pour l'instant, on log juste
     */
    async storeLearningEvents(userId, sessionId, insights) {
        try {
            // TODO: Créer la table user_learning_events si nécessaire
            // Pour l'instant, on stocke dans auto_indexed_content

            const eventId = uuidv4();
            const createdAt = Math.floor(Date.now() / 1000);

            // Préparer les entités extraites
            const entities = {
                projects: insights.projects || [],
                frameworks: insights.frameworks || [],
                expertise: insights.expertise || []
            };

            const stmt = this.db.prepare(`
                INSERT INTO auto_indexed_content (
                    id, uid, source_type, source_id, source_title,
                    content, content_summary, entities, tags,
                    importance_score, auto_generated, indexed_at, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            stmt.run(
                eventId,
                userId,
                'learning_event',
                sessionId,
                'User Learning Insights',
                JSON.stringify(insights),
                insights.summary || 'Learning event',
                JSON.stringify(entities),
                JSON.stringify(['learning', 'auto-extracted']),
                0.8, // High importance for learning events
                1,
                createdAt,
                createdAt
            );

            console.log(`[UserLearningService] Stored learning event ${eventId}`);
            return eventId;

        } catch (error) {
            console.error('[UserLearningService] Error storing learning events:', error);
            return null;
        }
    }

    /**
     * Met à jour le profil utilisateur de manière incrémentale
     * @param {string} userId - ID de l'utilisateur
     * @param {Object} insights - Les insights extraits
     */
    async updateUserProfileIncremental(userId, insights) {
        try {
            if (!this.db) this.initialize();

            // Récupérer le profil actuel
            const currentProfile = await this.getUserProfile(userId);
            let profileData = currentProfile?.profile_preferences
                ? JSON.parse(currentProfile.profile_preferences)
                : {};

            // Merger les nouveaux insights avec l'existant
            let updated = false;

            // Challenges
            if (insights.challenges && insights.challenges.length > 0) {
                profileData.challenges = profileData.challenges || [];
                for (const challenge of insights.challenges) {
                    if (!profileData.challenges.includes(challenge)) {
                        profileData.challenges.push(challenge);
                        updated = true;
                    }
                }
                // Limiter à 20 challenges max
                if (profileData.challenges.length > 20) {
                    profileData.challenges = profileData.challenges.slice(-20);
                }
            }

            // Goals
            if (insights.goals && insights.goals.length > 0) {
                profileData.goals = profileData.goals || [];
                for (const goal of insights.goals) {
                    if (!profileData.goals.includes(goal)) {
                        profileData.goals.push(goal);
                        updated = true;
                    }
                }
                if (profileData.goals.length > 20) {
                    profileData.goals = profileData.goals.slice(-20);
                }
            }

            // Projects
            if (insights.projects && insights.projects.length > 0) {
                profileData.projects = profileData.projects || [];
                for (const project of insights.projects) {
                    const existing = profileData.projects.find(p => p.name === project.name);
                    if (!existing) {
                        profileData.projects.push({
                            ...project,
                            firstMentioned: Date.now(),
                            lastMentioned: Date.now()
                        });
                        updated = true;
                    } else {
                        existing.lastMentioned = Date.now();
                        if (project.description) {
                            existing.description = project.description;
                        }
                        updated = true;
                    }
                }
            }

            // Frameworks/Methodologies
            if (insights.frameworks && insights.frameworks.length > 0) {
                profileData.frameworks = profileData.frameworks || [];
                for (const framework of insights.frameworks) {
                    if (!profileData.frameworks.includes(framework)) {
                        profileData.frameworks.push(framework);
                        updated = true;
                    }
                }
            }

            // Expertise
            if (insights.expertise && insights.expertise.length > 0) {
                profileData.expertise = profileData.expertise || [];
                for (const exp of insights.expertise) {
                    const existing = profileData.expertise.find(e => e.domain === exp.domain);
                    if (!existing) {
                        profileData.expertise.push(exp);
                        updated = true;
                    } else if (exp.level && exp.level !== existing.level) {
                        existing.level = exp.level;
                        updated = true;
                    }
                }
            }

            // Preferences
            if (insights.preferences) {
                profileData.preferences = profileData.preferences || {};
                if (insights.preferences.tone) {
                    profileData.preferences.preferredTone = insights.preferences.tone;
                    updated = true;
                }
                if (insights.preferences.needsExamples !== undefined) {
                    profileData.preferences.needsExamples = insights.preferences.needsExamples;
                    updated = true;
                }
                if (insights.preferences.detailLevel) {
                    profileData.preferences.detailLevel = insights.preferences.detailLevel;
                    updated = true;
                }
            }

            // Context
            if (insights.context) {
                profileData.context = profileData.context || {};
                if (insights.context.role) {
                    profileData.context.role = insights.context.role;
                    updated = true;
                }
                if (insights.context.industry) {
                    profileData.context.industry = insights.context.industry;
                    updated = true;
                }
                if (insights.context.companySize) {
                    profileData.context.companySize = insights.context.companySize;
                    updated = true;
                }
            }

            // Sauvegarder si mis à jour
            if (updated) {
                await this.saveUserProfile(userId, profileData);
                console.log(`[UserLearningService] ✅ User profile updated for ${userId}`);
            }

            return updated;

        } catch (error) {
            console.error('[UserLearningService] Error updating user profile:', error);
            return false;
        }
    }

    /**
     * Génère un contexte personnalisé enrichi pour les prompts
     * @param {string} userId - ID de l'utilisateur
     * @returns {Promise<string>} Le contexte personnalisé
     */
    async generatePersonalizedContext(userId) {
        try {
            if (!this.db) this.initialize();

            const profile = await this.getUserProfile(userId);
            if (!profile || !profile.profile_preferences) {
                return '';
            }

            const data = JSON.parse(profile.profile_preferences);

            // Construire un contexte riche
            let context = '\n\n## User Context\n';

            // Contexte professionnel
            if (data.context) {
                context += '**Professional Context:**\n';
                if (data.context.role) context += `- Role: ${data.context.role}\n`;
                if (data.context.industry) context += `- Industry: ${data.context.industry}\n`;
                if (data.context.companySize) context += `- Company Size: ${data.context.companySize}\n`;
            }

            // Challenges actuels
            if (data.challenges && data.challenges.length > 0) {
                const recentChallenges = data.challenges.slice(-5);
                context += '\n**Current Challenges:**\n';
                recentChallenges.forEach(c => context += `- ${c}\n`);
            }

            // Goals
            if (data.goals && data.goals.length > 0) {
                const recentGoals = data.goals.slice(-5);
                context += '\n**Goals:**\n';
                recentGoals.forEach(g => context += `- ${g}\n`);
            }

            // Projets actifs
            if (data.projects && data.projects.length > 0) {
                // Filtrer projets mentionnés récemment (< 30 jours)
                const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
                const activeProjects = data.projects.filter(p =>
                    p.lastMentioned && p.lastMentioned > thirtyDaysAgo
                );

                if (activeProjects.length > 0) {
                    context += '\n**Active Projects:**\n';
                    activeProjects.forEach(p => {
                        context += `- ${p.name}`;
                        if (p.description) context += `: ${p.description}`;
                        context += '\n';
                    });
                }
            }

            // Expertise
            if (data.expertise && data.expertise.length > 0) {
                context += '\n**Expertise:**\n';
                data.expertise.slice(0, 10).forEach(e => {
                    context += `- ${e.domain}`;
                    if (e.level) context += ` (${e.level})`;
                    context += '\n';
                });
            }

            // Frameworks préférés
            if (data.frameworks && data.frameworks.length > 0) {
                context += '\n**Familiar Frameworks:** ';
                context += data.frameworks.slice(0, 10).join(', ');
                context += '\n';
            }

            // Préférences de communication
            if (data.preferences) {
                context += '\n**Communication Preferences:**\n';
                if (data.preferences.preferredTone) {
                    context += `- Tone: ${data.preferences.preferredTone}\n`;
                }
                if (data.preferences.needsExamples) {
                    context += `- Provide concrete examples\n`;
                }
                if (data.preferences.detailLevel) {
                    context += `- Detail level: ${data.preferences.detailLevel}\n`;
                }
            }

            return context;

        } catch (error) {
            console.error('[UserLearningService] Error generating personalized context:', error);
            return '';
        }
    }

    /**
     * Récupère le profil utilisateur
     */
    async getUserProfile(userId) {
        try {
            if (!this.db) this.initialize();

            const stmt = this.db.prepare('SELECT * FROM user_profiles WHERE uid = ?');
            return stmt.get(userId);
        } catch (error) {
            console.error('[UserLearningService] Error getting user profile:', error);
            return null;
        }
    }

    /**
     * Sauvegarde ou met à jour le profil utilisateur
     */
    async saveUserProfile(userId, profileData) {
        try {
            if (!this.db) this.initialize();

            const existing = await this.getUserProfile(userId);
            const updatedAt = Math.floor(Date.now() / 1000);
            const profileJson = JSON.stringify(profileData);

            if (existing) {
                // Update
                const stmt = this.db.prepare(`
                    UPDATE user_profiles
                    SET profile_preferences = ?, updated_at = ?
                    WHERE uid = ?
                `);
                stmt.run(profileJson, updatedAt, userId);
            } else {
                // Insert
                const stmt = this.db.prepare(`
                    INSERT INTO user_profiles (uid, profile_preferences, created_at, updated_at)
                    VALUES (?, ?, ?, ?)
                `);
                stmt.run(userId, profileJson, updatedAt, updatedAt);
            }

            return true;
        } catch (error) {
            console.error('[UserLearningService] Error saving user profile:', error);
            return false;
        }
    }

    /**
     * Récupère les messages d'une session
     */
    async getSessionMessages(sessionId) {
        try {
            if (!this.db) this.initialize();

            const stmt = this.db.prepare(`
                SELECT role, content, created_at
                FROM ai_messages
                WHERE session_id = ?
                ORDER BY created_at ASC
            `);

            return stmt.all(sessionId);
        } catch (error) {
            console.error('[UserLearningService] Error getting session messages:', error);
            return [];
        }
    }

    /**
     * Analyse toutes les sessions récentes d'un utilisateur (batch processing)
     * @param {string} userId - ID de l'utilisateur
     * @param {number} daysBack - Nombre de jours à analyser
     */
    async batchAnalyzeRecentSessions(userId, daysBack = 7) {
        try {
            if (!this.db) this.initialize();

            const timestampLimit = Math.floor(Date.now() / 1000) - (daysBack * 24 * 60 * 60);

            // Récupérer les sessions récentes
            const stmt = this.db.prepare(`
                SELECT id, started_at, message_count
                FROM sessions
                WHERE uid = ?
                  AND started_at >= ?
                  AND message_count >= 2
                ORDER BY started_at DESC
                LIMIT 20
            `);

            const sessions = stmt.all(userId, timestampLimit);
            console.log(`[UserLearningService] Batch analyzing ${sessions.length} recent sessions for user ${userId}`);

            let successCount = 0;
            for (const session of sessions) {
                const result = await this.analyzeConversationForLearning(session.id, userId);
                if (result && result.hasInsights) {
                    successCount++;
                }
                // Petit délai entre chaque analyse pour ne pas surcharger
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            console.log(`[UserLearningService] ✅ Batch analysis complete: ${successCount}/${sessions.length} sessions with insights`);
            return { total: sessions.length, withInsights: successCount };

        } catch (error) {
            console.error('[UserLearningService] Error in batch analysis:', error);
            return { total: 0, withInsights: 0 };
        }
    }
}

// Export singleton instance
const userLearningService = new UserLearningService();
module.exports = userLearningService;
