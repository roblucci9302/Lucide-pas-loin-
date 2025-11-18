import { html, css, LitElement } from '../assets/lit-core-2.7.4.min.js';

/**
 * DocumentGenerationModal Component
 * Modal for generating professional documents (inspired by Claude)
 * Phase 5 - Document Management UI
 */
export class DocumentGenerationModal extends LitElement {
    static properties = {
        visible: { type: Boolean },
        step: { type: Number },
        selectedAgent: { type: String },
        selectedTemplate: { type: String },
        sourceType: { type: String }, // 'conversation' or 'manual'
        availableTemplates: { type: Array },
        isGenerating: { type: Boolean },
        generatedDocument: { type: Object },
        sessionId: { type: String }
    };

    static styles = css`
        * {
            font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            cursor: default;
            user-select: none;
        }

        :host {
            display: block;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10000;
            pointer-events: none;
        }

        :host([visible]) {
            pointer-events: all;
        }

        .overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            opacity: 0;
            transition: opacity 0.2s ease;
        }

        :host([visible]) .overlay {
            opacity: 1;
        }

        .modal {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.95);
            width: 90%;
            max-width: 800px;
            max-height: 85vh;
            background: rgba(25, 25, 25, 0.98);
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.15);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
            display: flex;
            flex-direction: column;
        }

        :host([visible]) .modal {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }

        /* Header */
        .modal-header {
            padding: 24px 24px 16px 24px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .header-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
        }

        .modal-title {
            font-size: 18px;
            font-weight: 600;
            color: #fff;
            margin: 0;
        }

        .close-button {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            background: transparent;
            border: none;
            color: rgba(255, 255, 255, 0.6);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.15s ease;
        }

        .close-button:hover {
            background: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.9);
        }

        /* Steps Progress */
        .steps-progress {
            display: flex;
            gap: 8px;
            margin-top: 16px;
        }

        .step-dot {
            flex: 1;
            height: 4px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 2px;
            transition: background 0.3s ease;
        }

        .step-dot.active {
            background: #818cf8;
        }

        .step-dot.completed {
            background: #4ade80;
        }

        /* Content */
        .modal-content {
            flex: 1;
            overflow-y: auto;
            padding: 24px;
        }

        /* Step 1: Choose Agent */
        .agents-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 12px;
        }

        .agent-card {
            padding: 20px;
            background: rgba(255, 255, 255, 0.03);
            border: 2px solid rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
            text-align: center;
        }

        .agent-card:hover {
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(255, 255, 255, 0.15);
            transform: translateY(-2px);
        }

        .agent-card.selected {
            background: rgba(129, 140, 248, 0.15);
            border-color: #818cf8;
        }

        .agent-icon {
            font-size: 32px;
            margin-bottom: 8px;
        }

        .agent-name {
            font-size: 14px;
            font-weight: 600;
            color: #fff;
            margin: 0 0 4px 0;
        }

        .agent-desc {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.5);
            margin: 0;
        }

        /* Step 2: Choose Template */
        .templates-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .template-card {
            padding: 16px;
            background: rgba(255, 255, 255, 0.03);
            border: 2px solid rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .template-card:hover {
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(255, 255, 255, 0.15);
        }

        .template-card.selected {
            background: rgba(129, 140, 248, 0.15);
            border-color: #818cf8;
        }

        .template-header {
            display: flex;
            align-items: start;
            gap: 12px;
        }

        .template-icon {
            font-size: 24px;
            flex-shrink: 0;
        }

        .template-info {
            flex: 1;
        }

        .template-name {
            font-size: 15px;
            font-weight: 600;
            color: #fff;
            margin: 0 0 6px 0;
        }

        .template-desc {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.6);
            margin: 0;
            line-height: 1.4;
        }

        /* Step 3: Choose Source */
        .source-options {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .source-card {
            padding: 20px;
            background: rgba(255, 255, 255, 0.03);
            border: 2px solid rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .source-card:hover {
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(255, 255, 255, 0.15);
        }

        .source-card.selected {
            background: rgba(129, 140, 248, 0.15);
            border-color: #818cf8;
        }

        .source-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;
        }

        .source-icon {
            font-size: 24px;
        }

        .source-title {
            font-size: 15px;
            font-weight: 600;
            color: #fff;
            margin: 0;
        }

        .source-description {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.6);
            margin: 0;
            padding-left: 36px;
        }

        /* Generation Progress */
        .generation-progress {
            text-align: center;
            padding: 40px 20px;
        }

        .spinner {
            width: 64px;
            height: 64px;
            margin: 0 auto 24px;
            border: 4px solid rgba(129, 140, 248, 0.2);
            border-top-color: #818cf8;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .progress-title {
            font-size: 16px;
            font-weight: 600;
            color: #fff;
            margin: 0 0 8px 0;
        }

        .progress-subtitle {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.6);
            margin: 0;
        }

        /* Success State */
        .success-message {
            text-align: center;
            padding: 40px 20px;
        }

        .success-icon {
            width: 64px;
            height: 64px;
            margin: 0 auto 24px;
            background: rgba(74, 222, 128, 0.15);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #4ade80;
            font-size: 32px;
        }

        .success-title {
            font-size: 18px;
            font-weight: 600;
            color: #fff;
            margin: 0 0 8px 0;
        }

        .success-subtitle {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.6);
            margin: 0 0 24px 0;
        }

        /* Footer */
        .modal-footer {
            padding: 16px 24px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .footer-buttons {
            display: flex;
            gap: 12px;
            margin-left: auto;
        }

        button {
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s ease;
            border: none;
        }

        .btn-secondary {
            background: rgba(255, 255, 255, 0.05);
            color: rgba(255, 255, 255, 0.9);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.1);
        }

        .btn-primary {
            background: #818cf8;
            color: white;
        }

        .btn-primary:hover {
            background: #6366f1;
        }

        .btn-primary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .btn-download {
            background: #4ade80;
            color: white;
        }

        .btn-download:hover {
            background: #22c55e;
        }
    `;

    constructor() {
        super();
        this.visible = false;
        this.step = 1;
        this.selectedAgent = '';
        this.selectedTemplate = '';
        this.sourceType = '';
        this.availableTemplates = [];
        this.isGenerating = false;
        this.generatedDocument = null;
        this.sessionId = null;
    }

    render() {
        return html`
            <div class="overlay" @click="${this._handleClose}"></div>

            <div class="modal">
                <!-- Header -->
                <div class="modal-header">
                    <div class="header-top">
                        <h2 class="modal-title">📄 Générer un document professionnel</h2>
                        <button class="close-button" @click="${this._handleClose}">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
                            </svg>
                        </button>
                    </div>

                    <!-- Steps Progress -->
                    <div class="steps-progress">
                        <div class="step-dot ${this.step >= 1 ? 'active' : ''} ${this.step > 1 ? 'completed' : ''}"></div>
                        <div class="step-dot ${this.step >= 2 ? 'active' : ''} ${this.step > 2 ? 'completed' : ''}"></div>
                        <div class="step-dot ${this.step >= 3 ? 'active' : ''} ${this.step > 3 ? 'completed' : ''}"></div>
                    </div>
                </div>

                <!-- Content -->
                <div class="modal-content">
                    ${this._renderStep()}
                </div>

                <!-- Footer -->
                ${!this.isGenerating && !this.generatedDocument ? html`
                    <div class="modal-footer">
                        <div class="footer-buttons">
                            ${this.step > 1 ? html`
                                <button class="btn-secondary" @click="${this._handlePrevious}">
                                    Précédent
                                </button>
                            ` : ''}

                            ${this.step < 3 ? html`
                                <button
                                    class="btn-primary"
                                    ?disabled="${!this._canProceed()}"
                                    @click="${this._handleNext}"
                                >
                                    Suivant
                                </button>
                            ` : html`
                                <button
                                    class="btn-primary"
                                    ?disabled="${!this._canProceed()}"
                                    @click="${this._handleGenerate}"
                                >
                                    📄 Générer
                                </button>
                            `}
                        </div>
                    </div>
                ` : ''}

                ${this.generatedDocument ? html`
                    <div class="modal-footer">
                        <div class="footer-buttons">
                            <button class="btn-secondary" @click="${this._handleClose}">
                                Fermer
                            </button>
                            <button class="btn-download" @click="${this._handleDownload}">
                                ⬇️ Télécharger
                            </button>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    _renderStep() {
        if (this.isGenerating) {
            return html`
                <div class="generation-progress">
                    <div class="spinner"></div>
                    <h3 class="progress-title">Génération en cours...</h3>
                    <p class="progress-subtitle">
                        Analyse de la conversation et création du document
                    </p>
                </div>
            `;
        }

        if (this.generatedDocument) {
            return html`
                <div class="success-message">
                    <div class="success-icon">✓</div>
                    <h3 class="success-title">Document généré !</h3>
                    <p class="success-subtitle">
                        ${this.generatedDocument.filePath}
                    </p>
                </div>
            `;
        }

        switch (this.step) {
            case 1:
                return this._renderStep1();
            case 2:
                return this._renderStep2();
            case 3:
                return this._renderStep3();
            default:
                return '';
        }
    }

    _renderStep1() {
        const agents = [
            { id: 'it_expert', icon: '💻', name: 'IT Expert', desc: 'Documentation technique' },
            { id: 'marketing_expert', icon: '📊', name: 'Marketing', desc: 'Campagnes et stratégie' },
            { id: 'hr_specialist', icon: '👥', name: 'RH Specialist', desc: 'Rapports RH et évaluations' },
            { id: 'ceo_advisor', icon: '📈', name: 'CEO Advisor', desc: 'Rapports exécutifs' }
        ];

        return html`
            <h3 style="color: #fff; margin: 0 0 16px 0; font-size: 16px;">
                1️⃣ Choisissez un agent
            </h3>
            <div class="agents-grid">
                ${agents.map(agent => html`
                    <div
                        class="agent-card ${this.selectedAgent === agent.id ? 'selected' : ''}"
                        @click="${() => this._selectAgent(agent.id)}"
                    >
                        <div class="agent-icon">${agent.icon}</div>
                        <p class="agent-name">${agent.name}</p>
                        <p class="agent-desc">${agent.desc}</p>
                    </div>
                `)}
            </div>
        `;
    }

    _renderStep2() {
        return html`
            <h3 style="color: #fff; margin: 0 0 16px 0; font-size: 16px;">
                2️⃣ Choisissez un type de document
            </h3>
            <div class="templates-list">
                ${this.availableTemplates.map(template => html`
                    <div
                        class="template-card ${this.selectedTemplate === template.id ? 'selected' : ''}"
                        @click="${() => this._selectTemplate(template.id)}"
                    >
                        <div class="template-header">
                            <div class="template-icon">${template.icon}</div>
                            <div class="template-info">
                                <p class="template-name">${template.name}</p>
                                <p class="template-desc">${template.description}</p>
                            </div>
                        </div>
                    </div>
                `)}
            </div>
        `;
    }

    _renderStep3() {
        return html`
            <h3 style="color: #fff; margin: 0 0 16px 0; font-size: 16px;">
                3️⃣ Source des données
            </h3>
            <div class="source-options">
                <div
                    class="source-card ${this.sourceType === 'conversation' ? 'selected' : ''}"
                    @click="${() => this._selectSource('conversation')}"
                >
                    <div class="source-header">
                        <div class="source-icon">💬</div>
                        <h4 class="source-title">Depuis cette conversation</h4>
                    </div>
                    <p class="source-description">
                        L'IA analysera automatiquement cette conversation et extraira les informations pertinentes
                    </p>
                </div>

                <div
                    class="source-card ${this.sourceType === 'manual' ? 'selected' : ''}"
                    @click="${() => this._selectSource('manual')}"
                >
                    <div class="source-header">
                        <div class="source-icon">✍️</div>
                        <h4 class="source-title">Remplir manuellement</h4>
                    </div>
                    <p class="source-description">
                        Remplir les données du template manuellement (disponible prochainement)
                    </p>
                </div>
            </div>
        `;
    }

    async _selectAgent(agentId) {
        this.selectedAgent = agentId;

        // Load available templates for this agent
        try {
            const result = await window.api.invoke('document:get-document-types');
            if (result.success) {
                const templates = result.documentTypes[agentId] || [];
                this.availableTemplates = templates.map(t => ({
                    ...t,
                    icon: this._getTemplateIcon(t.id)
                }));
            }
        } catch (error) {
            console.error('Error loading templates:', error);
        }
    }

    _selectTemplate(templateId) {
        this.selectedTemplate = templateId;
    }

    _selectSource(sourceType) {
        this.sourceType = sourceType;
    }

    _canProceed() {
        switch (this.step) {
            case 1:
                return this.selectedAgent !== '';
            case 2:
                return this.selectedTemplate !== '';
            case 3:
                return this.sourceType !== '';
            default:
                return false;
        }
    }

    _handlePrevious() {
        if (this.step > 1) {
            this.step--;
        }
    }

    _handleNext() {
        if (this._canProceed() && this.step < 3) {
            this.step++;
        }
    }

    async _handleGenerate() {
        if (!this._canProceed()) return;

        if (this.sourceType === 'manual') {
            alert('Remplissage manuel disponible prochainement !');
            return;
        }

        this.isGenerating = true;

        try {
            const result = await window.api.invoke('document:generate-from-conversation', {
                sessionId: this.sessionId,
                agentProfile: this.selectedAgent,
                documentType: this.selectedTemplate,
                format: 'markdown'
            });

            if (result.success) {
                this.generatedDocument = result;
                this.dispatchEvent(new CustomEvent('document-generated', {
                    detail: result,
                    bubbles: true,
                    composed: true
                }));
            } else {
                alert(`Erreur: ${result.error}`);
                this.isGenerating = false;
            }
        } catch (error) {
            console.error('Generation error:', error);
            alert(`Erreur lors de la génération: ${error.message}`);
            this.isGenerating = false;
        }
    }

    async _handleDownload() {
        if (!this.generatedDocument) return;

        // TODO: Implement download dialog
        alert(`Fichier généré : ${this.generatedDocument.filePath}`);
    }

    _handleClose() {
        this.visible = false;
        this.step = 1;
        this.selectedAgent = '';
        this.selectedTemplate = '';
        this.sourceType = '';
        this.isGenerating = false;
        this.generatedDocument = null;

        this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
    }

    _getTemplateIcon(templateId) {
        const icons = {
            'technical_report': '📋',
            'architecture_doc': '🏗️',
            'deployment_plan': '🚀',
            'campaign_brief': '📢',
            'content_calendar': '📅',
            'strategy_doc': '🎯',
            'hr_report': '📊',
            'job_description': '📝',
            'performance_review': '⭐',
            'board_report': '📈',
            'strategic_plan': '🗺️',
            'investor_update': '💼'
        };
        return icons[templateId] || '📄';
    }
}

customElements.define('document-generation-modal', DocumentGenerationModal);
