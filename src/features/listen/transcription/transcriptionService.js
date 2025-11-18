const transcriptionRepository = require('./repositories');
const { createLLM } = require('../../common/ai/factory');
const tokenTrackingService = require('../../common/services/tokenTrackingService');

/**
 * TranscriptionService
 * Phase 6: Advanced transcription management
 *
 * Provides high-level operations for transcriptions:
 * - Aggregating transcript segments into transcriptions
 * - Auto-generating titles and summaries
 * - Managing transcription lifecycle
 * - Search and retrieval
 */
class TranscriptionService {
    constructor() {
        this.currentTranscriptionId = null;
    }

    /**
     * Create a transcription from existing transcript segments
     * @param {Object} params
     * @param {string} params.uid - User ID
     * @param {string} params.sessionId - Session ID
     * @param {Array} params.transcriptSegments - Array of transcript objects from transcripts table
     * @param {Object} [params.options] - Optional metadata
     * @returns {Promise<Object>} Created transcription
     */
    async createFromTranscripts({ uid, sessionId, transcriptSegments, options = {} }) {
        console.log(`[TranscriptionService] Creating transcription from ${transcriptSegments.length} segments`);

        if (!transcriptSegments || transcriptSegments.length === 0) {
            throw new Error('No transcript segments provided');
        }

        // Calculate metadata from segments
        const sortedSegments = transcriptSegments.sort((a, b) => a.start_at - b.start_at);
        const firstSegment = sortedSegments[0];
        const lastSegment = sortedSegments[sortedSegments.length - 1];

        const startAt = firstSegment.start_at;
        const endAt = lastSegment.end_at || lastSegment.start_at;
        const duration = Math.floor((endAt - startAt) / 1000); // Convert to seconds

        // Extract unique participants
        const participants = [...new Set(transcriptSegments.map(t => t.speaker).filter(Boolean))];

        // Concatenate text for word count
        const fullText = transcriptSegments.map(t => t.text).join(' ');
        const wordCount = fullText.split(/\s+/).filter(Boolean).length;

        // Detect language from first segment
        const language = firstSegment.lang || 'en';

        // Generate title if not provided
        let title = options.title;
        if (!title) {
            title = await this.generateTitle(fullText, { language });
        }

        // Create transcription
        const result = transcriptionRepository.createTranscription({
            uid,
            sessionId,
            title,
            description: options.description || null,
            duration,
            participants,
            tags: options.tags || [],
            summary: options.summary || null,
            language,
            status: 'completed'
        });

        const transcriptionId = result.id;
        console.log(`[TranscriptionService] Created transcription ${transcriptionId}`);

        // Add segments to transcription_segments table
        for (const segment of sortedSegments) {
            transcriptionRepository.addSegment({
                transcriptionId,
                speaker: segment.speaker,
                speakerLabel: null,
                text: segment.text,
                startAt: segment.start_at,
                endAt: segment.end_at || segment.start_at,
                duration: segment.end_at ? segment.end_at - segment.start_at : 0,
                confidence: null,
                language: segment.lang
            });
        }

        // Update counts
        transcriptionRepository.updateTranscription(transcriptionId, {
            transcript_count: transcriptSegments.length,
            word_count: wordCount
        });

        console.log(`[TranscriptionService] Added ${transcriptSegments.length} segments to transcription`);

        return this.getById(transcriptionId);
    }

    /**
     * Generate a concise title from transcription text using LLM
     * @param {string} text - Full transcription text
     * @param {Object} options - Options
     * @returns {Promise<string>} Generated title
     */
    async generateTitle(text, options = {}) {
        const { language = 'en', maxLength = 100 } = options;

        // Truncate text if too long (use first ~500 words)
        const words = text.split(/\s+/);
        const sampleText = words.slice(0, 500).join(' ');

        const prompt = language === 'fr'
            ? `Génère un titre court et descriptif (maximum ${maxLength} caractères) pour cette transcription de conversation. Le titre doit capturer le sujet principal. Réponds uniquement avec le titre, sans guillemets ni ponctuation finale.\n\nTranscription:\n${sampleText}`
            : `Generate a short, descriptive title (maximum ${maxLength} characters) for this conversation transcription. The title should capture the main topic. Respond only with the title, without quotes or final punctuation.\n\nTranscription:\n${sampleText}`;

        try {
            const llm = await createLLM();
            const messages = [
                { role: 'system', content: 'You are a helpful assistant that generates concise, descriptive titles.' },
                { role: 'user', content: prompt }
            ];

            const response = await llm.chat(messages, {
                temperature: 0.3, // Low temperature for consistent titles
                max_tokens: 50,
                user: 'transcription-service'
            });

            // Track tokens
            tokenTrackingService.track({
                sessionId: null,
                role: 'assistant',
                tokens: response.usage?.total_tokens || 0,
                model: response.model || 'unknown',
                feature: 'transcription_title_generation'
            });

            let title = response.content.trim();

            // Remove quotes if present
            title = title.replace(/^["']|["']$/g, '');

            // Truncate if still too long
            if (title.length > maxLength) {
                title = title.substring(0, maxLength - 3) + '...';
            }

            console.log(`[TranscriptionService] Generated title: "${title}"`);
            return title;

        } catch (error) {
            console.error('[TranscriptionService] Error generating title:', error);
            // Fallback to date-based title
            const date = new Date().toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            return language === 'fr'
                ? `Transcription du ${date}`
                : `Transcription from ${date}`;
        }
    }

    /**
     * Get a transcription by ID with all related data
     * @param {string} transcriptionId
     * @returns {Object|null} Transcription with segments, insights, and notes
     */
    getById(transcriptionId) {
        const transcription = transcriptionRepository.getById(transcriptionId);
        if (!transcription) return null;

        // Load segments, insights, and notes
        const segments = transcriptionRepository.getSegmentsByTranscriptionId(transcriptionId);
        const insights = transcriptionRepository.getInsightsByTranscriptionId(transcriptionId);
        const notes = transcriptionRepository.getNotesByTranscriptionId(transcriptionId);

        return {
            ...transcription,
            segments,
            insights,
            notes
        };
    }

    /**
     * Get transcription by session ID
     * @param {string} sessionId
     * @returns {Object|null} Transcription with all related data
     */
    getBySessionId(sessionId) {
        const transcription = transcriptionRepository.getBySessionId(sessionId);
        if (!transcription) return null;

        return this.getById(transcription.id);
    }

    /**
     * List transcriptions for a user
     * @param {string} uid - User ID
     * @param {Object} options - Pagination and sorting options
     * @returns {Array} List of transcriptions (without segments for performance)
     */
    listTranscriptions(uid, options = {}) {
        return transcriptionRepository.getAllByUserId(uid, options);
    }

    /**
     * Search transcriptions
     * @param {string} uid - User ID
     * @param {string} searchTerm - Search term
     * @param {Object} options - Search options
     * @returns {Array} Matching transcriptions
     */
    searchTranscriptions(uid, searchTerm, options = {}) {
        return transcriptionRepository.searchTranscriptions(uid, searchTerm, options);
    }

    /**
     * Update a transcription
     * @param {string} transcriptionId
     * @param {Object} updates - Fields to update
     * @returns {boolean} Success status
     */
    updateTranscription(transcriptionId, updates) {
        return transcriptionRepository.updateTranscription(transcriptionId, updates);
    }

    /**
     * Delete a transcription (and all related data via CASCADE)
     * @param {string} transcriptionId
     * @returns {boolean} Success status
     */
    deleteTranscription(transcriptionId) {
        return transcriptionRepository.deleteTranscription(transcriptionId);
    }

    /**
     * Add an insight to a transcription
     * @param {string} transcriptionId
     * @param {Object} insight - Insight data
     * @returns {Object} Created insight
     */
    addInsight(transcriptionId, insight) {
        return transcriptionRepository.addInsight({
            transcriptionId,
            ...insight
        });
    }

    /**
     * Get insights by type for a transcription
     * @param {string} transcriptionId
     * @param {string} insightType - Type of insight (summary, action_items, decisions, etc.)
     * @returns {Array} Insights of the specified type
     */
    getInsightsByType(transcriptionId, insightType) {
        return transcriptionRepository.getInsightsByType(transcriptionId, insightType);
    }

    /**
     * Add a note to a transcription
     * @param {string} transcriptionId
     * @param {Object} note - Note data
     * @returns {Object} Created note
     */
    addNote(transcriptionId, note) {
        return transcriptionRepository.addNote({
            transcriptionId,
            ...note
        });
    }

    /**
     * Get notes for a transcription
     * @param {string} transcriptionId
     * @returns {Array} Notes
     */
    getNotes(transcriptionId) {
        return transcriptionRepository.getNotesByTranscriptionId(transcriptionId);
    }

    /**
     * Update a note
     * @param {string} noteId
     * @param {Object} updates - Fields to update
     * @returns {boolean} Success status
     */
    updateNote(noteId, updates) {
        return transcriptionRepository.updateNote(noteId, updates);
    }

    /**
     * Delete a note
     * @param {string} noteId
     * @returns {boolean} Success status
     */
    deleteNote(noteId) {
        return transcriptionRepository.deleteNote(noteId);
    }

    /**
     * Get count of transcriptions for a user
     * @param {string} uid - User ID
     * @returns {number} Count
     */
    getCount(uid) {
        return transcriptionRepository.getCountByUserId(uid);
    }

    /**
     * Get statistics for a user's transcriptions
     * @param {string} uid - User ID
     * @returns {Object} Statistics
     */
    getStatistics(uid) {
        const transcriptions = transcriptionRepository.getAllByUserId(uid, { limit: 1000 });

        const totalDuration = transcriptions.reduce((sum, t) => sum + (t.duration || 0), 0);
        const totalWords = transcriptions.reduce((sum, t) => sum + (t.word_count || 0), 0);
        const avgDuration = transcriptions.length > 0 ? totalDuration / transcriptions.length : 0;

        // Group by month for activity
        const byMonth = {};
        transcriptions.forEach(t => {
            const date = new Date(t.start_at * 1000);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            byMonth[monthKey] = (byMonth[monthKey] || 0) + 1;
        });

        return {
            total: transcriptions.length,
            totalDuration, // in seconds
            totalWords,
            avgDuration, // in seconds
            activityByMonth: byMonth
        };
    }
}

// Singleton instance
const transcriptionService = new TranscriptionService();

module.exports = transcriptionService;
