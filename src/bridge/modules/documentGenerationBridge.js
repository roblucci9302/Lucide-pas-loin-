/**
 * Document Generation Bridge - Phase 5: Document Management (OUTPUT)
 * IPC handlers for professional document generation
 */

const { ipcMain } = require('electron');
const documentGenerationService = require('../../features/common/services/documentGenerationService');
const sessionRepository = require('../../features/common/repositories/session');

module.exports = {
    /**
     * Initialize all IPC handlers for document generation
     */
    initialize() {
        console.log('[DocumentGenerationBridge] Initializing IPC handlers...');

        /**
         * Generate document from template
         * @param {Object} options - Generation options
         * @returns {Object} Generated document info
         */
        ipcMain.handle('document:generate-from-template', async (event, options) => {
            try {
                const userId = await sessionRepository.getCurrentUserId();
                if (!userId) {
                    throw new Error('User not authenticated');
                }

                const {
                    templateId,
                    agentProfile,
                    data = {},
                    format = 'markdown',
                    customizations = {}
                } = options;

                const result = await documentGenerationService.generateFromTemplate({
                    templateId,
                    agentProfile,
                    data,
                    format,
                    customizations
                });

                return {
                    success: true,
                    ...result
                };
            } catch (error) {
                console.error('[DocumentGenerationBridge] Error generating from template:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        /**
         * Generate document from conversation (LLM analysis)
         * @param {Object} options - Generation options
         * @returns {Object} Generated document info
         */
        ipcMain.handle('document:generate-from-conversation', async (event, options) => {
            try {
                const userId = await sessionRepository.getCurrentUserId();
                if (!userId) {
                    throw new Error('User not authenticated');
                }

                const {
                    sessionId,
                    agentProfile,
                    documentType,
                    format = 'markdown'
                } = options;

                const result = await documentGenerationService.generateFromConversation({
                    sessionId,
                    agentProfile,
                    documentType,
                    format,
                    userId
                });

                return {
                    success: true,
                    ...result
                };
            } catch (error) {
                console.error('[DocumentGenerationBridge] Error generating from conversation:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        /**
         * List available templates for an agent
         * @param {string} agentProfile - Agent profile ID
         * @returns {Object} Available templates
         */
        ipcMain.handle('document:list-templates', async (event, { agentProfile = null }) => {
            try {
                const templates = documentGenerationService.listTemplates(agentProfile);

                return {
                    success: true,
                    templates
                };
            } catch (error) {
                console.error('[DocumentGenerationBridge] Error listing templates:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        /**
         * Get template details
         * @param {string} templateId - Template ID
         * @param {string} agentProfile - Agent profile
         * @returns {Object} Template details
         */
        ipcMain.handle('document:get-template', async (event, { templateId, agentProfile }) => {
            try {
                const template = documentGenerationService.getTemplate(templateId, agentProfile);

                if (!template) {
                    throw new Error(`Template not found: ${templateId} for ${agentProfile}`);
                }

                return {
                    success: true,
                    template: {
                        id: template.id,
                        name: template.name,
                        description: template.description
                    }
                };
            } catch (error) {
                console.error('[DocumentGenerationBridge] Error getting template:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        /**
         * Analyze conversation for document generation
         * (Preview what would be extracted without generating full document)
         * @param {string} sessionId - Session ID
         * @param {string} documentType - Type of document
         * @param {string} agentProfile - Agent profile
         * @returns {Object} Extracted structure
         */
        ipcMain.handle('document:analyze-conversation', async (event, { sessionId, documentType, agentProfile }) => {
            try {
                const userId = await sessionRepository.getCurrentUserId();
                if (!userId) {
                    throw new Error('User not authenticated');
                }

                const conversationHistoryService = require('../../features/common/services/conversationHistoryService');
                const messages = await conversationHistoryService.getSessionMessages(sessionId);

                if (!messages || messages.length === 0) {
                    throw new Error('No messages found in conversation');
                }

                const structure = await documentGenerationService.analyzeConversation(
                    messages,
                    documentType,
                    agentProfile
                );

                return {
                    success: true,
                    structure
                };
            } catch (error) {
                console.error('[DocumentGenerationBridge] Error analyzing conversation:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        /**
         * Get available document types
         * @returns {Object} Available document types by agent
         */
        ipcMain.handle('document:get-document-types', async () => {
            try {
                const documentTypes = {
                    it_expert: [
                        { id: 'technical_report', name: 'Technical Report', description: 'Comprehensive technical documentation' },
                        { id: 'architecture_doc', name: 'Architecture Documentation', description: 'System architecture and design' },
                        { id: 'deployment_plan', name: 'Deployment Plan', description: 'Deployment plan with steps and rollback' }
                    ],
                    marketing_expert: [
                        { id: 'campaign_brief', name: 'Campaign Brief', description: 'Marketing campaign brief with strategy' },
                        { id: 'content_calendar', name: 'Content Calendar', description: 'Strategic content calendar' },
                        { id: 'strategy_doc', name: 'Marketing Strategy', description: 'Comprehensive marketing strategy' }
                    ],
                    hr_specialist: [
                        { id: 'hr_report', name: 'HR Report', description: 'HR report with analytics and recommendations' },
                        { id: 'job_description', name: 'Job Description', description: 'Professional job description' },
                        { id: 'performance_review', name: 'Performance Review', description: 'Employee performance review' }
                    ],
                    ceo_advisor: [
                        { id: 'board_report', name: 'Board Report', description: 'Executive board report' },
                        { id: 'strategic_plan', name: 'Strategic Plan', description: 'Comprehensive strategic plan' },
                        { id: 'investor_update', name: 'Investor Update', description: 'Investor update report' }
                    ]
                };

                return {
                    success: true,
                    documentTypes
                };
            } catch (error) {
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        /**
         * Get supported output formats
         * @returns {Object} Supported formats
         */
        ipcMain.handle('document:get-supported-formats', async () => {
            try {
                const formats = [
                    { id: 'markdown', name: 'Markdown', extension: '.md', available: true },
                    { id: 'pdf', name: 'PDF', extension: '.pdf', available: false, comingSoon: true },
                    { id: 'docx', name: 'Word Document', extension: '.docx', available: false, comingSoon: true }
                ];

                return {
                    success: true,
                    formats
                };
            } catch (error) {
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        /**
         * Preview document generation
         * (Dry run without saving)
         * @param {Object} options - Generation options
         * @returns {Object} Preview content
         */
        ipcMain.handle('document:preview-generation', async (event, options) => {
            try {
                const userId = await sessionRepository.getCurrentUserId();
                if (!userId) {
                    throw new Error('User not authenticated');
                }

                const {
                    templateId,
                    agentProfile,
                    data = {}
                } = options;

                const template = documentGenerationService.getTemplate(templateId, agentProfile);
                if (!template) {
                    throw new Error(`Template not found: ${templateId} for ${agentProfile}`);
                }

                const rendered = documentGenerationService.renderTemplate(template, data);
                const formatted = documentGenerationService.applyAgentFormatting(rendered, agentProfile);
                const branded = documentGenerationService.addBranding(formatted, { agentProfile });

                return {
                    success: true,
                    preview: branded,
                    wordCount: branded.split(/\s+/).length,
                    charCount: branded.length
                };
            } catch (error) {
                console.error('[DocumentGenerationBridge] Error previewing generation:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        console.log('[DocumentGenerationBridge] IPC handlers initialized successfully (8 handlers)');
    }
};
