const sqliteClient = require('./sqliteClient');

/**
 * Service for managing Lucy's agent profiles (modes)
 * Profiles: lucide_assistant (default), hr_specialist, it_expert, marketing_expert
 */
class AgentProfileService {
    constructor() {
        this.currentProfile = 'lucide_assistant';
        this.availableProfiles = [
            {
                id: 'lucide_assistant',
                name: 'Lucy - Assistant Général',
                description: 'Assistant polyvalent pour toutes vos questions',
                icon: '🤖',
                color: '#6366f1'
            },
            {
                id: 'hr_specialist',
                name: 'Lucy - Expert RH',
                description: 'Spécialiste en ressources humaines et recrutement',
                icon: '👩‍💼',
                color: '#ec4899'
            },
            {
                id: 'it_expert',
                name: 'Lucy - Expert IT',
                description: 'Expert en développement et résolution de bugs',
                icon: '💻',
                color: '#10b981'
            },
            {
                id: 'marketing_expert',
                name: 'Lucy - Expert Marketing',
                description: 'Spécialiste en campagnes et stratégie marketing',
                icon: '📱',
                color: '#f59e0b'
            },
            {
                id: 'ceo_advisor',
                name: 'Lucy - Conseiller CEO',
                description: 'Conseiller stratégique pour décisions exécutives',
                icon: '🎯',
                color: '#8b5cf6'
            },
            {
                id: 'sales_expert',
                name: 'Lucy - Expert Sales',
                description: 'Spécialiste en vente et développement commercial',
                icon: '💼',
                color: '#06b6d4'
            },
            {
                id: 'manager_coach',
                name: 'Lucy - Coach Manager',
                description: 'Coach pour management d\'équipe et leadership',
                icon: '👥',
                color: '#ef4444'
            }
        ];
    }

    /**
     * Initialize the service and load user's active profile
     * @param {string} uid - User ID
     */
    async initialize(uid) {
        try {
            const db = sqliteClient.getDatabase();
            const user = db.prepare('SELECT active_agent_profile FROM users WHERE uid = ?').get(uid);

            if (user && user.active_agent_profile) {
                this.currentProfile = user.active_agent_profile;
                console.log(`[AgentProfileService] Loaded profile: ${this.currentProfile} for user ${uid}`);
            } else {
                // Set default profile if not found
                this.currentProfile = 'lucide_assistant';
                console.log(`[AgentProfileService] Using default profile: ${this.currentProfile}`);
            }
        } catch (error) {
            console.error('[AgentProfileService] Error initializing profile:', error);
            this.currentProfile = 'lucide_assistant';
        }
    }

    /**
     * Get the current active profile ID
     * @returns {string} Profile ID
     */
    getCurrentProfile() {
        return this.currentProfile;
    }

    /**
     * Get all available profiles
     * @returns {Array} List of available profiles
     */
    getAvailableProfiles() {
        return this.availableProfiles;
    }

    /**
     * Get profile details by ID
     * @param {string} profileId - Profile ID
     * @returns {Object|null} Profile details or null if not found
     */
    getProfileById(profileId) {
        return this.availableProfiles.find(p => p.id === profileId) || null;
    }

    /**
     * Set the active profile for a user
     * @param {string} uid - User ID
     * @param {string} profileId - Profile ID to activate
     * @returns {boolean} Success status
     */
    async setActiveProfile(uid, profileId) {
        try {
            // Validate profile exists
            const profile = this.getProfileById(profileId);
            if (!profile) {
                console.error(`[AgentProfileService] Invalid profile ID: ${profileId}`);
                return false;
            }

            const db = sqliteClient.getDatabase();
            const stmt = db.prepare('UPDATE users SET active_agent_profile = ? WHERE uid = ?');
            const result = stmt.run(profileId, uid);

            if (result.changes > 0) {
                this.currentProfile = profileId;
                console.log(`[AgentProfileService] Updated active profile to: ${profileId} for user ${uid}`);
                return true;
            } else {
                console.error(`[AgentProfileService] No user found with uid: ${uid}`);
                return false;
            }
        } catch (error) {
            console.error('[AgentProfileService] Error setting active profile:', error);
            return false;
        }
    }

    /**
     * Get profile metadata for display
     * @returns {Object} Current profile metadata
     */
    getCurrentProfileMetadata() {
        return this.getProfileById(this.currentProfile) || {
            id: 'lucide_assistant',
            name: 'Lucy - Assistant Général',
            description: 'Assistant polyvalent',
            icon: '🤖'
        };
    }
}

// Singleton instance
const agentProfileService = new AgentProfileService();

module.exports = agentProfileService;
