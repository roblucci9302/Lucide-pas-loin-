/**
 * Document Generation Service - Phase 5: Document Management (OUTPUT)
 *
 * Generates professional documents from templates or conversations:
 * - Agent-specific templates (IT, Marketing, HR, CEO)
 * - Auto-generation from conversations (LLM analysis)
 * - Professional formatting (headers, footers, tables, charts)
 * - Multi-format output (PDF, DOCX, Markdown)
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { loaders } = require('../utils/dependencyLoader');
const uuid = loaders.loadUuid();
const uuidv4 = uuid.v4;
const conversationHistoryService = require('./conversationHistoryService');
const { createStreamingLLM } = require('../common/ai/factory');
const modelStateService = require('./modelStateService');

/**
 * @class DocumentGenerationService
 * @description Professional document generation with templates and LLM
 */
class DocumentGenerationService {
    constructor() {
        this.outputDir = path.join(process.cwd(), 'data', 'generated');
        this.templates = this.loadTemplates();
        console.log('[DocumentGenerationService] Service initialized');
        this.ensureOutputDir();
    }

    /**
     * Ensure output directory exists
     */
    async ensureOutputDir() {
        try {
            await fs.mkdir(this.outputDir, { recursive: true });
        } catch (error) {
            console.error('[DocumentGenerationService] Failed to create output directory:', error);
        }
    }

    /**
     * Load templates for each agent
     */
    loadTemplates() {
        return {
            it_expert: {
                technical_report: require('../templates/documents/it_technical_report'),
                architecture_doc: require('../templates/documents/it_architecture_doc'),
                deployment_plan: require('../templates/documents/it_deployment_plan')
            },
            marketing_expert: {
                campaign_brief: require('../templates/documents/marketing_campaign_brief'),
                content_calendar: require('../templates/documents/marketing_content_calendar'),
                strategy_doc: require('../templates/documents/marketing_strategy_doc')
            },
            hr_specialist: {
                hr_report: require('../templates/documents/hr_report'),
                job_description: require('../templates/documents/hr_job_description'),
                performance_review: require('../templates/documents/hr_performance_review')
            },
            ceo_advisor: {
                board_report: require('../templates/documents/ceo_board_report'),
                strategic_plan: require('../templates/documents/ceo_strategic_plan'),
                investor_update: require('../templates/documents/ceo_investor_update')
            }
        };
    }

    /**
     * Generate document from template
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Generated document info
     */
    async generateFromTemplate(options) {
        const {
            templateId,
            agentProfile,
            data = {},
            format = 'markdown', // markdown, pdf, docx
            customizations = {}
        } = options;

        console.log(`[DocumentGenerationService] Generating ${templateId} for ${agentProfile} in ${format}`);

        try {
            // 1. Get template
            const template = this.getTemplate(templateId, agentProfile);
            if (!template) {
                throw new Error(`Template not found: ${templateId} for ${agentProfile}`);
            }

            // 2. Render template with data
            const rendered = this.renderTemplate(template, data);

            // 3. Apply agent-specific formatting
            const formatted = this.applyAgentFormatting(rendered, agentProfile);

            // 4. Add headers/footers, branding
            const branded = this.addBranding(formatted, {
                agentProfile,
                ...customizations
            });

            // 5. Save to file
            const filePath = await this.saveDocument(branded, {
                format,
                templateId,
                agentProfile
            });

            console.log(`[DocumentGenerationService] ✅ Document generated: ${filePath}`);

            return {
                success: true,
                filePath,
                format,
                size: (await fs.stat(filePath)).size
            };
        } catch (error) {
            console.error('[DocumentGenerationService] Error generating document:', error);
            throw new Error(`Failed to generate document: ${error.message}`);
        }
    }

    /**
     * Generate document from conversation (LLM analysis)
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Generated document info
     */
    async generateFromConversation(options) {
        const {
            sessionId,
            agentProfile,
            documentType, // report, summary, action_plan, proposal, brief
            format = 'markdown',
            userId
        } = options;

        console.log(`[DocumentGenerationService] Generating ${documentType} from conversation ${sessionId}`);

        try {
            // 1. Get conversation messages
            const messages = await conversationHistoryService.getSessionMessages(sessionId);
            if (!messages || messages.length === 0) {
                throw new Error('No messages found in conversation');
            }

            // 2. Analyze conversation and extract structure with LLM
            const structure = await this.analyzeConversation(messages, documentType, agentProfile);

            // 3. Get appropriate template
            const template = this.getTemplateByType(documentType, agentProfile);

            // 4. Generate document with extracted data
            return await this.generateFromTemplate({
                templateId: template.id,
                agentProfile,
                data: structure,
                format
            });
        } catch (error) {
            console.error('[DocumentGenerationService] Error generating from conversation:', error);
            throw new Error(`Failed to generate from conversation: ${error.message}`);
        }
    }

    /**
     * Analyze conversation with LLM to extract structure
     * @param {Array} messages - Conversation messages
     * @param {string} documentType - Type of document to generate
     * @param {string} agentProfile - Agent profile
     * @returns {Promise<Object>} Structured data
     */
    async analyzeConversation(messages, documentType, agentProfile) {
        console.log('[DocumentGenerationService] Analyzing conversation with LLM...');

        // Build conversation text
        const conversationText = messages
            .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
            .join('\n\n');

        // Build analysis prompt based on document type
        const analysisPrompt = this.buildAnalysisPrompt(conversationText, documentType, agentProfile);

        // Call LLM
        const modelInfo = await modelStateService.getCurrentModelInfo('llm');
        if (!modelInfo || !modelInfo.apiKey) {
            throw new Error('AI model not configured');
        }

        const llm = createStreamingLLM(modelInfo.provider, {
            apiKey: modelInfo.apiKey,
            model: modelInfo.model,
            temperature: 0.3, // Low temperature for structured extraction
            maxTokens: 2048
        });

        try {
            const response = await llm.chat([
                {
                    role: 'system',
                    content: 'You are a professional document analyst. Extract structured information from conversations to create professional documents. Always return valid JSON.'
                },
                {
                    role: 'user',
                    content: analysisPrompt
                }
            ]);

            // Parse JSON response
            const result = JSON.parse(response);
            console.log('[DocumentGenerationService] ✅ Conversation analyzed');

            return result;
        } catch (error) {
            console.error('[DocumentGenerationService] LLM analysis failed:', error);
            throw new Error(`Conversation analysis failed: ${error.message}`);
        }
    }

    /**
     * Build analysis prompt for LLM
     */
    buildAnalysisPrompt(conversationText, documentType, agentProfile) {
        const prompts = {
            technical_report: `
Analyze this technical conversation and extract data for a Technical Report.

Conversation:
${conversationText}

Extract the following in JSON format:
{
    "title": "Report title",
    "executiveSummary": "2-3 sentence summary",
    "problemStatement": "What problem was discussed",
    "rootCause": "Root cause analysis",
    "solution": {
        "description": "Proposed solution",
        "steps": ["Step 1", "Step 2", ...],
        "codeExamples": ["code snippet 1", "code snippet 2"]
    },
    "testing": "Testing strategy",
    "deployment": "Deployment plan",
    "monitoring": "Monitoring recommendations"
}

Return ONLY valid JSON.`,

            campaign_brief: `
Analyze this marketing conversation and extract data for a Campaign Brief.

Conversation:
${conversationText}

Extract the following in JSON format:
{
    "campaignName": "Campaign name",
    "overview": "Campaign overview",
    "objectives": [
        {"metric": "Leads", "target": "500", "baseline": "200"}
    ],
    "targetAudience": {
        "demographics": "Description",
        "painPoints": "Pain points",
        "channels": ["LinkedIn", "Email"]
    },
    "keyMessage": "Main message",
    "channelStrategy": [
        {"channel": "LinkedIn", "budget": "$10k", "kpis": "CTR 3%"}
    ],
    "timeline": [
        {"phase": "Planning", "start": "Week 1", "end": "Week 2"}
    ],
    "budget": "$50k"
}

Return ONLY valid JSON.`,

            hr_report: `
Analyze this HR conversation and extract data for an HR Report.

Conversation:
${conversationText}

Extract the following in JSON format:
{
    "title": "Report title",
    "executiveSummary": "Summary",
    "sections": [
        {
            "title": "Section title",
            "content": "Section content"
        }
    ],
    "recommendations": [
        {
            "title": "Recommendation",
            "issue": "Issue description",
            "action": "Proposed action",
            "timeline": "Timeline",
            "owner": "Owner"
        }
    ],
    "nextSteps": "Next steps"
}

Return ONLY valid JSON.`,

            board_report: `
Analyze this strategic conversation and extract data for a Board Report.

Conversation:
${conversationText}

Extract the following in JSON format:
{
    "title": "Report title",
    "executiveSummary": "One paragraph summary",
    "keyMetrics": [
        {"metric": "Revenue", "value": "$1.2M", "change": "+15%"}
    ],
    "highlights": ["Achievement 1", "Achievement 2"],
    "challenges": ["Challenge 1", "Challenge 2"],
    "strategic initiatives": [
        {
            "title": "Initiative name",
            "status": "In progress",
            "impact": "Expected impact"
        }
    ],
    "financialOverview": {
        "revenue": "$1.2M",
        "burn": "$200K",
        "runway": "18 months"
    },
    "askBoard": "What we need from board"
}

Return ONLY valid JSON.`
        };

        // Use appropriate prompt or default
        return prompts[documentType] || prompts.technical_report;
    }

    /**
     * Get template by ID and agent
     */
    getTemplate(templateId, agentProfile) {
        const agentTemplates = this.templates[agentProfile];
        if (!agentTemplates) {
            return null;
        }

        return agentTemplates[templateId] || null;
    }

    /**
     * Get template by document type
     */
    getTemplateByType(documentType, agentProfile) {
        const typeMapping = {
            'technical_report': { agent: 'it_expert', template: 'technical_report' },
            'campaign_brief': { agent: 'marketing_expert', template: 'campaign_brief' },
            'hr_report': { agent: 'hr_specialist', template: 'hr_report' },
            'board_report': { agent: 'ceo_advisor', template: 'board_report' },
            'report': { agent: agentProfile, template: this.getDefaultTemplate(agentProfile) }
        };

        const mapping = typeMapping[documentType] || typeMapping.report;

        return {
            id: mapping.template,
            agent: mapping.agent
        };
    }

    /**
     * Get default template for agent
     */
    getDefaultTemplate(agentProfile) {
        const defaults = {
            'it_expert': 'technical_report',
            'marketing_expert': 'campaign_brief',
            'hr_specialist': 'hr_report',
            'ceo_advisor': 'board_report'
        };

        return defaults[agentProfile] || 'technical_report';
    }

    /**
     * Render template with data (simple string replacement)
     */
    renderTemplate(template, data) {
        let rendered = template.content || template;

        // Replace {{variable}} placeholders
        for (const [key, value] of Object.entries(data)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            rendered = rendered.replace(regex, value);
        }

        return rendered;
    }

    /**
     * Apply agent-specific formatting
     */
    applyAgentFormatting(content, agentProfile) {
        const formattingRules = {
            it_expert: {
                codeBlocks: true,
                technicalTerms: true,
                diagramSupport: true
            },
            marketing_expert: {
                boldHeaders: true,
                callouts: true,
                metricsHighlights: true
            },
            hr_specialist: {
                confidentialNotice: true,
                professionalTone: true
            },
            ceo_advisor: {
                executiveSummaryFirst: true,
                financialTables: true,
                boardReady: true
            }
        };

        // For now, just return content
        // TODO: Apply specific formatting based on rules
        return content;
    }

    /**
     * Add branding (headers, footers)
     */
    addBranding(content, options) {
        const { agentProfile } = options;

        // Add header
        const header = `---\nGenerated by: Lucide ${this.getAgentName(agentProfile)}\nDate: ${new Date().toISOString().split('T')[0]}\n---\n\n`;

        // Add footer
        const footer = `\n\n---\n**Confidential** - Generated by Lucide AI Assistant\n`;

        return header + content + footer;
    }

    /**
     * Get friendly agent name
     */
    getAgentName(agentProfile) {
        const names = {
            'it_expert': 'IT Expert',
            'marketing_expert': 'Marketing Expert',
            'hr_specialist': 'HR Specialist',
            'ceo_advisor': 'CEO Advisor'
        };

        return names[agentProfile] || 'Assistant';
    }

    /**
     * Save document to file
     */
    async saveDocument(content, options) {
        const { format, templateId, agentProfile } = options;

        const fileName = `${templateId}_${Date.now()}.${format}`;
        const filePath = path.join(this.outputDir, fileName);

        // For now, save as markdown
        // TODO: Add PDF and DOCX conversion
        await fs.writeFile(filePath, content, 'utf-8');

        console.log(`[DocumentGenerationService] Document saved: ${filePath}`);

        return filePath;
    }

    /**
     * List available templates
     */
    listTemplates(agentProfile = null) {
        if (agentProfile) {
            return Object.keys(this.templates[agentProfile] || {});
        }

        // Return all templates
        const all = {};
        for (const [agent, templates] of Object.entries(this.templates)) {
            all[agent] = Object.keys(templates);
        }

        return all;
    }
}

// Singleton instance
const documentGenerationService = new DocumentGenerationService();

module.exports = documentGenerationService;
