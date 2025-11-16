/**
 * User Profile Service
 *
 * Business logic for managing user profiles, onboarding, and profile preferences
 * Part of Phase WOW 1: Profiles Intelligents & Agents Spécialisés
 */

const userProfileRepository = require('../repositories/userProfileRepository');
const agentProfileService = require('./agentProfileService');
const EventEmitter = require('events');

class UserProfileService extends EventEmitter {
    constructor() {
        super();
        this.currentUid = null;
        this.currentProfile = null;
    }

    /**
     * Initialize the service for a user
     * @param {string} uid - User ID
     * @returns {Promise<Object>} User profile
     */
    async initialize(uid) {
        try {
            this.currentUid = uid;

            // Get or create user profile
            this.currentProfile = await userProfileRepository.getOrCreateProfile(uid);

            // Initialize agent profile service with active profile
            await agentProfileService.initialize(uid);

            console.log('[UserProfileService] Initialized for user:', uid);
            console.log('[UserProfileService] Active profile:', this.currentProfile.active_profile);
            console.log('[UserProfileService] Onboarding completed:', this.currentProfile.onboarding_completed);

            this.emit('profile-loaded', this.currentProfile);

            return this.currentProfile;
        } catch (error) {
            console.error('[UserProfileService] Error initializing:', error);
            throw error;
        }
    }

    /**
     * Get current user profile
     * @returns {Object|null} Current profile
     */
    getCurrentProfile() {
        return this.currentProfile;
    }

    /**
     * Check if user needs onboarding
     * @returns {boolean} True if onboarding needed
     */
    needsOnboarding() {
        if (!this.currentProfile) return true;
        return this.currentProfile.onboarding_completed !== 1;
    }

    /**
     * Start onboarding process
     * @returns {Object} Onboarding configuration
     */
    startOnboarding() {
        console.log('[UserProfileService] Starting onboarding for user:', this.currentUid);

        const config = {
            uid: this.currentUid,
            steps: [
                {
                    id: 'welcome',
                    title: 'Bienvenue dans Lucide',
                    description: 'Configurons votre assistant IA personnalisé'
                },
                {
                    id: 'profile-selection',
                    title: 'Choisissez votre profil',
                    description: 'Sélectionnez le profil qui correspond à votre rôle',
                    profiles: agentProfileService.getAvailableProfiles()
                },
                {
                    id: 'profile-questions',
                    title: 'Personnalisation',
                    description: 'Quelques questions pour mieux vous connaître'
                },
                {
                    id: 'completion',
                    title: 'Configuration terminée',
                    description: 'Votre assistant est prêt à vous aider'
                }
            ]
        };

        this.emit('onboarding-started', config);
        return config;
    }

    /**
     * Complete onboarding with user selections
     * @param {Object} data - Onboarding data
     * @returns {Promise<Object>} Updated profile
     */
    async completeOnboarding(data) {
        try {
            console.log('[UserProfileService] Completing onboarding:', data);

            const { selectedProfile, preferences } = data;

            // Update profile with onboarding data
            await userProfileRepository.updateProfile(this.currentUid, {
                active_profile: selectedProfile,
                onboarding_completed: 1,
                profile_preferences: preferences || {}
            });

            // Update agent profile service
            await agentProfileService.setActiveProfile(this.currentUid, selectedProfile);

            // Reload current profile
            this.currentProfile = await userProfileRepository.getProfile(this.currentUid);

            console.log('[UserProfileService] Onboarding completed successfully');
            this.emit('onboarding-completed', this.currentProfile);

            return this.currentProfile;
        } catch (error) {
            console.error('[UserProfileService] Error completing onboarding:', error);
            throw error;
        }
    }

    /**
     * Switch to a different profile
     * @param {string} profileId - Target profile ID
     * @param {string} reason - 'manual' or 'auto'
     * @returns {Promise<boolean>} Success status
     */
    async switchProfile(profileId, reason = 'manual') {
        try {
            const currentProfileId = this.currentProfile?.active_profile || 'lucide_assistant';

            // Validate profile exists
            const targetProfile = agentProfileService.getProfileById(profileId);
            if (!targetProfile) {
                console.error('[UserProfileService] Invalid profile ID:', profileId);
                return false;
            }

            // Don't switch if already on this profile
            if (currentProfileId === profileId) {
                console.log('[UserProfileService] Already on profile:', profileId);
                return true;
            }

            console.log(`[UserProfileService] Switching from ${currentProfileId} to ${profileId} (${reason})`);

            // Record the switch
            await userProfileRepository.recordProfileSwitch(
                this.currentUid,
                currentProfileId,
                profileId,
                reason
            );

            // Update active profile
            await userProfileRepository.updateProfile(this.currentUid, {
                active_profile: profileId
            });

            // Update agent profile service
            await agentProfileService.setActiveProfile(this.currentUid, profileId);

            // Reload current profile
            this.currentProfile = await userProfileRepository.getProfile(this.currentUid);

            this.emit('profile-switched', {
                from: currentProfileId,
                to: profileId,
                reason
            });

            return true;
        } catch (error) {
            console.error('[UserProfileService] Error switching profile:', error);
            return false;
        }
    }

    /**
     * Update user preferences
     * @param {Object} preferences - New preferences
     * @returns {Promise<boolean>} Success status
     */
    async updatePreferences(preferences) {
        try {
            const success = await userProfileRepository.updateProfile(this.currentUid, {
                profile_preferences: preferences
            });

            if (success) {
                this.currentProfile = await userProfileRepository.getProfile(this.currentUid);
                this.emit('preferences-updated', preferences);
            }

            return success;
        } catch (error) {
            console.error('[UserProfileService] Error updating preferences:', error);
            return false;
        }
    }

    /**
     * Get profile switch history
     * @param {number} limit - Max number of records
     * @returns {Promise<Array>} Switch history
     */
    async getSwitchHistory(limit = 50) {
        try {
            return await userProfileRepository.getProfileSwitchHistory(this.currentUid, limit);
        } catch (error) {
            console.error('[UserProfileService] Error getting switch history:', error);
            return [];
        }
    }

    /**
     * Get profile usage statistics
     * @returns {Promise<Object>} Usage stats
     */
    async getUsageStats() {
        try {
            const switchStats = await userProfileRepository.getProfileSwitchStats(this.currentUid);

            return {
                current_profile: this.currentProfile?.active_profile,
                onboarding_completed: this.currentProfile?.onboarding_completed === 1,
                profile_switches: switchStats,
                preferences: this.currentProfile?.profile_preferences || {}
            };
        } catch (error) {
            console.error('[UserProfileService] Error getting usage stats:', error);
            return null;
        }
    }

    /**
     * Get onboarding questions based on selected profile
     * @param {string} profileId - Selected profile ID
     * @returns {Array} Questions to ask
     */
    getOnboardingQuestions(profileId) {
        const questionsByProfile = {
            lucide_assistant: [
                {
                    id: 'primary_use',
                    question: 'Comment comptez-vous principalement utiliser Lucide ?',
                    type: 'select',
                    options: ['Travail', 'Études', 'Personnel', 'Autre']
                },
                {
                    id: 'goals',
                    question: 'Quels sont vos objectifs principaux ?',
                    type: 'multiselect',
                    options: ['Productivité', 'Organisation', 'Apprentissage', 'Collaboration']
                }
            ],
            hr_specialist: [
                {
                    id: 'company_size',
                    question: 'Taille de votre entreprise ?',
                    type: 'select',
                    options: ['1-10', '11-50', '51-200', '201-1000', '1000+']
                },
                {
                    id: 'hr_focus',
                    question: 'Vos priorités RH ?',
                    type: 'multiselect',
                    options: ['Recrutement', 'Formation', 'Gestion talents', 'Paie', 'Relations employés']
                },
                {
                    id: 'industry',
                    question: 'Secteur d\'activité ?',
                    type: 'text',
                    placeholder: 'Ex: Tech, Finance, Santé...'
                }
            ],
            it_expert: [
                {
                    id: 'tech_stack',
                    question: 'Technologies principales ?',
                    type: 'multiselect',
                    options: ['JavaScript/Node', 'Python', 'Java', 'C#/.NET', 'Go', 'Rust', 'Autre']
                },
                {
                    id: 'dev_focus',
                    question: 'Domaines de focus ?',
                    type: 'multiselect',
                    options: ['Backend', 'Frontend', 'DevOps', 'Security', 'Data', 'Mobile']
                },
                {
                    id: 'experience_level',
                    question: 'Niveau d\'expérience ?',
                    type: 'select',
                    options: ['Junior (0-2 ans)', 'Intermédiaire (3-5 ans)', 'Senior (6-10 ans)', 'Expert (10+ ans)']
                }
            ],
            marketing_expert: [
                {
                    id: 'marketing_channels',
                    question: 'Canaux marketing utilisés ?',
                    type: 'multiselect',
                    options: ['SEO/SEM', 'Réseaux sociaux', 'Email', 'Content', 'Publicité', 'Influenceurs']
                },
                {
                    id: 'target_audience',
                    question: 'Audience cible ?',
                    type: 'select',
                    options: ['B2B', 'B2C', 'Les deux']
                },
                {
                    id: 'company_size',
                    question: 'Taille de l\'entreprise ?',
                    type: 'select',
                    options: ['Startup', 'PME', 'Grande entreprise', 'Agence']
                }
            ],
            ceo_advisor: [
                {
                    id: 'company_stage',
                    question: 'Stade de l\'entreprise ?',
                    type: 'select',
                    options: ['Pré-seed', 'Seed', 'Série A-B', 'Croissance', 'Mature']
                },
                {
                    id: 'company_size',
                    question: 'Nombre d\'employés ?',
                    type: 'select',
                    options: ['1-10', '11-50', '51-200', '201-500', '500+']
                },
                {
                    id: 'strategic_focus',
                    question: 'Priorités stratégiques ?',
                    type: 'multiselect',
                    options: ['Croissance', 'Rentabilité', 'Levée de fonds', 'Expansion', 'Innovation', 'M&A']
                },
                {
                    id: 'industry',
                    question: 'Secteur d\'activité ?',
                    type: 'text',
                    placeholder: 'Ex: SaaS, E-commerce, FinTech...'
                }
            ],
            sales_expert: [
                {
                    id: 'sales_model',
                    question: 'Modèle de vente ?',
                    type: 'select',
                    options: ['B2B', 'B2C', 'B2B2C', 'Marketplace']
                },
                {
                    id: 'sales_cycle',
                    question: 'Durée du cycle de vente ?',
                    type: 'select',
                    options: ['<1 mois', '1-3 mois', '3-6 mois', '6-12 mois', '12+ mois']
                },
                {
                    id: 'sales_focus',
                    question: 'Focus commercial ?',
                    type: 'multiselect',
                    options: ['Prospection', 'Closing', 'Account management', 'Upsell/Cross-sell', 'Channel sales']
                },
                {
                    id: 'team_size',
                    question: 'Taille de l\'équipe commerciale ?',
                    type: 'select',
                    options: ['Solo', '2-5', '6-15', '16-50', '50+']
                }
            ],
            manager_coach: [
                {
                    id: 'team_size',
                    question: 'Taille de votre équipe ?',
                    type: 'select',
                    options: ['1-3', '4-8', '9-15', '16-30', '30+']
                },
                {
                    id: 'management_level',
                    question: 'Niveau de management ?',
                    type: 'select',
                    options: ['Team lead', 'Manager', 'Senior manager', 'Director', 'VP+']
                },
                {
                    id: 'management_challenges',
                    question: 'Défis principaux ?',
                    type: 'multiselect',
                    options: ['Recrutement', 'Rétention', 'Performance', 'Communication', 'Développement', 'Conflits']
                },
                {
                    id: 'team_type',
                    question: 'Type d\'équipe ?',
                    type: 'select',
                    options: ['Remote', 'Hybride', 'Sur site', 'Mixte']
                }
            ]
        };

        return questionsByProfile[profileId] || questionsByProfile.lucide_assistant;
    }
}

// Singleton instance
const userProfileService = new UserProfileService();

module.exports = userProfileService;
