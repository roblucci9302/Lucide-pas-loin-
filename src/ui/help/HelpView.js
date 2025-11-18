import { html, css, LitElement } from '../assets/lit-core-2.7.4.min.js';
import { TranslationMixin } from '../i18n/useTranslation.js';

export class HelpView extends TranslationMixin(LitElement) {
    static styles = css`
        * {
            font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            cursor: default;
            user-select: text;
            box-sizing: border-box;
        }

        :host {
            display: block;
            width: 100%;
            height: 100%;
            color: white;
        }

        .help-container {
            display: flex;
            height: 100%;
            background: rgba(20, 20, 20, 0.9);
            border-radius: 12px;
            outline: 0.5px rgba(255, 255, 255, 0.2) solid;
            outline-offset: -1px;
            overflow: hidden;
        }

        .sidebar {
            width: 220px;
            background: rgba(0, 0, 0, 0.3);
            border-right: 1px solid rgba(255, 255, 255, 0.1);
            overflow-y: auto;
            padding: 16px 8px;
        }

        .sidebar::-webkit-scrollbar {
            width: 6px;
        }

        .sidebar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 3px;
        }

        .sidebar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 3px;
        }

        .nav-section {
            margin-bottom: 16px;
        }

        .nav-title {
            font-size: 10px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.5);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
            padding: 0 8px;
        }

        .nav-item {
            padding: 8px 12px;
            margin-bottom: 4px;
            border-radius: 6px;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.7);
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .nav-item:hover {
            background: rgba(255, 255, 255, 0.05);
            color: rgba(255, 255, 255, 0.9);
        }

        .nav-item.active {
            background: rgba(0, 122, 255, 0.2);
            color: white;
            border-left: 2px solid rgba(0, 122, 255, 0.8);
        }

        .content {
            flex: 1;
            overflow-y: auto;
            padding: 32px;
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
            margin-bottom: 48px;
        }

        .section-title {
            font-size: 24px;
            font-weight: 600;
            color: white;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .section-icon {
            font-size: 32px;
        }

        .section-description {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.7);
            line-height: 1.6;
            margin-bottom: 24px;
        }

        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 16px;
            margin-top: 16px;
        }

        .feature-card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 16px;
            transition: all 0.2s;
        }

        .feature-card:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(255, 255, 255, 0.2);
            transform: translateY(-2px);
        }

        .feature-title {
            font-size: 14px;
            font-weight: 500;
            color: white;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .feature-description {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
            line-height: 1.5;
        }

        .shortcut-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .shortcut-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            margin-bottom: 8px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 6px;
        }

        .shortcut-label {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.8);
        }

        .shortcut-keys {
            display: flex;
            gap: 4px;
        }

        .key {
            padding: 4px 8px;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            font-size: 11px;
            font-family: 'SF Mono', 'Menlo', monospace;
            color: rgba(255, 255, 255, 0.9);
        }

        .tip-box {
            background: rgba(0, 122, 255, 0.1);
            border: 1px solid rgba(0, 122, 255, 0.3);
            border-radius: 8px;
            padding: 16px;
            margin-top: 16px;
        }

        .tip-title {
            font-size: 13px;
            font-weight: 600;
            color: rgba(0, 122, 255, 1);
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .tip-content {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.7);
            line-height: 1.5;
        }

        .header-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 32px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .header-title {
            font-size: 18px;
            font-weight: 600;
            color: white;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .search-box {
            flex: 1;
            max-width: 300px;
            margin-left: 24px;
        }

        .search-input {
            width: 100%;
            padding: 8px 12px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            color: white;
            font-size: 12px;
            outline: none;
        }

        .search-input::placeholder {
            color: rgba(255, 255, 255, 0.4);
        }

        .search-input:focus {
            background: rgba(255, 255, 255, 0.15);
            border-color: rgba(0, 122, 255, 0.5);
        }

        .code-block {
            background: rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 6px;
            padding: 12px 16px;
            margin: 12px 0;
            font-family: 'SF Mono', 'Menlo', monospace;
            font-size: 12px;
            color: rgba(0, 255, 0, 0.8);
            overflow-x: auto;
        }

        .warning-box {
            background: rgba(255, 159, 10, 0.1);
            border: 1px solid rgba(255, 159, 10, 0.3);
            border-radius: 8px;
            padding: 16px;
            margin-top: 16px;
        }

        .warning-title {
            font-size: 13px;
            font-weight: 600;
            color: rgba(255, 159, 10, 1);
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .warning-content {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.7);
            line-height: 1.5;
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
        activeSection: { type: String, state: true },
        searchQuery: { type: String, state: true }
    };

    constructor() {
        super();
        this.activeSection = 'overview';
        this.searchQuery = '';
    }

    setActiveSection(section) {
        this.activeSection = section;
        // Scroll to top when changing sections
        const content = this.shadowRoot.querySelector('.content');
        if (content) content.scrollTop = 0;
    }

    renderNavigation() {
        const sections = [
            { id: 'overview', icon: '🏠', label: 'Vue d\'ensemble' },
            { id: 'listen', icon: '🎤', label: 'Écoute & Transcription' },
            { id: 'ask', icon: '💬', label: 'Question & Réponse' },
            { id: 'documents', icon: '📄', label: 'Documents' },
            { id: 'history', icon: '📚', label: 'Historique' },
            { id: 'settings', icon: '⚙️', label: 'Paramètres' },
            { id: 'shortcuts', icon: '⌨️', label: 'Raccourcis clavier' },
            { id: 'export', icon: '📤', label: 'Export de données' },
            { id: 'ai-models', icon: '🤖', label: 'Modèles IA' },
            { id: 'troubleshooting', icon: '🔧', label: 'Dépannage' }
        ];

        return html`
            <div class="nav-section">
                <div class="nav-title">Documentation</div>
                ${sections.map(section => html`
                    <div
                        class="nav-item ${this.activeSection === section.id ? 'active' : ''}"
                        @click=${() => this.setActiveSection(section.id)}
                    >
                        <span>${section.icon}</span>
                        <span>${section.label}</span>
                    </div>
                `)}
            </div>
        `;
    }

    renderOverview() {
        return html`
            <div class="section">
                <div class="section-title">
                    <span class="section-icon">🏠</span>
                    <span>Bienvenue dans Lucide</span>
                </div>
                <div class="section-description">
                    Lucide est votre assistant IA personnel qui combine transcription audio en temps réel,
                    recherche sémantique, et génération de documents intelligents.
                </div>

                <div class="feature-grid">
                    <div class="feature-card">
                        <div class="feature-title">🎤 Transcription en temps réel</div>
                        <div class="feature-description">
                            Capturez vos pensées, réunions et notes vocales avec une transcription
                            instantanée et précise.
                        </div>
                    </div>
                    <div class="feature-card">
                        <div class="feature-title">💬 Questions intelligentes</div>
                        <div class="feature-description">
                            Posez des questions sur vos conversations et documents avec la puissance
                            du RAG (Retrieval-Augmented Generation).
                        </div>
                    </div>
                    <div class="feature-card">
                        <div class="feature-title">📄 Génération de documents</div>
                        <div class="feature-description">
                            Créez des documents structurés illimités avec validation automatique
                            et génération par chunks.
                        </div>
                    </div>
                    <div class="feature-card">
                        <div class="feature-title">📚 Historique complet</div>
                        <div class="feature-description">
                            Toutes vos conversations sont sauvegardées et recherchables avec
                            export en multiples formats.
                        </div>
                    </div>
                    <div class="feature-card">
                        <div class="feature-title">🤖 Multiples modèles IA</div>
                        <div class="feature-description">
                            Support de Claude, ChatGPT, Gemini, et Ollama pour une flexibilité
                            maximale.
                        </div>
                    </div>
                    <div class="feature-card">
                        <div class="feature-title">🔒 Sécurité & Confidentialité</div>
                        <div class="feature-description">
                            Vos données restent locales avec chiffrement optionnel et sync sécurisée.
                        </div>
                    </div>
                </div>

                <div class="tip-box">
                    <div class="tip-title">💡 Conseil de démarrage</div>
                    <div class="tip-content">
                        Commencez par configurer vos clés API dans les Paramètres, puis essayez
                        la transcription en temps réel dans la vue Écoute. Utilisez Cmd+Space
                        (ou Ctrl+Space) pour activer rapidement l'application.
                    </div>
                </div>
            </div>
        `;
    }

    renderListenSection() {
        return html`
            <div class="section">
                <div class="section-title">
                    <span class="section-icon">🎤</span>
                    <span>Écoute & Transcription</span>
                </div>
                <div class="section-description">
                    La vue Écoute vous permet d'enregistrer de l'audio et de le transcrire en temps
                    réel avec des IA avancées comme Whisper et Deepgram.
                </div>

                <h3 style="color: white; font-size: 16px; margin: 24px 0 12px;">Fonctionnalités principales</h3>
                <div class="feature-grid">
                    <div class="feature-card">
                        <div class="feature-title">🔴 Enregistrement audio</div>
                        <div class="feature-description">
                            Cliquez sur le bouton microphone pour commencer l'enregistrement.
                            L'audio est capturé localement avec qualité optimale.
                        </div>
                    </div>
                    <div class="feature-card">
                        <div class="feature-title">⚡ Transcription instantanée</div>
                        <div class="feature-description">
                            Le texte apparaît en temps réel pendant que vous parlez, avec support
                            de multiples langues.
                        </div>
                    </div>
                    <div class="feature-card">
                        <div class="feature-title">🎯 Profils spécialisés</div>
                        <div class="feature-description">
                            Choisissez un agent spécialisé (RH, IT, Marketing) pour des réponses
                            contextuelles adaptées.
                        </div>
                    </div>
                    <div class="feature-card">
                        <div class="feature-title">📸 Screenshots automatiques</div>
                        <div class="feature-description">
                            Capturez automatiquement votre écran à intervalles réguliers pour
                            enrichir le contexte.
                        </div>
                    </div>
                </div>

                <div class="tip-box">
                    <div class="tip-title">💡 Astuce</div>
                    <div class="tip-content">
                        Pour de meilleurs résultats, parlez clairement et utilisez Deepgram pour
                        la transcription en temps réel, ou Whisper pour une précision maximale
                        en mode batch.
                    </div>
                </div>
            </div>
        `;
    }

    renderShortcutsSection() {
        const shortcuts = [
            { label: 'Activer Lucide', keys: ['Cmd', 'Space'] },
            { label: 'Étape suivante', keys: ['Cmd', 'N'] },
            { label: 'Monter la fenêtre', keys: ['Cmd', '↑'] },
            { label: 'Descendre la fenêtre', keys: ['Cmd', '↓'] },
            { label: 'Défiler vers le haut', keys: ['Cmd', 'K'] },
            { label: 'Défiler vers le bas', keys: ['Cmd', 'J'] },
            { label: 'Ouvrir le navigateur', keys: ['Cmd', 'B'] }
        ];

        return html`
            <div class="section">
                <div class="section-title">
                    <span class="section-icon">⌨️</span>
                    <span>Raccourcis clavier</span>
                </div>
                <div class="section-description">
                    Gagnez du temps avec les raccourcis clavier de Lucide. Tous les raccourcis
                    sont personnalisables dans les paramètres.
                </div>

                <ul class="shortcut-list">
                    ${shortcuts.map(shortcut => html`
                        <li class="shortcut-item">
                            <span class="shortcut-label">${shortcut.label}</span>
                            <div class="shortcut-keys">
                                ${shortcut.keys.map(key => html`<span class="key">${key}</span>`)}
                            </div>
                        </li>
                    `)}
                </ul>

                <div class="tip-box">
                    <div class="tip-title">💡 Personnalisation</div>
                    <div class="tip-content">
                        Vous pouvez modifier tous ces raccourcis dans Paramètres > Raccourcis
                        pour les adapter à votre workflow.
                    </div>
                </div>
            </div>
        `;
    }

    renderExportSection() {
        return html`
            <div class="section">
                <div class="section-title">
                    <span class="section-icon">📤</span>
                    <span>Export de données</span>
                </div>
                <div class="section-description">
                    Exportez vos conversations et documents dans plusieurs formats pour les
                    partager ou les archiver.
                </div>

                <h3 style="color: white; font-size: 16px; margin: 24px 0 12px;">Formats disponibles</h3>
                <div class="feature-grid">
                    <div class="feature-card">
                        <div class="feature-title">📋 JSON</div>
                        <div class="feature-description">
                            Format structuré pour l'import/export technique et l'intégration
                            avec d'autres outils.
                        </div>
                    </div>
                    <div class="feature-card">
                        <div class="feature-title">📝 Markdown</div>
                        <div class="feature-description">
                            Format texte lisible, parfait pour la documentation et le partage
                            sur GitHub.
                        </div>
                    </div>
                    <div class="feature-card">
                        <div class="feature-title">📄 PDF</div>
                        <div class="feature-description">
                            Documents professionnels prêts à imprimer avec mise en page
                            automatique.
                        </div>
                    </div>
                    <div class="feature-card">
                        <div class="feature-title">📘 DOCX</div>
                        <div class="feature-description">
                            Fichiers Word éditables pour une collaboration facile avec
                            Microsoft Office.
                        </div>
                    </div>
                </div>

                <div class="warning-box">
                    <div class="warning-title">⚠️ Note importante</div>
                    <div class="warning-content">
                        Les exports PDF et DOCX peuvent prendre quelques secondes pour les
                        grandes conversations. Un indicateur de progression s'affichera pendant
                        l'export.
                    </div>
                </div>
            </div>
        `;
    }

    renderTroubleshootingSection() {
        return html`
            <div class="section">
                <div class="section-title">
                    <span class="section-icon">🔧</span>
                    <span>Dépannage</span>
                </div>
                <div class="section-description">
                    Solutions aux problèmes courants et conseils de dépannage.
                </div>

                <h3 style="color: white; font-size: 16px; margin: 24px 0 12px;">Problèmes fréquents</h3>

                <div class="feature-card" style="margin-bottom: 16px;">
                    <div class="feature-title">❌ La transcription ne fonctionne pas</div>
                    <div class="feature-description">
                        Vérifiez que vos clés API sont correctement configurées dans Paramètres.
                        Pour Whisper local, assurez-vous que le modèle est téléchargé.
                    </div>
                </div>

                <div class="feature-card" style="margin-bottom: 16px;">
                    <div class="feature-title">🐌 L'application est lente</div>
                    <div class="feature-description">
                        Réduisez la fréquence des screenshots automatiques ou désactivez-les.
                        Utilisez un modèle IA plus léger comme GPT-3.5 ou Ollama local.
                    </div>
                </div>

                <div class="feature-card" style="margin-bottom: 16px;">
                    <div class="feature-title">🔌 Problèmes de synchronisation</div>
                    <div class="feature-description">
                        Vérifiez votre connexion internet et les paramètres Supabase. La sync
                        est optionnelle et les données restent accessibles localement.
                    </div>
                </div>

                <div class="tip-box">
                    <div class="tip-title">💡 Logs de débogage</div>
                    <div class="tip-content">
                        Ouvrez la console développeur avec Cmd+Option+I (Mac) ou Ctrl+Shift+I
                        (Windows/Linux) pour voir les logs détaillés.
                    </div>
                </div>

                <div class="code-block">
                    Emplacement des logs: ~/Library/Logs/Lucide/ (Mac)<br>
                    Emplacement des logs: %APPDATA%/Lucide/logs/ (Windows)
                </div>
            </div>
        `;
    }

    renderAIModelsSection() {
        return html`
            <div class="section">
                <div class="section-title">
                    <span class="section-icon">🤖</span>
                    <span>Modèles IA disponibles</span>
                </div>
                <div class="section-description">
                    Lucide supporte plusieurs fournisseurs d'IA pour vous offrir flexibilité
                    et choix selon vos besoins.
                </div>

                <h3 style="color: white; font-size: 16px; margin: 24px 0 12px;">Fournisseurs supportés</h3>
                <div class="feature-grid">
                    <div class="feature-card">
                        <div class="feature-title">🧠 Claude (Anthropic)</div>
                        <div class="feature-description">
                            Modèles Claude Sonnet et Opus pour des conversations nuancées et
                            une compréhension profonde du contexte.
                        </div>
                    </div>
                    <div class="feature-card">
                        <div class="feature-title">💡 ChatGPT (OpenAI)</div>
                        <div class="feature-description">
                            GPT-4 et GPT-3.5 pour des réponses rapides et polyvalentes sur
                            tous les sujets.
                        </div>
                    </div>
                    <div class="feature-card">
                        <div class="feature-title">🌟 Gemini (Google)</div>
                        <div class="feature-description">
                            Gemini Pro pour une analyse multimodale et une intégration Google.
                        </div>
                    </div>
                    <div class="feature-card">
                        <div class="feature-title">🏠 Ollama (Local)</div>
                        <div class="feature-description">
                            Modèles locaux pour confidentialité maximale, sans coûts et hors-ligne.
                        </div>
                    </div>
                    <div class="feature-card">
                        <div class="feature-title">🎤 Whisper (OpenAI)</div>
                        <div class="feature-description">
                            Transcription audio précise, disponible en local ou via API cloud.
                        </div>
                    </div>
                    <div class="feature-card">
                        <div class="feature-title">⚡ Deepgram</div>
                        <div class="feature-description">
                            Transcription en temps réel ultra-rapide pour le streaming audio.
                        </div>
                    </div>
                </div>

                <div class="tip-box">
                    <div class="tip-title">💡 Choix du modèle</div>
                    <div class="tip-content">
                        Pour la meilleure qualité, utilisez Claude Opus ou GPT-4. Pour la rapidité,
                        privilégiez GPT-3.5 ou Ollama local. Pour la confidentialité, optez pour
                        Ollama avec Whisper local.
                    </div>
                </div>
            </div>
        `;
    }

    renderContent() {
        switch (this.activeSection) {
            case 'overview':
                return this.renderOverview();
            case 'listen':
                return this.renderListenSection();
            case 'shortcuts':
                return this.renderShortcutsSection();
            case 'export':
                return this.renderExportSection();
            case 'troubleshooting':
                return this.renderTroubleshootingSection();
            case 'ai-models':
                return this.renderAIModelsSection();
            default:
                return html`
                    <div class="section">
                        <div class="section-title">
                            <span class="section-icon">🚧</span>
                            <span>Section en construction</span>
                        </div>
                        <div class="section-description">
                            Cette section de documentation sera bientôt disponible. En attendant,
                            explorez les autres sections ou consultez la vue d'ensemble.
                        </div>
                    </div>
                `;
        }
    }

    render() {
        return html`
            <div class="help-container">
                <div class="sidebar">
                    ${this.renderNavigation()}
                </div>
                <div style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
                    <div class="header-bar">
                        <div class="header-title">
                            <span>📖</span>
                            <span>Documentation Lucide</span>
                        </div>
                        <div class="search-box">
                            <input
                                type="text"
                                class="search-input"
                                placeholder="Rechercher dans la doc..."
                                .value=${this.searchQuery}
                                @input=${(e) => this.searchQuery = e.target.value}
                            />
                        </div>
                    </div>
                    <div class="content">
                        ${this.renderContent()}
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('help-view', HelpView);
