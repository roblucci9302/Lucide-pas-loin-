import { html, css, LitElement } from '../assets/lit-core-2.7.4.min.js';
import { TranslationMixin } from '../i18n/useTranslation.js';

export class DataExportManager extends TranslationMixin(LitElement) {
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

        .manager-container {
            width: 90%;
            max-width: 800px;
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

        .section {
            margin-bottom: 32px;
        }

        .section-title {
            font-size: 16px;
            font-weight: 600;
            color: white;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .section-description {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.6);
            margin-bottom: 16px;
            line-height: 1.5;
        }

        .export-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 12px;
        }

        .export-card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 16px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .export-card:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(0, 122, 255, 0.4);
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0, 122, 255, 0.2);
        }

        .export-card.disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .export-card.disabled:hover {
            transform: none;
            box-shadow: none;
        }

        .export-icon {
            font-size: 32px;
            margin-bottom: 8px;
        }

        .export-title {
            font-size: 14px;
            font-weight: 600;
            color: white;
            margin-bottom: 4px;
        }

        .export-subtitle {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.5);
        }

        .format-selector {
            margin-top: 24px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 16px;
        }

        .format-title {
            font-size: 14px;
            font-weight: 500;
            color: white;
            margin-bottom: 12px;
        }

        .format-options {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }

        .format-option {
            padding: 8px 16px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            color: rgba(255, 255, 255, 0.7);
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .format-option:hover {
            background: rgba(255, 255, 255, 0.1);
            color: white;
        }

        .format-option.selected {
            background: rgba(0, 122, 255, 0.3);
            border-color: rgba(0, 122, 255, 0.6);
            color: white;
        }

        .date-range {
            margin-top: 16px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }

        .date-input {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .date-label {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.7);
            font-weight: 500;
        }

        .date-field {
            padding: 8px 12px;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            color: white;
            font-size: 13px;
            outline: none;
        }

        .date-field:focus {
            background: rgba(255, 255, 255, 0.12);
            border-color: rgba(0, 122, 255, 0.5);
        }

        .footer {
            padding: 16px 24px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
        }

        .footer-info {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
        }

        .footer-actions {
            display: flex;
            gap: 8px;
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

        .progress-bar {
            margin-top: 16px;
            height: 4px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 2px;
            overflow: hidden;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #3b82f6, #8b5cf6);
            transition: width 0.3s ease;
        }

        .export-status {
            margin-top: 12px;
            padding: 12px;
            background: rgba(0, 122, 255, 0.1);
            border: 1px solid rgba(0, 122, 255, 0.3);
            border-radius: 6px;
            font-size: 12px;
            color: rgba(100, 180, 255, 0.9);
        }

        .export-status.success {
            background: rgba(34, 197, 94, 0.1);
            border-color: rgba(34, 197, 94, 0.3);
            color: rgba(100, 255, 150, 0.9);
        }

        .export-status.error {
            background: rgba(239, 68, 68, 0.1);
            border-color: rgba(239, 68, 68, 0.3);
            color: rgba(255, 100, 100, 0.9);
        }

        /* Glass bypass */
        :host-context(body.has-glass) {
            backdrop-filter: none !important;
        }
    `;

    static properties = {
        open: { type: Boolean, reflect: true },
        selectedDataType: { type: String, state: true },
        selectedFormat: { type: String, state: true },
        dateRange: { type: Object, state: true },
        isExporting: { type: Boolean, state: true },
        exportProgress: { type: Number, state: true },
        exportStatus: { type: Object, state: true }
    };

    constructor() {
        super();
        this.open = false;
        this.selectedDataType = null;
        this.selectedFormat = 'json';
        this.dateRange = {
            start: null,
            end: null
        };
        this.isExporting = false;
        this.exportProgress = 0;
        this.exportStatus = null;
    }

    openModal() {
        this.open = true;
        this.resetState();
    }

    closeModal() {
        this.open = false;
        this.resetState();
    }

    resetState() {
        this.selectedDataType = null;
        this.selectedFormat = 'json';
        this.dateRange = { start: null, end: null };
        this.isExporting = false;
        this.exportProgress = 0;
        this.exportStatus = null;
    }

    selectDataType(type) {
        this.selectedDataType = type;
        this.exportStatus = null;
    }

    selectFormat(format) {
        this.selectedFormat = format;
    }

    updateDateRange(field, value) {
        this.dateRange = { ...this.dateRange, [field]: value };
    }

    async handleExport() {
        if (!this.selectedDataType) return;

        this.isExporting = true;
        this.exportProgress = 0;
        this.exportStatus = { type: 'info', message: 'Préparation de l\'export...' };

        try {
            // Simulate progress
            const progressInterval = setInterval(() => {
                if (this.exportProgress < 90) {
                    this.exportProgress += 10;
                }
            }, 200);

            let result;
            if (window.api && window.api.export) {
                result = await window.api.export.exportData({
                    dataType: this.selectedDataType,
                    format: this.selectedFormat,
                    dateRange: this.dateRange
                });
            } else {
                // Simulate export
                await new Promise(resolve => setTimeout(resolve, 2000));
                result = {
                    success: true,
                    filePath: `/exports/${this.selectedDataType}_${Date.now()}.${this.selectedFormat}`,
                    size: 1024 * 512
                };
            }

            clearInterval(progressInterval);
            this.exportProgress = 100;

            if (result.success) {
                this.exportStatus = {
                    type: 'success',
                    message: `Export réussi ! Fichier sauvegardé : ${result.filePath}`
                };
            } else {
                throw new Error(result.error || 'Export failed');
            }

            // Dispatch success event
            this.dispatchEvent(new CustomEvent('export-complete', {
                detail: { result },
                bubbles: true,
                composed: true
            }));

        } catch (error) {
            console.error('[DataExportManager] Export error:', error);
            this.exportStatus = {
                type: 'error',
                message: `Erreur lors de l'export : ${error.message}`
            };
        } finally {
            this.isExporting = false;
        }
    }

    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    render() {
        if (!this.open) return '';

        const dataTypes = [
            { id: 'conversations', icon: '💬', title: 'Conversations', subtitle: 'Toutes vos discussions' },
            { id: 'transcriptions', icon: '🎤', title: 'Transcriptions', subtitle: 'Audio & texte' },
            { id: 'documents', icon: '📄', title: 'Documents', subtitle: 'Base de connaissances' },
            { id: 'meeting_reports', icon: '📊', title: 'Rapports', subtitle: 'Comptes-rendus' },
            { id: 'settings', icon: '⚙️', title: 'Paramètres', subtitle: 'Configuration' },
            { id: 'full_backup', icon: '💾', title: 'Sauvegarde complète', subtitle: 'Toutes les données' }
        ];

        const formats = [
            { id: 'json', label: 'JSON', icon: '📋' },
            { id: 'csv', label: 'CSV', icon: '📊' },
            { id: 'markdown', label: 'Markdown', icon: '📝' },
            { id: 'pdf', label: 'PDF', icon: '📄' },
            { id: 'zip', label: 'ZIP', icon: '📦' }
        ];

        return html`
            <div class="manager-container" @click=${(e) => e.stopPropagation()}>
                <div class="header">
                    <div class="header-title">
                        <span>📤</span>
                        <span>Export de données</span>
                    </div>
                    <button class="close-btn" @click=${this.closeModal} title="Fermer">
                        ✕
                    </button>
                </div>

                <div class="content">
                    <div class="section">
                        <div class="section-title">
                            <span>📁</span>
                            <span>Sélectionnez les données à exporter</span>
                        </div>
                        <div class="section-description">
                            Choisissez le type de données que vous souhaitez exporter depuis Lucide.
                        </div>

                        <div class="export-grid">
                            ${dataTypes.map(type => html`
                                <div
                                    class="export-card ${this.selectedDataType === type.id ? 'selected' : ''}"
                                    @click=${() => this.selectDataType(type.id)}
                                >
                                    <div class="export-icon">${type.icon}</div>
                                    <div class="export-title">${type.title}</div>
                                    <div class="export-subtitle">${type.subtitle}</div>
                                </div>
                            `)}
                        </div>
                    </div>

                    ${this.selectedDataType ? html`
                        <div class="format-selector">
                            <div class="format-title">Format d'export</div>
                            <div class="format-options">
                                ${formats.map(format => html`
                                    <button
                                        class="format-option ${this.selectedFormat === format.id ? 'selected' : ''}"
                                        @click=${() => this.selectFormat(format.id)}
                                    >
                                        ${format.icon} ${format.label}
                                    </button>
                                `)}
                            </div>

                            <div class="date-range">
                                <div class="date-input">
                                    <label class="date-label">Date de début</label>
                                    <input
                                        type="date"
                                        class="date-field"
                                        .value=${this.dateRange.start || ''}
                                        @change=${(e) => this.updateDateRange('start', e.target.value)}
                                    />
                                </div>
                                <div class="date-input">
                                    <label class="date-label">Date de fin</label>
                                    <input
                                        type="date"
                                        class="date-field"
                                        .value=${this.dateRange.end || ''}
                                        @change=${(e) => this.updateDateRange('end', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        ${this.isExporting ? html`
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${this.exportProgress}%"></div>
                            </div>
                        ` : ''}

                        ${this.exportStatus ? html`
                            <div class="export-status ${this.exportStatus.type}">
                                ${this.exportStatus.message}
                            </div>
                        ` : ''}
                    ` : ''}
                </div>

                <div class="footer">
                    <div class="footer-info">
                        ${this.selectedDataType ? `Exporter en ${this.selectedFormat.toUpperCase()}` : 'Sélectionnez un type de données'}
                    </div>
                    <div class="footer-actions">
                        <button class="btn btn-secondary" @click=${this.closeModal}>
                            Annuler
                        </button>
                        <button
                            class="btn btn-primary"
                            @click=${this.handleExport}
                            ?disabled=${!this.selectedDataType || this.isExporting}
                        >
                            ${this.isExporting ? '⏳ Export en cours...' : '📤 Exporter'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('data-export-manager', DataExportManager);
