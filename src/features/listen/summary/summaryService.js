const { BrowserWindow } = require('electron');
const { getSystemPrompt } = require('../../common/prompts/promptBuilder.js');
const { createLLM } = require('../../common/ai/factory');
const sessionRepository = require('../../common/repositories/session');
const summaryRepository = require('./repositories');
const modelStateService = require('../../common/services/modelStateService');
const tokenTrackingService = require('../../common/services/tokenTrackingService');

class SummaryService {
    constructor() {
        this.previousAnalysisResult = null;
        this.analysisHistory = [];
        this.conversationHistory = [];
        this.currentSessionId = null;
        
        // Callbacks
        this.onAnalysisComplete = null;
        this.onStatusUpdate = null;
    }

    setCallbacks({ onAnalysisComplete, onStatusUpdate }) {
        this.onAnalysisComplete = onAnalysisComplete;
        this.onStatusUpdate = onStatusUpdate;
    }

    setSessionId(sessionId) {
        this.currentSessionId = sessionId;
    }

    sendToRenderer(channel, data) {
        const { windowPool } = require('../../../window/windowManager');
        const listenWindow = windowPool?.get('listen');
        
        if (listenWindow && !listenWindow.isDestroyed()) {
            listenWindow.webContents.send(channel, data);
        }
    }

    addConversationTurn(speaker, text) {
        const conversationText = `${speaker.toLowerCase()}: ${text.trim()}`;
        this.conversationHistory.push(conversationText);
        console.log(`💬 Added conversation text: ${conversationText}`);
        console.log(`📈 Total conversation history: ${this.conversationHistory.length} texts`);

        // Trigger analysis if needed
        this.triggerAnalysisIfNeeded();
    }

    getConversationHistory() {
        return this.conversationHistory;
    }

    resetConversationHistory() {
        this.conversationHistory = [];
        this.previousAnalysisResult = null;
        this.analysisHistory = [];
        console.log('🔄 Conversation history and analysis state reset');
    }

    /**
     * Converts conversation history into text to include in the prompt.
     * @param {Array<string>} conversationTexts - Array of conversation texts ["me: ~~~", "them: ~~~", ...]
     * @param {number} maxTurns - Maximum number of recent turns to include
     * @returns {string} - Formatted conversation string for the prompt
     */
    formatConversationForPrompt(conversationTexts, maxTurns = 30) {
        if (conversationTexts.length === 0) return '';
        return conversationTexts.slice(-maxTurns).join('\n');
    }

    async makeOutlineAndRequests(conversationTexts, maxTurns = 30) {
        console.log(`🔍 makeOutlineAndRequests called - conversationTexts: ${conversationTexts.length}`);

        if (conversationTexts.length === 0) {
            console.log('⚠️ No conversation texts available for analysis');
            return null;
        }

        const recentConversation = this.formatConversationForPrompt(conversationTexts, maxTurns);

        // 이전 분석 결과를 프롬프트에 포함
        let contextualPrompt = '';
        if (this.previousAnalysisResult) {
            contextualPrompt = `
Previous Analysis Context:
- Main Topic: ${this.previousAnalysisResult.topic.header}
- Key Points: ${this.previousAnalysisResult.summary.slice(0, 3).join(', ')}
- Last Actions: ${this.previousAnalysisResult.actions.slice(0, 2).join(', ')}

Please build upon this context while analyzing the new conversation segments.
`;
        }

        const basePrompt = getSystemPrompt('meeting_assistant', '', false);
        const systemPrompt = basePrompt.replace('{{CONVERSATION_HISTORY}}', recentConversation);

        try {
            if (this.currentSessionId) {
                await sessionRepository.touch(this.currentSessionId);
            }

            const modelInfo = await modelStateService.getCurrentModelInfo('llm');
            if (!modelInfo || !modelInfo.apiKey) {
                throw new Error('AI model or API key is not configured.');
            }
            console.log(`🤖 Sending analysis request to ${modelInfo.provider} using model ${modelInfo.model}`);

            const messages = [
                {
                    role: 'system',
                    content: systemPrompt,
                },
                {
                    role: 'user',
                    content: `${contextualPrompt}

Analyze the conversation and provide a comprehensive meeting intelligence summary. MUST include ALL sections:

**📋 Summary Overview**
- 3-5 concise bullet points capturing the essence (prioritize newest/most recent points)
- Focus on outcomes, not just topics

**🎯 Key Topic: [Dynamic Topic Name]**
- Main point 1 (specific, actionable insight)
- Main point 2 (specific, actionable insight)
- Main point 3 (specific, actionable insight)

**📝 Extended Context**
2-3 sentences providing deeper explanation, implications, or background that enriches understanding.

**✅ Action Items** (CRITICAL - Extract ALL tasks)
- [ ] **Task description** | Assigned to: [Person/Team] | Due: [Date/Timeframe]
(Look for: "will do", "should", "needs to", "must", "can you", "let's", "I'll")

**🔍 Decisions Made**
- **Decision 1**: What was decided, why, and any alternatives considered
- **Decision 2**: What was decided, why, and any alternatives considered

**❓ Comprehension Quiz** (3-5 intelligent questions)
1. **Question**: [Thought-provoking question requiring synthesis]
   - a) [Option A]
   - b) [Option B]
   - c) [Option C]
   - d) [Option D]
   *Answer: [Letter] - [Brief explanation]*

**💡 Contextual Insights**
- **Background**: Relevant information participants may not know
- **Implications**: What these decisions/discussions mean for the future
- **Risks**: Potential challenges or concerns
- **Opportunities**: Positive outcomes or possibilities

**❗ Unresolved Items**
- Open questions that need answers
- Blocked tasks awaiting decisions

**🔮 Suggested Follow-Up Questions**
1. [Clarifying question based on discussion]
2. [Probing question to deepen understanding]
3. [Forward-looking question about next steps]

Be thorough, specific, and actionable. Build upon previous analysis if provided.`,
                },
            ];

            console.log('🤖 Sending analysis request to AI...');

            const llm = createLLM(modelInfo.provider, {
                apiKey: modelInfo.apiKey,
                model: modelInfo.model,
                temperature: 0.7,
                maxTokens: 1024,
                usePortkey: modelInfo.provider === 'openai-glass',
                portkeyVirtualKey: modelInfo.provider === 'openai-glass' ? modelInfo.apiKey : undefined,
            });

            const completion = await llm.chat(messages);

            // Track token usage and cost
            tokenTrackingService.trackUsage({
                provider: modelInfo.provider,
                model: modelInfo.model,
                response: completion,
                sessionId: this.currentSessionId,
                feature: 'summary'
            });

            const responseText = completion.content;
            console.log(`✅ Analysis response received: ${responseText}`);
            const structuredData = this.parseResponseText(responseText, this.previousAnalysisResult);

            if (this.currentSessionId) {
                try {
                    summaryRepository.saveSummary({
                        sessionId: this.currentSessionId,
                        text: responseText,
                        tldr: structuredData.summary.join('\n'),
                        bullet_json: JSON.stringify(structuredData.topic.bullets),
                        action_json: JSON.stringify(structuredData.actions),
                        model: modelInfo.model
                    });
                } catch (err) {
                    console.error('[DB] Failed to save summary:', err);
                }
            }

            // 분석 결과 저장
            this.previousAnalysisResult = structuredData;
            this.analysisHistory.push({
                timestamp: Date.now(),
                data: structuredData,
                conversationLength: conversationTexts.length,
            });

            if (this.analysisHistory.length > 10) {
                this.analysisHistory.shift();
            }

            return structuredData;
        } catch (error) {
            console.error('❌ Error during analysis generation:', error.message);
            return this.previousAnalysisResult; // 에러 시 이전 결과 반환
        }
    }

    parseResponseText(responseText, previousResult) {
        const structuredData = {
            summary: [],
            topic: { header: '', bullets: [] },
            extendedContext: '',
            actionItems: [],
            decisions: [],
            quiz: [],
            insights: {
                background: '',
                implications: '',
                risks: '',
                opportunities: ''
            },
            unresolvedItems: [],
            followUpQuestions: [],
            actions: [],
            followUps: ['✉️ Draft a follow-up email', '✅ Generate action items', '📝 Show summary'],
        };

        // Preserve previous result if available
        if (previousResult) {
            structuredData.topic.header = previousResult.topic.header || '';
            structuredData.summary = previousResult.summary ? [...previousResult.summary] : [];
        }

        try {
            const lines = responseText.split('\n');
            let currentSection = '';
            let currentQuizQuestion = null;
            let currentInsightType = null;

            for (const line of lines) {
                const trimmedLine = line.trim();

                // Section header detection
                if (trimmedLine.includes('📋 Summary Overview') || trimmedLine.startsWith('**Summary Overview**')) {
                    currentSection = 'summary-overview';
                    continue;
                } else if (trimmedLine.includes('🎯 Key Topic:') || trimmedLine.startsWith('**Key Topic:')) {
                    currentSection = 'topic';
                    const topicName = trimmedLine.match(/Key Topic:\s*(.+?)(?:\*\*)?$/)?.[1] || '';
                    if (topicName) {
                        structuredData.topic.header = topicName.trim();
                    }
                    continue;
                } else if (trimmedLine.includes('📝 Extended Context') || trimmedLine.startsWith('**Extended Context**')) {
                    currentSection = 'extended-context';
                    continue;
                } else if (trimmedLine.includes('✅ Action Items') || trimmedLine.startsWith('**Action Items**')) {
                    currentSection = 'action-items';
                    continue;
                } else if (trimmedLine.includes('🔍 Decisions Made') || trimmedLine.startsWith('**Decisions Made**')) {
                    currentSection = 'decisions';
                    continue;
                } else if (trimmedLine.includes('❓ Comprehension Quiz') || trimmedLine.startsWith('**Comprehension Quiz**')) {
                    currentSection = 'quiz';
                    continue;
                } else if (trimmedLine.includes('💡 Contextual Insights') || trimmedLine.startsWith('**Contextual Insights**')) {
                    currentSection = 'insights';
                    continue;
                } else if (trimmedLine.includes('❗ Unresolved Items') || trimmedLine.startsWith('**Unresolved Items**')) {
                    currentSection = 'unresolved';
                    continue;
                } else if (trimmedLine.includes('🔮 Suggested Follow-Up Questions') || trimmedLine.startsWith('**Suggested Follow-Up Questions**')) {
                    currentSection = 'follow-up-questions';
                    continue;
                }

                // Content parsing
                if (trimmedLine.startsWith('-') && currentSection === 'summary-overview') {
                    const summaryPoint = trimmedLine.substring(1).trim();
                    if (summaryPoint && !structuredData.summary.includes(summaryPoint)) {
                        structuredData.summary.unshift(summaryPoint);
                        if (structuredData.summary.length > 5) {
                            structuredData.summary.pop();
                        }
                    }
                } else if (trimmedLine.startsWith('-') && currentSection === 'topic') {
                    const bullet = trimmedLine.substring(1).trim();
                    if (bullet && structuredData.topic.bullets.length < 3) {
                        structuredData.topic.bullets.push(bullet);
                    }
                } else if (currentSection === 'extended-context' && trimmedLine && !trimmedLine.startsWith('**')) {
                    structuredData.extendedContext += (structuredData.extendedContext ? ' ' : '') + trimmedLine;
                } else if (currentSection === 'action-items' && (trimmedLine.startsWith('-') || trimmedLine.startsWith('- ['))) {
                    const actionMatch = trimmedLine.match(/^-\s*\[.\]\s*\*\*(.+?)\*\*\s*\|\s*Assigned to:\s*(.+?)\s*\|\s*Due:\s*(.+)$/);
                    if (actionMatch) {
                        structuredData.actionItems.push({
                            task: actionMatch[1].trim(),
                            assignedTo: actionMatch[2].trim(),
                            due: actionMatch[3].trim()
                        });
                    } else {
                        // Fallback for simpler format
                        const simpleAction = trimmedLine.replace(/^-\s*\[.\]\s*/, '').trim();
                        if (simpleAction) {
                            structuredData.actionItems.push({
                                task: simpleAction,
                                assignedTo: 'TBD',
                                due: 'TBD'
                            });
                        }
                    }
                } else if (currentSection === 'decisions' && trimmedLine.startsWith('-')) {
                    const decisionMatch = trimmedLine.match(/^-\s*\*\*(.+?):\*\*\s*(.+)$/);
                    if (decisionMatch) {
                        structuredData.decisions.push({
                            title: decisionMatch[1].trim(),
                            description: decisionMatch[2].trim()
                        });
                    } else {
                        const decision = trimmedLine.substring(1).trim();
                        if (decision) {
                            structuredData.decisions.push({
                                title: 'Decision',
                                description: decision
                            });
                        }
                    }
                } else if (currentSection === 'quiz') {
                    if (trimmedLine.match(/^\d+\.\s*\*\*Question\*\*/)) {
                        // New quiz question
                        const questionText = trimmedLine.replace(/^\d+\.\s*\*\*Question\*\*:\s*/, '').trim();
                        currentQuizQuestion = {
                            question: questionText,
                            options: [],
                            answer: ''
                        };
                        structuredData.quiz.push(currentQuizQuestion);
                    } else if (currentQuizQuestion && trimmedLine.match(/^\s*-\s*[a-d]\)/)) {
                        // Quiz option
                        const option = trimmedLine.replace(/^\s*-\s*/, '').trim();
                        currentQuizQuestion.options.push(option);
                    } else if (currentQuizQuestion && trimmedLine.startsWith('*Answer:')) {
                        // Quiz answer
                        currentQuizQuestion.answer = trimmedLine.replace(/^\*Answer:\s*/, '').replace(/\*$/, '').trim();
                    }
                } else if (currentSection === 'insights') {
                    if (trimmedLine.startsWith('- **Background**:')) {
                        currentInsightType = 'background';
                        structuredData.insights.background = trimmedLine.replace(/^- \*\*Background\*\*:\s*/, '').trim();
                    } else if (trimmedLine.startsWith('- **Implications**:')) {
                        currentInsightType = 'implications';
                        structuredData.insights.implications = trimmedLine.replace(/^- \*\*Implications\*\*:\s*/, '').trim();
                    } else if (trimmedLine.startsWith('- **Risks**:')) {
                        currentInsightType = 'risks';
                        structuredData.insights.risks = trimmedLine.replace(/^- \*\*Risks\*\*:\s*/, '').trim();
                    } else if (trimmedLine.startsWith('- **Opportunities**:')) {
                        currentInsightType = 'opportunities';
                        structuredData.insights.opportunities = trimmedLine.replace(/^- \*\*Opportunities\*\*:\s*/, '').trim();
                    }
                } else if (currentSection === 'unresolved' && trimmedLine.startsWith('-')) {
                    const item = trimmedLine.substring(1).trim();
                    if (item) {
                        structuredData.unresolvedItems.push(item);
                    }
                } else if (currentSection === 'follow-up-questions' && trimmedLine.match(/^\d+\./)) {
                    const question = trimmedLine.replace(/^\d+\.\s*/, '').trim();
                    if (question) {
                        structuredData.followUpQuestions.push(question);
                    }
                }
            }

            // Build actions array from parsed data
            structuredData.actions = [];

            // Add action items
            structuredData.actionItems.slice(0, 3).forEach(item => {
                structuredData.actions.push(`✅ ${item.task}`);
            });

            // Add follow-up questions
            structuredData.followUpQuestions.slice(0, 2).forEach(q => {
                structuredData.actions.push(`❓ ${q}`);
            });

            // Add default actions if empty
            if (structuredData.actions.length === 0) {
                structuredData.actions.push('✨ What should I say next?', '💬 Suggest follow-up questions');
            }

            // Limit to 5 actions
            structuredData.actions = structuredData.actions.slice(0, 5);

            // Validation and fallback to previous data
            if (structuredData.summary.length === 0 && previousResult) {
                structuredData.summary = previousResult.summary || [];
            }
            if (structuredData.topic.bullets.length === 0 && previousResult) {
                structuredData.topic.bullets = previousResult.topic.bullets || [];
            }
        } catch (error) {
            console.error('❌ Error parsing response text:', error);
            return (
                previousResult || {
                    summary: [],
                    topic: { header: 'Analysis in progress', bullets: [] },
                    extendedContext: '',
                    actionItems: [],
                    decisions: [],
                    quiz: [],
                    insights: { background: '', implications: '', risks: '', opportunities: '' },
                    unresolvedItems: [],
                    followUpQuestions: [],
                    actions: ['✨ What should I say next?', '💬 Suggest follow-up questions'],
                    followUps: ['✉️ Draft a follow-up email', '✅ Generate action items', '📝 Show summary'],
                }
            );
        }

        console.log('📊 Final structured data:', JSON.stringify(structuredData, null, 2));
        return structuredData;
    }

    /**
     * Triggers analysis when conversation history reaches 5 texts.
     */
    async triggerAnalysisIfNeeded() {
        if (this.conversationHistory.length >= 5 && this.conversationHistory.length % 5 === 0) {
            console.log(`Triggering analysis - ${this.conversationHistory.length} conversation texts accumulated`);

            const data = await this.makeOutlineAndRequests(this.conversationHistory);
            if (data) {
                console.log('Sending structured data to renderer');
                this.sendToRenderer('summary-update', data);
                
                // Notify callback
                if (this.onAnalysisComplete) {
                    this.onAnalysisComplete(data);
                }
            } else {
                console.log('No analysis data returned');
            }
        }
    }

    getCurrentAnalysisData() {
        return {
            previousResult: this.previousAnalysisResult,
            history: this.analysisHistory,
            conversationLength: this.conversationHistory.length,
        };
    }
}

module.exports = SummaryService; 