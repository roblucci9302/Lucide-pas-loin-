import { html, css, LitElement } from '../assets/lit-core-2.7.4.min.js';
import { TranslationMixin } from '../i18n/useTranslation.js';

export class ModelStatusIndicator extends TranslationMixin(LitElement) {
    static styles = css`
        * {
            font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            cursor: default;
            user-select: none;
            box-sizing: border-box;
        }

        :host {
            display: block;
        }

        .status-container {
            position: fixed;
            bottom: 16px;
            right: 16px;
            background: rgba(20, 20, 20, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 10px;
            padding: 12px 16px;
            min-width: 250px;
            max-width: 350px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            z-index: 1000;
            backdrop-filter: blur(20px);
        }

        .status-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }

        .status-title {
            font-size: 12px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.9);
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .close-btn {
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.5);
            font-size: 16px;
            cursor: pointer;
            padding: 0;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            transition: all 0.2s;
        }

        .close-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.9);
        }

        .model-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .model-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 10px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 6px;
            transition: all 0.2s;
        }

        .model-item:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(255, 255, 255, 0.15);
        }

        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            flex-shrink: 0;
        }

        .status-dot.active {
            background: #22c55e;
            box-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
            animation: pulse 2s infinite;
        }

        .status-dot.inactive {
            background: rgba(255, 255, 255, 0.2);
        }

        .status-dot.downloading {
            background: #f59e0b;
            box-shadow: 0 0 8px rgba(245, 158, 11, 0.6);
            animation: pulse 1s infinite;
        }

        .status-dot.error {
            background: #ef4444;
            box-shadow: 0 0 8px rgba(239, 68, 68, 0.6);
        }

        @keyframes pulse {
            0%, 100% {
                opacity: 1;
            }
            50% {
                opacity: 0.5;
            }
        }

        .model-info {
            flex: 1;
            min-width: 0;
        }

        .model-name {
            font-size: 12px;
            font-weight: 500;
            color: white;
            margin-bottom: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .model-status {
            font-size: 10px;
            color: rgba(255, 255, 255, 0.6);
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .progress-bar {
            width: 100%;
            height: 3px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 2px;
            overflow: hidden;
            margin-top: 4px;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #3b82f6, #8b5cf6);
            border-radius: 2px;
            transition: width 0.3s ease;
        }

        .toggle-button {
            position: fixed;
            bottom: 16px;
            right: 16px;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: rgba(20, 20, 20, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
            z-index: 999;
            backdrop-filter: blur(20px);
        }

        .toggle-button:hover {
            transform: scale(1.05);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
            background: rgba(30, 30, 30, 0.95);
        }

        .toggle-icon {
            font-size: 20px;
        }

        .badge {
            position: absolute;
            top: -4px;
            right: -4px;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #22c55e;
            color: white;
            font-size: 10px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid rgba(20, 20, 20, 1);
        }

        .badge.downloading {
            background: #f59e0b;
            animation: pulse 1s infinite;
        }

        .empty-state {
            text-align: center;
            padding: 16px;
            color: rgba(255, 255, 255, 0.5);
            font-size: 11px;
        }

        .action-buttons {
            display: flex;
            gap: 6px;
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .action-btn {
            flex: 1;
            padding: 6px 12px;
            background: rgba(0, 122, 255, 0.15);
            border: 1px solid rgba(0, 122, 255, 0.3);
            border-radius: 5px;
            color: rgba(100, 180, 255, 0.9);
            font-size: 11px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
        }

        .action-btn:hover {
            background: rgba(0, 122, 255, 0.25);
            border-color: rgba(0, 122, 255, 0.5);
            transform: translateY(-1px);
        }

        /* Glass bypass */
        :host-context(body.has-glass) {
            animation: none !important;
            transition: none !important;
        }
        :host-context(body.has-glass) * {
            filter: none !important;
            backdrop-filter: none !important;
        }
    `;

    static properties = {
        isExpanded: { type: Boolean, state: true },
        models: { type: Array, state: true },
        isLoading: { type: Boolean, state: true }
    };

    constructor() {
        super();
        this.isExpanded = false;
        this.models = [];
        this.isLoading = true;
        this.refreshInterval = null;
    }

    connectedCallback() {
        super.connectedCallback();
        this.loadModelStatus();

        // Refresh status every 10 seconds
        this.refreshInterval = setInterval(() => {
            if (!this.isLoading) {
                this.loadModelStatus();
            }
        }, 10000);

        // Listen for model status updates
        if (window.api && window.api.models) {
            window.api.models.onStatusUpdate((_, status) => {
                this.updateModelStatus(status);
            });
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        if (window.api && window.api.models) {
            window.api.models.removeAllStatusListeners();
        }
    }

    async loadModelStatus() {
        if (!window.api || !window.api.models) {
            this.isLoading = false;
            this.models = this.getMockModels();
            return;
        }

        try {
            const status = await window.api.models.getStatus();
            this.models = this.parseModelStatus(status);
            this.isLoading = false;
        } catch (error) {
            console.error('[ModelStatusIndicator] Error loading models:', error);
            this.models = this.getMockModels();
            this.isLoading = false;
        }
    }

    parseModelStatus(status) {
        const models = [];

        // Ollama models
        if (status.ollama && status.ollama.models) {
            status.ollama.models.forEach(model => {
                models.push({
                    name: model.name,
                    type: 'ollama',
                    status: model.loaded ? 'active' : 'inactive',
                    details: model.loaded ? 'Chargé' : 'Disponible'
                });
            });
        }

        // Whisper models
        if (status.whisper) {
            models.push({
                name: 'Whisper',
                type: 'whisper',
                status: status.whisper.installed ? 'active' : 'inactive',
                details: status.whisper.installed ? 'Installé' : 'Non installé'
            });
        }

        // Cloud models
        if (status.claude) {
            models.push({
                name: 'Claude',
                type: 'cloud',
                status: status.claude.configured ? 'active' : 'inactive',
                details: status.claude.configured ? 'Configuré' : 'Non configuré'
            });
        }

        if (status.openai) {
            models.push({
                name: 'ChatGPT',
                type: 'cloud',
                status: status.openai.configured ? 'active' : 'inactive',
                details: status.openai.configured ? 'Configuré' : 'Non configuré'
            });
        }

        if (status.gemini) {
            models.push({
                name: 'Gemini',
                type: 'cloud',
                status: status.gemini.configured ? 'active' : 'inactive',
                details: status.gemini.configured ? 'Configuré' : 'Non configuré'
            });
        }

        return models;
    }

    getMockModels() {
        // Fallback mock data when API is not available
        return [
            { name: 'Claude Sonnet', type: 'cloud', status: 'active', details: 'Configuré' },
            { name: 'ChatGPT 4', type: 'cloud', status: 'inactive', details: 'Non configuré' },
            { name: 'Ollama Llama3', type: 'ollama', status: 'inactive', details: 'Non chargé' },
            { name: 'Whisper Large', type: 'whisper', status: 'active', details: 'Installé' }
        ];
    }

    updateModelStatus(status) {
        const modelIndex = this.models.findIndex(m =>
            m.name === status.modelName || m.type === status.type
        );

        if (modelIndex >= 0) {
            const updatedModels = [...this.models];
            updatedModels[modelIndex] = {
                ...updatedModels[modelIndex],
                status: status.status,
                details: status.details,
                progress: status.progress
            };
            this.models = updatedModels;
        }
    }

    toggleExpand() {
        this.isExpanded = !this.isExpanded;
    }

    getActiveCount() {
        return this.models.filter(m => m.status === 'active').length;
    }

    getDownloadingCount() {
        return this.models.filter(m => m.status === 'downloading').length;
    }

    async handleRefresh() {
        this.isLoading = true;
        await this.loadModelStatus();
    }

    handleManageModels() {
        // Navigate to settings
        if (window.api && window.api.navigation) {
            window.api.navigation.goToSettings('models');
        } else {
            window.location.href = '?view=settings&tab=models';
        }
    }

    getStatusIcon(status) {
        switch (status) {
            case 'active':
                return '✓';
            case 'downloading':
                return '↓';
            case 'error':
                return '!';
            default:
                return '○';
        }
    }

    render() {
        if (!this.isExpanded) {
            const activeCount = this.getActiveCount();
            const downloadingCount = this.getDownloadingCount();

            return html`
                <div class="toggle-button" @click=${this.toggleExpand} title="Statut des modèles IA">
                    <span class="toggle-icon">🤖</span>
                    ${activeCount > 0 ? html`
                        <span class="badge ${downloadingCount > 0 ? 'downloading' : ''}">${activeCount}</span>
                    ` : ''}
                </div>
            `;
        }

        return html`
            <div class="status-container">
                <div class="status-header">
                    <div class="status-title">
                        <span>🤖</span>
                        <span>Statut des modèles IA</span>
                    </div>
                    <button class="close-btn" @click=${this.toggleExpand} title="Fermer">
                        ✕
                    </button>
                </div>

                ${this.isLoading ? html`
                    <div class="empty-state">Chargement...</div>
                ` : this.models.length === 0 ? html`
                    <div class="empty-state">Aucun modèle détecté</div>
                ` : html`
                    <div class="model-list">
                        ${this.models.map(model => html`
                            <div class="model-item">
                                <span class="status-dot ${model.status}"></span>
                                <div class="model-info">
                                    <div class="model-name">${model.name}</div>
                                    <div class="model-status">
                                        <span>${this.getStatusIcon(model.status)}</span>
                                        <span>${model.details}</span>
                                    </div>
                                    ${model.status === 'downloading' && model.progress !== undefined ? html`
                                        <div class="progress-bar">
                                            <div class="progress-fill" style="width: ${model.progress}%"></div>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        `)}
                    </div>
                `}

                <div class="action-buttons">
                    <button class="action-btn" @click=${this.handleRefresh} ?disabled=${this.isLoading}>
                        🔄 Actualiser
                    </button>
                    <button class="action-btn" @click=${this.handleManageModels}>
                        ⚙️ Gérer
                    </button>
                </div>
            </div>
        `;
    }
}

customElements.define('model-status-indicator', ModelStatusIndicator);
