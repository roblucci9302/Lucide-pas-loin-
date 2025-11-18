import { html, css, LitElement } from '../assets/lit-core-2.7.4.min.js';

/**
 * TranscriptionToolbar Component
 * Phase 6.4: Outils AI Interactifs
 *
 * Contextual toolbar that appears when text is selected
 * Provides AI-powered tools: summarize, expand, extract points, rewrite
 */
export class TranscriptionToolbar extends LitElement {
    static properties = {
        visible: { type: Boolean },
        position: { type: Object }, // {x, y}
        selectedText: { type: String },
        isProcessing: { type: Boolean },
        showRewriteMenu: { type: Boolean },
        showSummaryMenu: { type: Boolean }
    };

    static styles = css`
        * {
            font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            cursor: default;
            user-select: none;
        }

        :host {
            position: fixed;
            z-index: 1000;
            pointer-events: none;
        }

        .toolbar {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 6px;
            background: rgba(20, 20, 30, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
            pointer-events: auto;
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .toolbar.visible {
            opacity: 1;
            transform: translateY(0) scale(1);
        }

        .toolbar-btn {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 12px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 7px;
            color: rgba(255, 255, 255, 0.85);
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease;
            white-space: nowrap;
        }

        .toolbar-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.2);
            color: rgba(255, 255, 255, 0.95);
        }

        .toolbar-btn.primary {
            background: rgba(129, 140, 248, 0.15);
            border-color: rgba(129, 140, 248, 0.3);
            color: rgba(129, 140, 248, 0.95);
        }

        .toolbar-btn.primary:hover {
            background: rgba(129, 140, 248, 0.25);
            border-color: rgba(129, 140, 248, 0.4);
        }

        .toolbar-btn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }

        .toolbar-btn .icon {
            font-size: 14px;
        }

        .divider {
            width: 1px;
            height: 20px;
            background: rgba(255, 255, 255, 0.1);
            margin: 0 4px;
        }

        /* Dropdown menus */
        .dropdown {
            position: relative;
        }

        .dropdown-menu {
            position: absolute;
            top: 100%;
            left: 0;
            margin-top: 4px;
            min-width: 160px;
            background: rgba(20, 20, 30, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
            padding: 4px;
            opacity: 0;
            transform: translateY(-10px);
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            pointer-events: none;
        }

        .dropdown-menu.visible {
            opacity: 1;
            transform: translateY(0);
            pointer-events: auto;
        }

        .dropdown-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background: transparent;
            border: none;
            border-radius: 6px;
            color: rgba(255, 255, 255, 0.8);
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease;
            width: 100%;
            text-align: left;
        }

        .dropdown-item:hover {
            background: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.95);
        }

        .dropdown-item .icon {
            font-size: 14px;
            width: 16px;
            text-align: center;
        }

        .processing {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            color: rgba(129, 140, 248, 0.9);
            font-size: 13px;
        }

        .spinner {
            width: 14px;
            height: 14px;
            border: 2px solid rgba(129, 140, 248, 0.2);
            border-top-color: rgba(129, 140, 248, 0.9);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;

    constructor() {
        super();
        this.visible = false;
        this.position = { x: 0, y: 0 };
        this.selectedText = '';
        this.isProcessing = false;
        this.showRewriteMenu = false;
        this.showSummaryMenu = false;
    }

    render() {
        return html`
            <div
                class="toolbar ${this.visible ? 'visible' : ''}"
                style="left: ${this.position.x}px; top: ${this.position.y}px;"
                @mouseleave="${this._handleMouseLeave}"
            >
                ${this.isProcessing ? html`
                    <div class="processing">
                        <div class="spinner"></div>
                        <span>Processing...</span>
                    </div>
                ` : html`
                    <!-- Summarize with dropdown -->
                    <div class="dropdown">
                        <button
                            class="toolbar-btn primary"
                            @click="${this._toggleSummaryMenu}"
                            @mouseenter="${() => this.showSummaryMenu = true}"
                            title="Summarize selection"
                        >
                            <span class="icon">📋</span>
                            <span>Summarize</span>
                            <span>▾</span>
                        </button>

                        <div
                            class="dropdown-menu ${this.showSummaryMenu ? 'visible' : ''}"
                            @mouseleave="${() => this.showSummaryMenu = false}"
                        >
                            <button class="dropdown-item" @click="${() => this._handleSummarize('concise')}">
                                <span class="icon">⚡</span>
                                <span>Concise (2-3 lines)</span>
                            </button>
                            <button class="dropdown-item" @click="${() => this._handleSummarize('detailed')}">
                                <span class="icon">📄</span>
                                <span>Detailed</span>
                            </button>
                            <button class="dropdown-item" @click="${() => this._handleSummarize('executive')}">
                                <span class="icon">💼</span>
                                <span>Executive Summary</span>
                            </button>
                        </div>
                    </div>

                    <div class="divider"></div>

                    <!-- Extract Key Points -->
                    <button
                        class="toolbar-btn"
                        @click="${this._handleExtractPoints}"
                        title="Extract key points"
                    >
                        <span class="icon">🎯</span>
                        <span>Key Points</span>
                    </button>

                    <!-- Expand -->
                    <button
                        class="toolbar-btn"
                        @click="${this._handleExpand}"
                        title="Expand with more details"
                    >
                        <span class="icon">📝</span>
                        <span>Expand</span>
                    </button>

                    <div class="divider"></div>

                    <!-- Rewrite with dropdown -->
                    <div class="dropdown">
                        <button
                            class="toolbar-btn"
                            @click="${this._toggleRewriteMenu}"
                            @mouseenter="${() => this.showRewriteMenu = true}"
                            title="Rewrite in different style"
                        >
                            <span class="icon">✍️</span>
                            <span>Rewrite</span>
                            <span>▾</span>
                        </button>

                        <div
                            class="dropdown-menu ${this.showRewriteMenu ? 'visible' : ''}"
                            @mouseleave="${() => this.showRewriteMenu = false}"
                        >
                            <button class="dropdown-item" @click="${() => this._handleRewrite('formal')}">
                                <span class="icon">👔</span>
                                <span>Formal</span>
                            </button>
                            <button class="dropdown-item" @click="${() => this._handleRewrite('casual')}">
                                <span class="icon">😊</span>
                                <span>Casual</span>
                            </button>
                            <button class="dropdown-item" @click="${() => this._handleRewrite('professional')}">
                                <span class="icon">💼</span>
                                <span>Professional</span>
                            </button>
                            <button class="dropdown-item" @click="${() => this._handleRewrite('technical')}">
                                <span class="icon">⚙️</span>
                                <span>Technical</span>
                            </button>
                            <button class="dropdown-item" @click="${() => this._handleRewrite('simple')}">
                                <span class="icon">📖</span>
                                <span>Simple</span>
                            </button>
                        </div>
                    </div>
                `}
            </div>
        `;
    }

    /**
     * Show toolbar at position
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} text - Selected text
     */
    show(x, y, text) {
        this.selectedText = text;
        this.position = { x, y };
        this.visible = true;
        this.isProcessing = false;
        this.showRewriteMenu = false;
        this.showSummaryMenu = false;
    }

    /**
     * Hide toolbar
     */
    hide() {
        this.visible = false;
        this.showRewriteMenu = false;
        this.showSummaryMenu = false;
    }

    // ====== Event Handlers ======

    _toggleSummaryMenu(e) {
        e.stopPropagation();
        this.showSummaryMenu = !this.showSummaryMenu;
        this.showRewriteMenu = false;
    }

    _toggleRewriteMenu(e) {
        e.stopPropagation();
        this.showRewriteMenu = !this.showRewriteMenu;
        this.showSummaryMenu = false;
    }

    _handleMouseLeave() {
        // Close dropdowns but keep toolbar visible
        this.showRewriteMenu = false;
        this.showSummaryMenu = false;
    }

    async _handleSummarize(style) {
        this.showSummaryMenu = false;
        this.isProcessing = true;

        this.dispatchEvent(new CustomEvent('summarize', {
            detail: {
                text: this.selectedText,
                style
            },
            bubbles: true,
            composed: true
        }));
    }

    async _handleExtractPoints() {
        this.isProcessing = true;

        this.dispatchEvent(new CustomEvent('extract-points', {
            detail: {
                text: this.selectedText
            },
            bubbles: true,
            composed: true
        }));
    }

    async _handleExpand() {
        this.isProcessing = true;

        this.dispatchEvent(new CustomEvent('expand', {
            detail: {
                text: this.selectedText
            },
            bubbles: true,
            composed: true
        }));
    }

    async _handleRewrite(style) {
        this.showRewriteMenu = false;
        this.isProcessing = true;

        this.dispatchEvent(new CustomEvent('rewrite', {
            detail: {
                text: this.selectedText,
                style
            },
            bubbles: true,
            composed: true
        }));
    }

    /**
     * Reset processing state (called from parent after operation completes)
     */
    resetProcessing() {
        this.isProcessing = false;
    }
}

customElements.define('transcription-toolbar', TranscriptionToolbar);
