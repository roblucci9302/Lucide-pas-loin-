import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';

/**
 * ResponseView - Displays real-time AI response suggestions
 *
 * Shows 2-3 suggested responses the user could say next in the conversation.
 * Updates automatically when the user finishes speaking.
 */
export class ResponseView extends LitElement {
    static properties = {
        suggestions: { type: Array },
        loading: { type: Boolean },
        error: { type: String },
        visible: { type: Boolean }
    };

    static styles = css`
        :host {
            display: block;
            width: 100%;
            height: 100%;
            overflow-y: auto;
            background: rgba(15, 15, 25, 0.95);
            backdrop-filter: blur(20px);
        }

        .response-container {
            padding: 16px;
            height: 100%;
            box-sizing: border-box;
        }

        .response-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .response-icon {
            font-size: 18px;
        }

        .response-title {
            font-size: 14px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.9);
        }

        .response-subtitle {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.5);
            margin-top: 2px;
        }

        .suggestions-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .suggestion-card {
            padding: 12px 14px;
            background: rgba(100, 150, 255, 0.08);
            border: 1px solid rgba(100, 150, 255, 0.2);
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
            overflow: hidden;
        }

        .suggestion-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(100, 150, 255, 0.1) 0%, rgba(150, 100, 255, 0.05) 100%);
            opacity: 0;
            transition: opacity 0.2s ease;
        }

        .suggestion-card:hover {
            background: rgba(100, 150, 255, 0.12);
            border-color: rgba(100, 150, 255, 0.4);
            transform: translateY(-2px);
        }

        .suggestion-card:hover::before {
            opacity: 1;
        }

        .suggestion-card:active {
            transform: translateY(0);
        }

        .suggestion-number {
            display: inline-block;
            width: 20px;
            height: 20px;
            background: rgba(100, 150, 255, 0.2);
            color: rgba(150, 200, 255, 0.9);
            border-radius: 50%;
            font-size: 11px;
            font-weight: 600;
            line-height: 20px;
            text-align: center;
            margin-right: 10px;
            flex-shrink: 0;
        }

        .suggestion-text {
            font-size: 13px;
            line-height: 1.5;
            color: rgba(255, 255, 255, 0.85);
            position: relative;
            user-select: text;
        }

        .loading-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 32px 16px;
            text-align: center;
        }

        .loading-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid rgba(100, 150, 255, 0.2);
            border-top-color: rgba(100, 150, 255, 0.8);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .loading-text {
            margin-top: 12px;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
        }

        .error-state {
            padding: 16px;
            background: rgba(255, 100, 100, 0.1);
            border: 1px solid rgba(255, 100, 100, 0.3);
            border-radius: 8px;
            color: rgba(255, 150, 150, 0.9);
            font-size: 12px;
            line-height: 1.5;
        }

        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 32px 16px;
            text-align: center;
            height: 200px;
        }

        .empty-icon {
            font-size: 48px;
            opacity: 0.3;
            margin-bottom: 12px;
        }

        .empty-text {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.5);
            line-height: 1.5;
        }

        .copy-feedback {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.9);
            background: rgba(50, 200, 100, 0.95);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 500;
            opacity: 0;
            pointer-events: none;
            animation: copyFeedback 1.5s ease;
            z-index: 1000;
        }

        @keyframes copyFeedback {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
            20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
        }
    `;

    constructor() {
        super();
        this.suggestions = [];
        this.loading = false;
        this.error = null;
        this.visible = true;
        this.setupIpcListeners();
    }

    setupIpcListeners() {
        // Listen for AI response suggestions
        window.api?.responseView?.onAiResponseReady?.((data) => {
            console.log('[ResponseView] Received AI suggestions:', data);
            this.loading = false;
            this.suggestions = data.suggestions || [];
            this.error = null;
        });

        window.api?.responseView?.onAiResponseError?.((data) => {
            console.error('[ResponseView] AI response error:', data);
            this.loading = false;
            this.error = data.error || 'Failed to generate suggestions';
        });

        // Listen for session state changes
        window.api?.responseView?.onSessionStateChanged?.((state) => {
            console.log('[ResponseView] Session state changed:', state);
            if (!state.isActive) {
                // Clear suggestions when session ends
                this.suggestions = [];
                this.loading = false;
                this.error = null;
            }
        });
    }

    handleSuggestionClick(suggestion, index) {
        console.log(`[ResponseView] Suggestion ${index + 1} clicked:`, suggestion);

        // Copy to clipboard
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(suggestion).then(() => {
                this.showCopyFeedback();
            }).catch(err => {
                console.error('[ResponseView] Failed to copy:', err);
            });
        }

        // Could also trigger TTS or other actions here
    }

    showCopyFeedback() {
        const feedback = this.shadowRoot.querySelector('.copy-feedback');
        if (feedback) {
            feedback.style.animation = 'none';
            // Trigger reflow
            feedback.offsetHeight;
            feedback.style.animation = 'copyFeedback 1.5s ease';
        }
    }

    render() {
        return html`
            <div class="response-container">
                <div class="response-header">
                    <span class="response-icon">💬</span>
                    <div>
                        <div class="response-title">AI Response Suggestions</div>
                        <div class="response-subtitle">Click to copy</div>
                    </div>
                </div>

                ${this.renderContent()}
            </div>

            <div class="copy-feedback">✓ Copied to clipboard</div>
        `;
    }

    renderContent() {
        if (this.loading) {
            return html`
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">Generating suggestions...</div>
                </div>
            `;
        }

        if (this.error) {
            return html`
                <div class="error-state">
                    <strong>⚠️ Error:</strong><br>
                    ${this.error}
                </div>
            `;
        }

        if (this.suggestions.length === 0) {
            return html`
                <div class="empty-state">
                    <div class="empty-icon">💭</div>
                    <div class="empty-text">
                        Speak to get AI-powered<br>response suggestions
                    </div>
                </div>
            `;
        }

        return html`
            <div class="suggestions-list">
                ${this.suggestions.map((suggestion, index) => html`
                    <div
                        class="suggestion-card"
                        @click="${() => this.handleSuggestionClick(suggestion, index)}"
                    >
                        <span class="suggestion-number">${index + 1}</span>
                        <span class="suggestion-text">${suggestion}</span>
                    </div>
                `)}
            </div>
        `;
    }
}

customElements.define('response-view', ResponseView);
