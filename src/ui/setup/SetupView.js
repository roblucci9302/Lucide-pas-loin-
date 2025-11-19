import { html, css, LitElement } from '../assets/lit-core-2.7.4.min.js';
import { TranslationMixin } from '../i18n/useTranslation.js';

export class SetupView extends TranslationMixin(LitElement) {
    static styles = css`
        * {
            font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            cursor: default;
            user-select: none;
            box-sizing: border-box;
        }

        :host {
            display: block;
            width: 100%;
            height: 100%;
            color: white;
        }

        .setup-container {
            display: flex;
            flex-direction: column;
            height: 100%;
            background: rgba(20, 20, 20, 0.9);
            border-radius: 12px;
            outline: 0.5px rgba(255, 255, 255, 0.2) solid;
            outline-offset: -1px;
            overflow: hidden;
        }

        .header {
            padding: 24px 32px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            text-align: center;
        }

        .header h1 {
            font-size: 28px;
            font-weight: 600;
            margin: 0 0 8px;
            color: white;
        }

        .header p {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.6);
            margin: 0;
        }

        .progress-bar {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 12px;
            padding: 20px 32px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .progress-step {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .step-circle {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.1);
            border: 2px solid rgba(255, 255, 255, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.3s;
        }

        .step-circle.active {
            background: rgba(0, 122, 255, 0.3);
            border-color: rgba(0, 122, 255, 0.8);
            color: white;
        }

        .step-circle.completed {
            background: rgba(0, 200, 100, 0.3);
            border-color: rgba(0, 200, 100, 0.8);
            color: white;
        }

        .step-label {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.5);
        }

        .step-label.active {
            color: rgba(0, 122, 255, 1);
            font-weight: 500;
        }

        .step-label.completed {
            color: rgba(0, 200, 100, 1);
        }

        .step-divider {
            width: 40px;
            height: 2px;
            background: rgba(255, 255, 255, 0.2);
        }

        .content {
            flex: 1;
            overflow-y: auto;
            padding: 32px;
            display: flex;
            flex-direction: column;
            align-items: center;
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

        .step-content {
            width: 100%;
            max-width: 600px;
        }

        .step-title {
            font-size: 20px;
            font-weight: 600;
            color: white;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .step-icon {
            font-size: 32px;
        }

        .step-description {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.7);
            line-height: 1.6;
            margin-bottom: 24px;
        }

        .form-group {
            margin-bottom: 24px;
        }

        .form-label {
            display: block;
            font-size: 13px;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.9);
            margin-bottom: 8px;
        }

        .form-input {
            width: 100%;
            padding: 10px 14px;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            color: white;
            font-size: 13px;
            outline: none;
            transition: all 0.2s;
        }

        .form-input::placeholder {
            color: rgba(255, 255, 255, 0.4);
        }

        .form-input:focus {
            background: rgba(255, 255, 255, 0.12);
            border-color: rgba(0, 122, 255, 0.5);
            box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
        }

        .form-hint {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.5);
            margin-top: 6px;
        }

        .option-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 12px;
            margin-top: 16px;
        }

        .option-card {
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 16px;
            cursor: pointer;
            transition: all 0.2s;
            text-align: center;
        }

        .option-card:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(255, 255, 255, 0.2);
            transform: translateY(-2px);
        }

        .option-card.selected {
            background: rgba(0, 122, 255, 0.2);
            border-color: rgba(0, 122, 255, 0.6);
        }

        .option-icon {
            font-size: 40px;
            margin-bottom: 8px;
        }

        .option-title {
            font-size: 14px;
            font-weight: 500;
            color: white;
            margin-bottom: 4px;
        }

        .option-description {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.6);
            line-height: 1.4;
        }

        .checkbox-group {
            margin-top: 16px;
        }

        .checkbox-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 12px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 6px;
            margin-bottom: 8px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .checkbox-item:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(255, 255, 255, 0.2);
        }

        .checkbox-item.checked {
            background: rgba(0, 122, 255, 0.15);
            border-color: rgba(0, 122, 255, 0.4);
        }

        .checkbox {
            width: 20px;
            height: 20px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            transition: all 0.2s;
        }

        .checkbox.checked {
            background: rgba(0, 122, 255, 0.8);
            border-color: rgba(0, 122, 255, 1);
        }

        .checkbox-label {
            flex: 1;
        }

        .checkbox-title {
            font-size: 13px;
            font-weight: 500;
            color: white;
            margin-bottom: 4px;
        }

        .checkbox-description {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.6);
            line-height: 1.4;
        }

        .footer {
            padding: 20px 32px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
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

        .success-animation {
            text-align: center;
            padding: 48px 32px;
        }

        .success-icon {
            font-size: 80px;
            margin-bottom: 24px;
            animation: bounce 0.6s;
        }

        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
        }

        .success-title {
            font-size: 24px;
            font-weight: 600;
            color: white;
            margin-bottom: 12px;
        }

        .success-description {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.7);
            line-height: 1.6;
        }

        /* Glass bypass */
        :host-context(body.has-glass) {
            animation: none !important;
            transition: none !important;
        }
        :host-context(body.has-glass) * {
            background: transparent !important;
            filter: none !important;
            backdrop-filter: none !important;
            box-shadow: none !important;
        }
    `;

    static properties = {
        currentStep: { type: Number, state: true },
        selectedLanguage: { type: String, state: true },
        selectedAIProvider: { type: String, state: true },
        apiKeys: { type: Object, state: true },
        features: { type: Object, state: true },
        isComplete: { type: Boolean, state: true }
    };

    constructor() {
        super();
        this.currentStep = 1;
        this.selectedLanguage = 'fr';
        this.selectedAIProvider = 'claude';
        this.apiKeys = {};
        this.features = {
            transcription: true,
            screenshots: false,
            sync: false,
            localAI: false
        };
        this.isComplete = false;
    }

    nextStep() {
        if (this.currentStep < 4) {
            this.currentStep++;
        } else {
            this.completeSetup();
        }
    }

    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
        }
    }

    async completeSetup() {
        // Save configuration
        if (window.api && window.api.settings) {
            const config = {
                language: this.selectedLanguage,
                aiProvider: this.selectedAIProvider,
                apiKeys: this.apiKeys,
                features: this.features
            };

            try {
                await window.api.settings.saveInitialSetup(config);
                this.isComplete = true;
            } catch (error) {
                console.error('Error saving setup:', error);
                alert('Erreur lors de la sauvegarde de la configuration');
            }
        } else {
            this.isComplete = true;
        }
    }

    selectLanguage(lang) {
        this.selectedLanguage = lang;
    }

    selectAIProvider(provider) {
        this.selectedAIProvider = provider;
    }

    updateApiKey(provider, value) {
        this.apiKeys = { ...this.apiKeys, [provider]: value };
    }

    toggleFeature(feature) {
        this.features = { ...this.features, [feature]: !this.features[feature] };
    }

    renderProgressBar() {
        const steps = [
            { number: 1, label: 'Langue' },
            { number: 2, label: 'IA' },
            { number: 3, label: 'Clés API' },
            { number: 4, label: 'Fonctionnalités' }
        ];

        return html`
            <div class="progress-bar">
                ${steps.map((step, index) => html`
                    <div class="progress-step">
                        <div class="step-circle ${this.currentStep === step.number ? 'active' : ''} ${this.currentStep > step.number ? 'completed' : ''}">
                            ${this.currentStep > step.number ? '✓' : step.number}
                        </div>
                        <div class="step-label ${this.currentStep === step.number ? 'active' : ''} ${this.currentStep > step.number ? 'completed' : ''}">
                            ${step.label}
                        </div>
                    </div>
                    ${index < steps.length - 1 ? html`<div class="step-divider"></div>` : ''}
                `)}
            </div>
        `;
    }

    renderStep1() {
        const languages = [
            { code: 'fr', icon: '🇫🇷', title: 'Français', description: 'Interface en français' },
            { code: 'en', icon: '🇬🇧', title: 'English', description: 'English interface' },
            { code: 'es', icon: '🇪🇸', title: 'Español', description: 'Interfaz en español' },
            { code: 'de', icon: '🇩🇪', title: 'Deutsch', description: 'Deutsche Oberfläche' }
        ];

        return html`
            <div class="step-content">
                <div class="step-title">
                    <span class="step-icon">🌍</span>
                    <span>Choisissez votre langue</span>
                </div>
                <div class="step-description">
                    Sélectionnez la langue que vous souhaitez utiliser pour l'interface de Lucide.
                    Vous pourrez la changer plus tard dans les paramètres.
                </div>

                <div class="option-grid">
                    ${languages.map(lang => html`
                        <div
                            class="option-card ${this.selectedLanguage === lang.code ? 'selected' : ''}"
                            @click=${() => this.selectLanguage(lang.code)}
                        >
                            <div class="option-icon">${lang.icon}</div>
                            <div class="option-title">${lang.title}</div>
                            <div class="option-description">${lang.description}</div>
                        </div>
                    `)}
                </div>
            </div>
        `;
    }

    renderStep2() {
        const providers = [
            { id: 'claude', icon: '🧠', title: 'Claude', description: 'Anthropic - Conversations nuancées' },
            { id: 'openai', icon: '💡', title: 'ChatGPT', description: 'OpenAI - Rapide et polyvalent' },
            { id: 'gemini', icon: '🌟', title: 'Gemini', description: 'Google - Multimodal' },
            { id: 'ollama', icon: '🏠', title: 'Ollama', description: 'Local - Gratuit et privé' }
        ];

        return html`
            <div class="step-content">
                <div class="step-title">
                    <span>Choisissez votre IA principale</span>
                </div>
                <div class="step-description">
                    Sélectionnez le fournisseur d'IA que vous utiliserez par défaut. Vous pourrez
                    configurer plusieurs fournisseurs et basculer entre eux à tout moment.
                </div>

                <div class="option-grid">
                    ${providers.map(provider => html`
                        <div
                            class="option-card ${this.selectedAIProvider === provider.id ? 'selected' : ''}"
                            @click=${() => this.selectAIProvider(provider.id)}
                        >
                            <div class="option-icon">${provider.icon}</div>
                            <div class="option-title">${provider.title}</div>
                            <div class="option-description">${provider.description}</div>
                        </div>
                    `)}
                </div>
            </div>
        `;
    }

    renderStep3() {
        return html`
            <div class="step-content">
                <div class="step-title">
                    <span class="step-icon">🔑</span>
                    <span>Configurez vos clés API</span>
                </div>
                <div class="step-description">
                    Entrez les clés API pour les services que vous souhaitez utiliser. Ces clés
                    sont stockées de manière sécurisée localement.
                </div>

                ${this.selectedAIProvider === 'claude' ? html`
                    <div class="form-group">
                        <label class="form-label">Clé API Anthropic (Claude)</label>
                        <input
                            type="password"
                            class="form-input"
                            placeholder="sk-ant-..."
                            .value=${this.apiKeys.claude || ''}
                            @input=${(e) => this.updateApiKey('claude', e.target.value)}
                        />
                        <div class="form-hint">
                            Obtenez votre clé sur console.anthropic.com
                        </div>
                    </div>
                ` : ''}

                ${this.selectedAIProvider === 'openai' ? html`
                    <div class="form-group">
                        <label class="form-label">Clé API OpenAI</label>
                        <input
                            type="password"
                            class="form-input"
                            placeholder="sk-..."
                            .value=${this.apiKeys.openai || ''}
                            @input=${(e) => this.updateApiKey('openai', e.target.value)}
                        />
                        <div class="form-hint">
                            Obtenez votre clé sur platform.openai.com
                        </div>
                    </div>
                ` : ''}

                ${this.selectedAIProvider === 'gemini' ? html`
                    <div class="form-group">
                        <label class="form-label">Clé API Google Gemini</label>
                        <input
                            type="password"
                            class="form-input"
                            placeholder="AIza..."
                            .value=${this.apiKeys.gemini || ''}
                            @input=${(e) => this.updateApiKey('gemini', e.target.value)}
                        />
                        <div class="form-hint">
                            Obtenez votre clé sur makersuite.google.com/app/apikey
                        </div>
                    </div>
                ` : ''}

                <div class="form-group">
                    <label class="form-label">Clé API Deepgram (Transcription)</label>
                    <input
                        type="password"
                        class="form-input"
                        placeholder="..."
                        .value=${this.apiKeys.deepgram || ''}
                        @input=${(e) => this.updateApiKey('deepgram', e.target.value)}
                    />
                    <div class="form-hint">
                        Optionnel - Pour la transcription en temps réel
                    </div>
                </div>
            </div>
        `;
    }

    renderStep4() {
        const features = [
            {
                id: 'transcription',
                icon: '🎤',
                title: 'Transcription audio',
                description: 'Activer l\'enregistrement et la transcription en temps réel'
            },
            {
                id: 'screenshots',
                icon: '📸',
                title: 'Screenshots automatiques',
                description: 'Capturer automatiquement votre écran pour enrichir le contexte'
            },
            {
                id: 'sync',
                icon: '☁️',
                title: 'Synchronisation cloud',
                description: 'Sauvegarder vos données sur Supabase pour accès multi-appareils'
            },
            {
                id: 'localAI',
                icon: '🏠',
                title: 'IA locale (Ollama)',
                description: 'Télécharger et utiliser des modèles IA localement'
            }
        ];

        return html`
            <div class="step-content">
                <div class="step-title">
                    <span class="step-icon">✨</span>
                    <span>Activez les fonctionnalités</span>
                </div>
                <div class="step-description">
                    Choisissez les fonctionnalités que vous souhaitez activer. Vous pourrez
                    toutes les modifier plus tard dans les paramètres.
                </div>

                <div class="checkbox-group">
                    ${features.map(feature => html`
                        <div
                            class="checkbox-item ${this.features[feature.id] ? 'checked' : ''}"
                            @click=${() => this.toggleFeature(feature.id)}
                        >
                            <div class="checkbox ${this.features[feature.id] ? 'checked' : ''}">
                                ${this.features[feature.id] ? '✓' : ''}
                            </div>
                            <div class="checkbox-label">
                                <div class="checkbox-title">
                                    ${feature.icon} ${feature.title}
                                </div>
                                <div class="checkbox-description">
                                    ${feature.description}
                                </div>
                            </div>
                        </div>
                    `)}
                </div>
            </div>
        `;
    }

    renderSuccess() {
        return html`
            <div class="success-animation">
                <div class="success-icon">🎉</div>
                <div class="success-title">Configuration terminée !</div>
                <div class="success-description">
                    Lucide est maintenant configuré et prêt à l'emploi. Vous pouvez commencer
                    à utiliser toutes les fonctionnalités immédiatement.
                    <br><br>
                    Appuyez sur Cmd+Space (ou Ctrl+Space) pour activer Lucide à tout moment.
                </div>
            </div>
        `;
    }

    render() {
        if (this.isComplete) {
            return html`
                <div class="setup-container">
                    ${this.renderSuccess()}
                    <div class="footer">
                        <div></div>
                        <button class="btn btn-primary" @click=${() => window.location.href = '?view=listen'}>
                            Commencer à utiliser Lucide
                        </button>
                    </div>
                </div>
            `;
        }

        return html`
            <div class="setup-container">
                <div class="header">
                    <h1>🚀 Configuration de Lucide</h1>
                    <p>Configurez votre assistant IA en quelques étapes simples</p>
                </div>

                ${this.renderProgressBar()}

                <div class="content">
                    ${this.currentStep === 1 ? this.renderStep1() : ''}
                    ${this.currentStep === 2 ? this.renderStep2() : ''}
                    ${this.currentStep === 3 ? this.renderStep3() : ''}
                    ${this.currentStep === 4 ? this.renderStep4() : ''}
                </div>

                <div class="footer">
                    <button
                        class="btn btn-secondary"
                        @click=${this.previousStep}
                        ?disabled=${this.currentStep === 1}
                    >
                        Précédent
                    </button>
                    <button class="btn btn-primary" @click=${this.nextStep}>
                        ${this.currentStep === 4 ? 'Terminer' : 'Suivant'}
                    </button>
                </div>
            </div>
        `;
    }
}

customElements.define('setup-view', SetupView);
