import { html, css, LitElement } from '../assets/lit-core-2.7.4.min.js';
import { TranslationMixin } from '../i18n/useTranslation.js';

export class WorkflowBuilder extends TranslationMixin(LitElement) {
    static styles = css`
        * {
            font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            cursor: default;
            user-select: none;
            box-sizing: border-box;
        }

        :host {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 10000;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(10px);
        }

        :host([open]) {
            display: flex;
        }

        .workflow-container {
            width: 90%;
            max-width: 900px;
            max-height: 85vh;
            background: rgba(20, 20, 20, 0.98);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-20px) scale(0.95);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        .header {
            padding: 20px 24px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .header-title {
            font-size: 18px;
            font-weight: 600;
            color: white;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .close-btn {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            color: white;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 18px;
        }

        .close-btn:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: rotate(90deg);
        }

        .profile-selector {
            padding: 16px 24px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .profile-label {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.7);
            font-weight: 500;
        }

        .profile-select {
            flex: 1;
            padding: 8px 12px;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            color: white;
            font-size: 13px;
            cursor: pointer;
            outline: none;
        }

        .profile-select:focus {
            border-color: rgba(0, 122, 255, 0.5);
            background: rgba(255, 255, 255, 0.12);
        }

        .content {
            flex: 1;
            overflow-y: auto;
            padding: 24px;
        }

        .content::-webkit-scrollbar {
            width: 8px;
        }

        .content::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 4px;
        }

        .content::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 4px;
        }

        .workflows-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
            gap: 16px;
        }

        .workflow-card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 16px;
            cursor: pointer;
            transition: all 0.2s;
            position: relative;
            overflow: hidden;
        }

        .workflow-card:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(0, 122, 255, 0.4);
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0, 122, 255, 0.2);
        }

        .workflow-card.selected {
            background: rgba(0, 122, 255, 0.2);
            border-color: rgba(0, 122, 255, 0.6);
        }

        .workflow-icon {
            font-size: 32px;
            margin-bottom: 8px;
        }

        .workflow-title {
            font-size: 14px;
            font-weight: 600;
            color: white;
            margin-bottom: 6px;
        }

        .workflow-description {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
            line-height: 1.4;
            margin-bottom: 8px;
        }

        .workflow-meta {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 10px;
            color: rgba(255, 255, 255, 0.5);
        }

        .workflow-badge {
            padding: 3px 8px;
            background: rgba(0, 122, 255, 0.2);
            border: 1px solid rgba(0, 122, 255, 0.3);
            border-radius: 10px;
            font-size: 10px;
        }

        .form-container {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 20px;
            margin-top: 20px;
        }

        .form-title {
            font-size: 16px;
            font-weight: 600;
            color: white;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .form-group {
            margin-bottom: 16px;
        }

        .form-label {
            display: block;
            font-size: 13px;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.9);
            margin-bottom: 6px;
        }

        .form-label .required {
            color: #ef4444;
            margin-left: 2px;
        }

        .form-input,
        .form-select,
        .form-textarea {
            width: 100%;
            padding: 10px 12px;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            color: white;
            font-size: 13px;
            outline: none;
            transition: all 0.2s;
        }

        .form-textarea {
            min-height: 80px;
            resize: vertical;
            font-family: inherit;
        }

        .form-input::placeholder,
        .form-textarea::placeholder {
            color: rgba(255, 255, 255, 0.4);
        }

        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
            background: rgba(255, 255, 255, 0.12);
            border-color: rgba(0, 122, 255, 0.5);
            box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
        }

        .form-select {
            cursor: pointer;
        }

        .footer {
            padding: 16px 24px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
        }

        .btn {
            padding: 10px 20px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
            outline: none;
        }

        .btn-secondary {
            background: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.15);
            color: white;
        }

        .btn-primary {
            background: rgba(0, 122, 255, 0.8);
            color: white;
            border: 1px solid rgba(0, 122, 255, 1);
        }

        .btn-primary:hover {
            background: rgba(0, 122, 255, 1);
            box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
        }

        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .empty-state {
            text-align: center;
            padding: 48px 32px;
            color: rgba(255, 255, 255, 0.5);
        }

        .empty-icon {
            font-size: 64px;
            margin-bottom: 16px;
            opacity: 0.3;
        }

        .category-section {
            margin-bottom: 32px;
        }

        .category-title {
            font-size: 14px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* Glass bypass */
        :host-context(body.has-glass) {
            backdrop-filter: none !important;
        }
    `;

    static properties = {
        open: { type: Boolean, reflect: true },
        selectedProfile: { type: String, state: true },
        workflows: { type: Array, state: true },
        selectedWorkflow: { type: Object, state: true },
        formData: { type: Object, state: true },
        isLoading: { type: Boolean, state: true }
    };

    constructor() {
        super();
        this.open = false;
        this.selectedProfile = 'hr_specialist';
        this.workflows = [];
        this.selectedWorkflow = null;
        this.formData = {};
        this.isLoading = false;
    }

    connectedCallback() {
        super.connectedCallback();
        this.loadWorkflows();
    }

    async loadWorkflows() {
        if (!window.api || !window.api.workflows) {
            this.workflows = this.getMockWorkflows();
            return;
        }

        try {
            this.isLoading = true;
            const workflowsData = await window.api.workflows.getWorkflowsForProfile(this.selectedProfile);
            this.workflows = workflowsData || [];
            this.isLoading = false;
        } catch (error) {
            console.error('[WorkflowBuilder] Error loading workflows:', error);
            this.workflows = this.getMockWorkflows();
            this.isLoading = false;
        }
    }

    getMockWorkflows() {
        // Fallback mock data
        return [
            {
                id: 'create_job_posting',
                title: 'Créer une offre d\'emploi',
                icon: '📝',
                description: 'Générer une offre d\'emploi professionnelle et attractive',
                category: 'recruitment',
                estimatedTime: '5-10 min',
                hasForm: true
            },
            {
                id: 'analyze_cv',
                title: 'Analyser un CV',
                icon: '🔍',
                description: 'Évaluer un CV par rapport à un poste',
                category: 'recruitment',
                estimatedTime: '3-5 min',
                hasForm: false
            }
        ];
    }

    openModal() {
        this.open = true;
        this.loadWorkflows();
    }

    closeModal() {
        this.open = false;
        this.selectedWorkflow = null;
        this.formData = {};
    }

    async handleProfileChange(e) {
        this.selectedProfile = e.target.value;
        this.selectedWorkflow = null;
        this.formData = {};
        await this.loadWorkflows();
    }

    selectWorkflow(workflow) {
        this.selectedWorkflow = workflow;
        this.formData = {};
    }

    updateFormData(field, value) {
        this.formData = { ...this.formData, [field]: value };
    }

    async handleExecute() {
        if (!this.selectedWorkflow) return;

        const workflowId = this.selectedWorkflow.id;

        if (window.api && window.api.workflows) {
            try {
                const result = await window.api.workflows.executeWorkflow(
                    this.selectedProfile,
                    workflowId,
                    this.formData
                );

                if (result.success) {
                    // Dispatch event to notify parent
                    this.dispatchEvent(new CustomEvent('workflow-executed', {
                        detail: {
                            profile: this.selectedProfile,
                            workflowId,
                            prompt: result.prompt
                        },
                        bubbles: true,
                        composed: true
                    }));

                    this.closeModal();
                }
            } catch (error) {
                console.error('[WorkflowBuilder] Error executing workflow:', error);
                alert('Erreur lors de l\'exécution du workflow');
            }
        } else {
            // Fallback: just close and dispatch event
            this.dispatchEvent(new CustomEvent('workflow-executed', {
                detail: {
                    profile: this.selectedProfile,
                    workflowId,
                    formData: this.formData
                },
                bubbles: true,
                composed: true
            }));

            this.closeModal();
        }
    }

    groupWorkflowsByCategory() {
        const grouped = {};
        this.workflows.forEach(workflow => {
            const category = workflow.category || 'other';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(workflow);
        });
        return grouped;
    }

    getCategoryName(category) {
        const names = {
            recruitment: 'Recrutement',
            onboarding: 'Intégration',
            performance: 'Performance',
            development: 'Développement',
            compliance: 'Conformité',
            other: 'Autre'
        };
        return names[category] || category;
    }

    renderForm() {
        if (!this.selectedWorkflow || !this.selectedWorkflow.hasForm) {
            return '';
        }

        // For now, show a placeholder since we'd need to fetch form fields
        return html`
            <div class="form-container">
                <div class="form-title">
                    📋 Informations requises
                </div>
                <div class="form-group">
                    <label class="form-label">
                        Détails <span class="required">*</span>
                    </label>
                    <textarea
                        class="form-textarea"
                        placeholder="Entrez les détails nécessaires pour ce workflow..."
                        @input=${(e) => this.updateFormData('details', e.target.value)}
                    ></textarea>
                </div>
            </div>
        `;
    }

    render() {
        if (!this.open) return '';

        const groupedWorkflows = this.groupWorkflowsByCategory();

        return html`
            <div class="workflow-container" @click=${(e) => e.stopPropagation()}>
                <div class="header">
                    <div class="header-title">
                        <span>⚡</span>
                        <span>Workflows automatisés</span>
                    </div>
                    <button class="close-btn" @click=${this.closeModal} title="Fermer">
                        ✕
                    </button>
                </div>

                <div class="profile-selector">
                    <span class="profile-label">Profil d'agent:</span>
                    <select class="profile-select" .value=${this.selectedProfile} @change=${this.handleProfileChange}>
                        <option value="hr_specialist">👩‍💼 RH Specialist</option>
                        <option value="it_expert">💻 IT Expert</option>
                        <option value="marketing_expert">📱 Marketing Expert</option>
                        <option value="lucide_assistant">✨ Assistant Général</option>
                    </select>
                </div>

                <div class="content">
                    ${this.isLoading ? html`
                        <div class="empty-state">Chargement des workflows...</div>
                    ` : this.workflows.length === 0 ? html`
                        <div class="empty-state">
                            <div class="empty-icon">📦</div>
                            <div>Aucun workflow disponible pour ce profil</div>
                        </div>
                    ` : html`
                        ${Object.keys(groupedWorkflows).map(category => html`
                            <div class="category-section">
                                <div class="category-title">${this.getCategoryName(category)}</div>
                                <div class="workflows-grid">
                                    ${groupedWorkflows[category].map(workflow => html`
                                        <div
                                            class="workflow-card ${this.selectedWorkflow?.id === workflow.id ? 'selected' : ''}"
                                            @click=${() => this.selectWorkflow(workflow)}
                                        >
                                            <div class="workflow-icon">${workflow.icon}</div>
                                            <div class="workflow-title">${workflow.title}</div>
                                            <div class="workflow-description">${workflow.description}</div>
                                            <div class="workflow-meta">
                                                <span>⏱️ ${workflow.estimatedTime}</span>
                                                ${workflow.hasForm ? html`
                                                    <span class="workflow-badge">📋 Formulaire</span>
                                                ` : ''}
                                            </div>
                                        </div>
                                    `)}
                                </div>
                            </div>
                        `)}

                        ${this.selectedWorkflow ? this.renderForm() : ''}
                    `}
                </div>

                <div class="footer">
                    <button class="btn btn-secondary" @click=${this.closeModal}>
                        Annuler
                    </button>
                    <button
                        class="btn btn-primary"
                        @click=${this.handleExecute}
                        ?disabled=${!this.selectedWorkflow}
                    >
                        ⚡ Exécuter le workflow
                    </button>
                </div>
            </div>
        `;
    }
}

customElements.define('workflow-builder', WorkflowBuilder);
