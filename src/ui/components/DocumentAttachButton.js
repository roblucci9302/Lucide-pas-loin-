import { html, css, LitElement } from '../assets/lit-core-2.7.4.min.js';

/**
 * DocumentAttachButton Component
 * Button to attach documents to conversations (inspired by Claude)
 * Phase 5 - Document Management UI
 */
export class DocumentAttachButton extends LitElement {
    static properties = {
        disabled: { type: Boolean },
        hasDocuments: { type: Boolean },
        documentCount: { type: Number }
    };

    static styles = css`
        * {
            font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            cursor: default;
            user-select: none;
        }

        :host {
            display: inline-block;
        }

        .attach-button {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .attach-button:hover:not(.disabled) {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.2);
        }

        .attach-button:active:not(.disabled) {
            transform: scale(0.95);
        }

        .attach-button.disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }

        .attach-button.has-documents {
            background: rgba(99, 102, 241, 0.15);
            border-color: rgba(99, 102, 241, 0.3);
        }

        .attach-button.has-documents:hover:not(.disabled) {
            background: rgba(99, 102, 241, 0.25);
            border-color: rgba(99, 102, 241, 0.4);
        }

        .icon {
            width: 20px;
            height: 20px;
            color: rgba(255, 255, 255, 0.9);
        }

        .attach-button.has-documents .icon {
            color: #818cf8;
        }

        /* Badge for document count */
        .badge {
            position: absolute;
            top: -6px;
            right: -6px;
            min-width: 18px;
            height: 18px;
            padding: 0 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #818cf8;
            color: white;
            font-size: 11px;
            font-weight: 700;
            border-radius: 9px;
            box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
        }

        /* Tooltip */
        .tooltip {
            position: absolute;
            bottom: calc(100% + 8px);
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            white-space: nowrap;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s ease;
            z-index: 1000;
        }

        .attach-button:hover .tooltip {
            opacity: 1;
        }

        .tooltip::after {
            content: '';
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            border: 4px solid transparent;
            border-top-color: rgba(0, 0, 0, 0.9);
        }
    `;

    constructor() {
        super();
        this.disabled = false;
        this.hasDocuments = false;
        this.documentCount = 0;
    }

    render() {
        return html`
            <button
                class="attach-button ${this.disabled ? 'disabled' : ''} ${this.hasDocuments ? 'has-documents' : ''}"
                @click="${this._handleClick}"
                ?disabled="${this.disabled}"
            >
                <!-- Paperclip Icon (inspired by Claude) -->
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>

                ${this.hasDocuments && this.documentCount > 0 ? html`
                    <span class="badge">${this.documentCount}</span>
                ` : ''}

                <div class="tooltip">
                    ${this.hasDocuments ? `${this.documentCount} document${this.documentCount > 1 ? 's' : ''} attaché${this.documentCount > 1 ? 's' : ''}` : 'Attacher des documents'}
                </div>
            </button>
        `;
    }

    _handleClick(e) {
        if (this.disabled) return;

        e.preventDefault();
        e.stopPropagation();

        // Dispatch custom event to open upload modal
        this.dispatchEvent(new CustomEvent('open-document-upload', {
            bubbles: true,
            composed: true
        }));
    }
}

customElements.define('document-attach-button', DocumentAttachButton);
