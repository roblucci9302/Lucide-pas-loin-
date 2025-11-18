import { html, css, LitElement } from '../assets/lit-core-2.7.4.min.js';
import { TranslationMixin } from '../i18n/useTranslation.js';

export class MeetingReportViewer extends TranslationMixin(LitElement) {
    static styles = css`
        * {
            font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            cursor: default;
            user-select: text;
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

        .viewer-container {
            width: 95%;
            max-width: 1200px;
            height: 90vh;
            background: rgba(20, 20, 20, 0.98);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            display: flex;
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

        .sidebar {
            width: 280px;
            background: rgba(0, 0, 0, 0.3);
            border-right: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            flex-direction: column;
        }

        .sidebar-header {
            padding: 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .sidebar-title {
            font-size: 16px;
            font-weight: 600;
            color: white;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .reports-list {
            flex: 1;
            overflow-y: auto;
            padding: 12px;
        }

        .reports-list::-webkit-scrollbar {
            width: 6px;
        }

        .reports-list::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 3px;
        }

        .reports-list::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 3px;
        }

        .report-item {
            padding: 12px;
            margin-bottom: 8px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .report-item:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(255, 255, 255, 0.2);
            transform: translateX(4px);
        }

        .report-item.active {
            background: rgba(0, 122, 255, 0.2);
            border-color: rgba(0, 122, 255, 0.5);
        }

        .report-item-title {
            font-size: 13px;
            font-weight: 500;
            color: white;
            margin-bottom: 4px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .report-item-date {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.5);
        }

        .main-content {
            flex: 1;
            display: flex;
            flex-direction: column;
        }

        .header {
            padding: 20px 24px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 12px;
            flex: 1;
        }

        .report-title {
            font-size: 18px;
            font-weight: 600;
            color: white;
        }

        .header-actions {
            display: flex;
            gap: 8px;
        }

        .action-btn {
            padding: 8px 16px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            color: white;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .action-btn:hover {
            background: rgba(255, 255, 255, 0.15);
            transform: translateY(-1px);
        }

        .action-btn.primary {
            background: rgba(0, 122, 255, 0.8);
            border-color: rgba(0, 122, 255, 1);
        }

        .action-btn.primary:hover {
            background: rgba(0, 122, 255, 1);
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
            background: rgba(255, 255, 255, 0.02);
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

        .report-content {
            max-width: 800px;
            margin: 0 auto;
            color: rgba(255, 255, 255, 0.9);
            line-height: 1.6;
        }

        .report-content h1 {
            color: white;
            font-size: 28px;
            margin-bottom: 16px;
        }

        .report-content h2 {
            color: white;
            font-size: 22px;
            margin: 32px 0 16px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding-bottom: 8px;
        }

        .report-content h3 {
            color: rgba(255, 255, 255, 0.9);
            font-size: 18px;
            margin: 24px 0 12px;
        }

        .report-content p {
            margin-bottom: 16px;
        }

        .report-content ul, .report-content ol {
            margin: 12px 0;
            padding-left: 24px;
        }

        .report-content li {
            margin-bottom: 8px;
        }

        .report-content strong {
            color: white;
        }

        .report-content code {
            background: rgba(0, 0, 0, 0.3);
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'SF Mono', 'Menlo', monospace;
            font-size: 12px;
        }

        .report-content table {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;
        }

        .report-content table th {
            background: rgba(255, 255, 255, 0.1);
            padding: 10px;
            text-align: left;
            border: 1px solid rgba(255, 255, 255, 0.2);
            font-weight: 600;
        }

        .report-content table td {
            padding: 10px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .empty-state {
            text-align: center;
            padding: 64px 32px;
            color: rgba(255, 255, 255, 0.5);
        }

        .empty-icon {
            font-size: 64px;
            margin-bottom: 16px;
            opacity: 0.3;
        }

        .loading {
            text-align: center;
            padding: 32px;
            color: rgba(255, 255, 255, 0.6);
        }

        .metadata-bar {
            padding: 12px 24px;
            background: rgba(255, 255, 255, 0.05);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            gap: 20px;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
        }

        .metadata-item {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        /* Glass bypass */
        :host-context(body.has-glass) {
            backdrop-filter: none !important;
        }
    `;

    static properties = {
        open: { type: Boolean, reflect: true },
        reports: { type: Array, state: true },
        selectedReport: { type: Object, state: true },
        reportContent: { type: String, state: true },
        isLoading: { type: Boolean, state: true }
    };

    constructor() {
        super();
        this.open = false;
        this.reports = [];
        this.selectedReport = null;
        this.reportContent = '';
        this.isLoading = false;
    }

    async openModal() {
        this.open = true;
        await this.loadReports();
    }

    closeModal() {
        this.open = false;
        this.selectedReport = null;
        this.reportContent = '';
    }

    async loadReports() {
        if (!window.api || !window.api.meetingReports) {
            this.reports = this.getMockReports();
            return;
        }

        try {
            this.isLoading = true;
            const reportsData = await window.api.meetingReports.getAllReports();
            this.reports = reportsData || [];
            this.isLoading = false;

            // Auto-select first report if available
            if (this.reports.length > 0 && !this.selectedReport) {
                this.selectReport(this.reports[0]);
            }
        } catch (error) {
            console.error('[MeetingReportViewer] Error loading reports:', error);
            this.reports = this.getMockReports();
            this.isLoading = false;
        }
    }

    getMockReports() {
        return [
            {
                id: 'report_1',
                title: 'Réunion d\'équipe - Sprint Planning',
                date: Date.now() - 86400000,
                transcriptionId: 'trans_1',
                format: 'markdown'
            },
            {
                id: 'report_2',
                title: 'Appel client - Présentation produit',
                date: Date.now() - 172800000,
                transcriptionId: 'trans_2',
                format: 'markdown'
            }
        ];
    }

    async selectReport(report) {
        this.selectedReport = report;
        this.isLoading = true;

        if (window.api && window.api.meetingReports) {
            try {
                const content = await window.api.meetingReports.getReportContent(report.id);
                this.reportContent = content;
            } catch (error) {
                console.error('[MeetingReportViewer] Error loading report content:', error);
                this.reportContent = this.getMockReportContent(report);
            }
        } else {
            this.reportContent = this.getMockReportContent(report);
        }

        this.isLoading = false;
    }

    getMockReportContent(report) {
        return `# ${report.title}

**Date:** ${new Date(report.date).toLocaleDateString('fr-FR')}
**Durée:** 45 minutes
**Participants:** Alice, Bob, Charlie

## Résumé exécutif

Cette réunion avait pour objectif de planifier le prochain sprint et d'aligner l'équipe sur les priorités. Les participants ont discuté des fonctionnalités à développer et ont défini les objectifs du sprint.

## Points clés

- Validation des user stories pour le sprint 12
- Allocation des ressources sur les tâches prioritaires
- Définition des critères de succès
- Planning des revues quotidiennes

## Décisions prises

| Décision | Responsable | Justification | Impact |
|----------|-------------|---------------|--------|
| Prioriser la feature A | Alice | Demande urgente du client | Livraison semaine prochaine |
| Reporter la feature B | Bob | Dépendances non résolues | Sprint 13 |

## Actions à réaliser

| # | Action | Assigné à | Deadline | Priorité | Statut |
|---|--------|-----------|----------|----------|--------|
| 1 | Finaliser les maquettes UI | Alice | 22/11 | Haute | En cours |
| 2 | Configurer l'environnement de test | Bob | 24/11 | Moyenne | À faire |
| 3 | Rédiger la documentation API | Charlie | 25/11 | Moyenne | À faire |

## Prochaines étapes

- Daily standup chaque jour à 9h30
- Demo client prévue vendredi 24/11
- Rétrospective de sprint le 29/11

## Notes additionnelles

L'équipe a souligné l'importance d'améliorer la communication inter-équipes. Un point dédié sera ajouté aux prochaines réunions.

---

*Compte-rendu généré par Lucide AI Assistant*`;
    }

    async handleExport(format) {
        if (!this.selectedReport) return;

        if (window.api && window.api.meetingReports) {
            try {
                const result = await window.api.meetingReports.exportReport(
                    this.selectedReport.id,
                    format
                );

                if (result.success) {
                    alert(`Rapport exporté avec succès : ${result.filePath}`);
                }
            } catch (error) {
                console.error('[MeetingReportViewer] Error exporting report:', error);
                alert('Erreur lors de l\'export du rapport');
            }
        } else {
            alert(`Export ${format} (fonctionnalité simulée)`);
        }
    }

    renderMarkdown(content) {
        // Simple markdown rendering (you might want to use marked.js in production)
        if (!content) return '';

        // For now, wrap in div - in production use marked library
        return html`<div class="report-content" .innerHTML=${this.parseMarkdown(content)}></div>`;
    }

    parseMarkdown(md) {
        if (window.marked) {
            return window.marked.parse(md);
        }

        // Fallback: very basic markdown parsing
        let html = md;

        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

        // Bold
        html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');

        // Lists
        html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');

        // Line breaks
        html = html.replace(/\n/gim, '<br>');

        return html;
    }

    formatDate(timestamp) {
        return new Date(timestamp).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    render() {
        if (!this.open) return '';

        return html`
            <div class="viewer-container" @click=${(e) => e.stopPropagation()}>
                <div class="sidebar">
                    <div class="sidebar-header">
                        <div class="sidebar-title">
                            <span>📄</span>
                            <span>Rapports de réunion</span>
                        </div>
                    </div>
                    <div class="reports-list">
                        ${this.isLoading && this.reports.length === 0 ? html`
                            <div class="loading">Chargement...</div>
                        ` : this.reports.length === 0 ? html`
                            <div class="empty-state">
                                <div class="empty-icon">📋</div>
                                <div>Aucun rapport disponible</div>
                            </div>
                        ` : this.reports.map(report => html`
                            <div
                                class="report-item ${this.selectedReport?.id === report.id ? 'active' : ''}"
                                @click=${() => this.selectReport(report)}
                            >
                                <div class="report-item-title">${report.title}</div>
                                <div class="report-item-date">${this.formatDate(report.date)}</div>
                            </div>
                        `)}
                    </div>
                </div>

                <div class="main-content">
                    <div class="header">
                        <div class="header-left">
                            <div class="report-title">
                                ${this.selectedReport ? this.selectedReport.title : 'Sélectionnez un rapport'}
                            </div>
                        </div>
                        <div class="header-actions">
                            ${this.selectedReport ? html`
                                <button class="action-btn" @click=${() => this.handleExport('pdf')}>
                                    📄 PDF
                                </button>
                                <button class="action-btn" @click=${() => this.handleExport('docx')}>
                                    📘 DOCX
                                </button>
                                <button class="action-btn" @click=${() => this.handleExport('markdown')}>
                                    📝 Markdown
                                </button>
                            ` : ''}
                            <button class="close-btn" @click=${this.closeModal} title="Fermer">
                                ✕
                            </button>
                        </div>
                    </div>

                    ${this.selectedReport ? html`
                        <div class="metadata-bar">
                            <div class="metadata-item">
                                <span>📅</span>
                                <span>${this.formatDate(this.selectedReport.date)}</span>
                            </div>
                            <div class="metadata-item">
                                <span>📊</span>
                                <span>${this.selectedReport.format.toUpperCase()}</span>
                            </div>
                        </div>
                    ` : ''}

                    <div class="content">
                        ${this.isLoading ? html`
                            <div class="loading">Chargement du rapport...</div>
                        ` : this.selectedReport && this.reportContent ?
                            this.renderMarkdown(this.reportContent)
                        : html`
                            <div class="empty-state">
                                <div class="empty-icon">📄</div>
                                <div>Sélectionnez un rapport pour le visualiser</div>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('meeting-report-viewer', MeetingReportViewer);
