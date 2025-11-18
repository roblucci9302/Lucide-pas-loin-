/**
 * Meeting Report Service - Phase 6: Transcription Center
 *
 * Generates professional meeting minutes/reports from transcriptions using LLM analysis
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const transcriptionService = require('./transcriptionService');
const { createLLM } = require('../../common/ai/factory');
const tokenTrackingService = require('../../common/services/tokenTrackingService');
const meetingMinutesTemplate = require('../../common/templates/documents/meeting_minutes');

class MeetingReportService {
    constructor() {
        this.outputDir = path.join(process.cwd(), 'data', 'meeting_reports');
        this.ensureOutputDir();
        console.log('[MeetingReportService] Service initialized');
    }

    /**
     * Ensure output directory exists
     */
    async ensureOutputDir() {
        try {
            await fs.mkdir(this.outputDir, { recursive: true });
        } catch (error) {
            console.error('[MeetingReportService] Failed to create output directory:', error);
        }
    }

    /**
     * Generate meeting minutes from a transcription
     * @param {Object} options
     * @param {string} options.transcriptionId - ID of the transcription
     * @param {string} options.uid - User ID
     * @param {string} [options.format='markdown'] - Output format (markdown, pdf)
     * @param {string} [options.language='en'] - Language for the report
     * @returns {Promise<Object>} Generated report info
     */
    async generateMeetingMinutes(options) {
        const {
            transcriptionId,
            uid,
            format = 'markdown',
            language = 'en'
        } = options;

        console.log(`[MeetingReportService] Generating meeting minutes for transcription ${transcriptionId}`);

        try {
            // 1. Get transcription with segments
            const transcription = transcriptionService.getById(transcriptionId);
            if (!transcription) {
                throw new Error(`Transcription not found: ${transcriptionId}`);
            }

            // 2. Analyze transcription with LLM
            console.log('[MeetingReportService] Analyzing transcription with LLM...');
            const analysisData = await this.analyzeTranscription(transcription, language);

            // 3. Fill template with analysis data
            console.log('[MeetingReportService] Filling meeting minutes template...');
            const renderedContent = this.renderTemplate(meetingMinutesTemplate, {
                ...analysisData,
                fullTranscription: this.formatFullTranscription(transcription.segments)
            });

            // 4. Save document
            const filePath = await this.saveReport(renderedContent, {
                format,
                transcriptionId,
                title: transcription.title || 'meeting_minutes'
            });

            // 5. Store as insight in transcription
            transcriptionService.addInsight(transcriptionId, {
                insightType: 'meeting_minutes',
                title: 'Meeting Minutes',
                content: renderedContent,
                metadata: {
                    format,
                    filePath,
                    generatedAt: Date.now()
                },
                model: 'llm',
                tokensUsed: null // Will be tracked by LLM call
            });

            console.log(`[MeetingReportService] ✅ Meeting minutes generated: ${filePath}`);

            return {
                success: true,
                filePath,
                format,
                size: (await fs.stat(filePath)).size,
                transcriptionId
            };

        } catch (error) {
            console.error('[MeetingReportService] Error generating meeting minutes:', error);
            throw new Error(`Failed to generate meeting minutes: ${error.message}`);
        }
    }

    /**
     * Analyze transcription with LLM to extract structured data for template
     * @param {Object} transcription - Transcription with segments
     * @param {string} language - Language for analysis
     * @returns {Promise<Object>} Extracted data
     */
    async analyzeTranscription(transcription, language = 'en') {
        // Format segments as readable conversation
        const conversationText = transcription.segments
            .map(seg => `${seg.speaker}: ${seg.text}`)
            .join('\n');

        // Create analysis prompt
        const prompt = this.createAnalysisPrompt(conversationText, transcription, language);

        try {
            const llm = await createLLM();
            const messages = [
                { role: 'system', content: this.getSystemPrompt(language) },
                { role: 'user', content: prompt }
            ];

            console.log('[MeetingReportService] Calling LLM for analysis...');
            const response = await llm.chat(messages, {
                temperature: 0.3, // Low temperature for accurate extraction
                max_tokens: 3000,
                user: 'meeting-report-service'
            });

            // Track tokens
            tokenTrackingService.track({
                sessionId: transcription.session_id,
                role: 'assistant',
                tokens: response.usage?.total_tokens || 0,
                model: response.model || 'unknown',
                feature: 'meeting_minutes_generation'
            });

            // Parse JSON response
            const analysisData = this.parseAnalysisResponse(response.content);

            // Add metadata
            return {
                ...analysisData,
                meetingDate: this.formatDate(transcription.start_at, language),
                meetingTime: this.formatTime(transcription.start_at, language),
                duration: this.formatDuration(transcription.duration, language),
                participants: this.formatParticipants(transcription.participants),
                preparedBy: 'Lucide AI Assistant',
                dateGenerated: this.formatDate(Date.now() / 1000, language),
                reviewStatus: 'Draft'
            };

        } catch (error) {
            console.error('[MeetingReportService] LLM analysis error:', error);
            throw error;
        }
    }

    /**
     * Get system prompt for meeting analysis
     */
    getSystemPrompt(language) {
        if (language === 'fr') {
            return `Tu es un assistant expert en prise de notes et création de comptes-rendus de réunion professionnels.
Tu analyses des transcriptions de réunions et tu extrais les informations clés de manière structurée et précise.
Tu réponds UNIQUEMENT avec du JSON valide, sans texte supplémentaire.`;
        }

        return `You are an expert assistant in meeting note-taking and professional meeting minutes creation.
You analyze meeting transcriptions and extract key information in a structured and precise manner.
You respond ONLY with valid JSON, without any additional text.`;
    }

    /**
     * Create analysis prompt for LLM
     */
    createAnalysisPrompt(conversationText, transcription, language) {
        if (language === 'fr') {
            return `Analyse cette transcription de réunion et extrais les informations suivantes en JSON :

{
  "title": "Titre concis de la réunion (max 100 caractères)",
  "objective": "Objectif principal de la réunion",
  "executiveSummary": "Résumé exécutif (3-5 phrases)",
  "keyTakeaways": "Liste à puces des points clés (3-5 points)",
  "topicsCovered": "Liste des sujets abordés",
  "discussion": "Discussion détaillée par sujet",
  "decisions": "Liste des décisions prises",
  "decisionTable": "Lignes de tableau pour les décisions | Décision | Responsable | Justification | Impact |",
  "actionItems": "Liste des actions à réaliser",
  "actionItemTable": "Lignes de tableau pour les actions | # | Action | Assigné à | Deadline | Priorité | Statut |",
  "questionsAndAnswers": "Questions soulevées et réponses",
  "openIssues": "Questions en suspens / Parking lot",
  "nextSteps": "Prochaines étapes",
  "followUpItems": "Points de suivi",
  "nextMeetingDate": "Date proposée pour la prochaine réunion (ou 'À déterminer')",
  "nextMeetingAgenda": "Ordre du jour proposé pour la prochaine réunion",
  "location": "Lieu de la réunion (ou 'Vidéoconférence' ou 'En personne')",
  "meetingType": "Type de réunion (ex: 'Réunion d'équipe', 'Réunion de projet', etc.)",
  "facilitator": "Animateur de la réunion",
  "additionalNotes": "Notes additionnelles pertinentes",
  "attachments": "Liste des pièces jointes mentionnées"
}

Transcription :
${conversationText}

Réponds UNIQUEMENT avec du JSON valide.`;
        }

        return `Analyze this meeting transcription and extract the following information in JSON:

{
  "title": "Concise meeting title (max 100 characters)",
  "objective": "Main objective of the meeting",
  "executiveSummary": "Executive summary (3-5 sentences)",
  "keyTakeaways": "Bulleted list of key points (3-5 points)",
  "topicsCovered": "List of topics discussed",
  "discussion": "Detailed discussion by topic",
  "decisions": "List of decisions made",
  "decisionTable": "Table rows for decisions | Decision | Owner | Rationale | Impact |",
  "actionItems": "List of action items",
  "actionItemTable": "Table rows for actions | # | Action | Assigned To | Deadline | Priority | Status |",
  "questionsAndAnswers": "Questions raised and answers",
  "openIssues": "Open issues / Parking lot",
  "nextSteps": "Next steps",
  "followUpItems": "Follow-up items",
  "nextMeetingDate": "Proposed date for next meeting (or 'To be determined')",
  "nextMeetingAgenda": "Proposed agenda for next meeting",
  "location": "Meeting location (or 'Video conference' or 'In person')",
  "meetingType": "Meeting type (e.g., 'Team meeting', 'Project meeting', etc.)",
  "facilitator": "Meeting facilitator",
  "additionalNotes": "Additional relevant notes",
  "attachments": "List of mentioned attachments"
}

Transcription:
${conversationText}

Respond ONLY with valid JSON.`;
    }

    /**
     * Parse LLM analysis response (handles JSON extraction)
     */
    parseAnalysisResponse(content) {
        try {
            // Try to extract JSON from markdown code block if present
            const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
            const jsonString = jsonMatch ? jsonMatch[1] : content;

            return JSON.parse(jsonString);
        } catch (error) {
            console.error('[MeetingReportService] Failed to parse JSON response:', error);
            console.error('Raw content:', content);

            // Fallback: return basic structure
            return {
                title: 'Meeting Minutes',
                objective: 'Analysis failed - manual review required',
                executiveSummary: content,
                keyTakeaways: '- See transcription below',
                topicsCovered: 'See transcription',
                discussion: content,
                decisions: 'Not extracted',
                decisionTable: '',
                actionItems: 'Not extracted',
                actionItemTable: '',
                questionsAndAnswers: 'Not extracted',
                openIssues: 'Not extracted',
                nextSteps: 'To be determined',
                followUpItems: 'To be determined',
                nextMeetingDate: 'To be determined',
                nextMeetingAgenda: 'To be determined',
                location: 'Unknown',
                meetingType: 'General meeting',
                facilitator: 'Unknown',
                additionalNotes: 'LLM analysis failed - please review transcription manually',
                attachments: 'None'
            };
        }
    }

    /**
     * Render template with data (simple placeholder replacement)
     */
    renderTemplate(template, data) {
        let content = template.content;

        for (const [key, value] of Object.entries(data)) {
            const placeholder = `{{${key}}}`;
            content = content.replace(new RegExp(placeholder, 'g'), value || '');
        }

        return content;
    }

    /**
     * Format full transcription for appendix
     */
    formatFullTranscription(segments) {
        if (!segments || segments.length === 0) {
            return 'No transcription available';
        }

        return segments
            .map(seg => {
                const time = this.formatTimestamp(seg.start_at);
                return `**[${time}] ${seg.speaker}**: ${seg.text}`;
            })
            .join('\n\n');
    }

    /**
     * Format participants list
     */
    formatParticipants(participants) {
        if (!participants || participants.length === 0) {
            return '- Unknown participants';
        }

        return participants.map(p => `- ${p}`).join('\n');
    }

    /**
     * Format date
     */
    formatDate(timestamp, language = 'en') {
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Format time
     */
    formatTime(timestamp, language = 'en') {
        const date = new Date(timestamp * 1000);
        return date.toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Format duration
     */
    formatDuration(seconds, language = 'en') {
        if (!seconds) return language === 'fr' ? 'Inconnue' : 'Unknown';

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (language === 'fr') {
            if (hours > 0) {
                return `${hours}h ${minutes}min`;
            }
            return `${minutes}min`;
        }

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }

    /**
     * Format timestamp (for transcription segments)
     */
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    /**
     * Save report to file
     */
    async saveReport(content, options) {
        const { format, transcriptionId, title } = options;

        // Generate filename
        const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const timestamp = Date.now();
        const filename = `${sanitizedTitle}_${timestamp}.${format}`;
        const filePath = path.join(this.outputDir, filename);

        try {
            if (format === 'markdown') {
                await fs.writeFile(filePath, content, 'utf-8');
            } else if (format === 'pdf') {
                // TODO: Implement PDF generation using markdown-pdf or similar
                // For now, save as markdown
                await fs.writeFile(filePath.replace('.pdf', '.md'), content, 'utf-8');
                console.warn('[MeetingReportService] PDF generation not yet implemented, saved as markdown');
            }

            return filePath;
        } catch (error) {
            console.error('[MeetingReportService] Error saving report:', error);
            throw error;
        }
    }

    /**
     * Get report file path by transcription ID
     */
    async getReportPath(transcriptionId) {
        const files = await fs.readdir(this.outputDir);
        const reportFile = files.find(f => f.includes(transcriptionId));
        return reportFile ? path.join(this.outputDir, reportFile) : null;
    }
}

// Singleton instance
const meetingReportService = new MeetingReportService();

module.exports = meetingReportService;
