import { html, css, LitElement } from '../assets/lit-core-2.7.4.min.js';
import { DocumentAttachButton } from './DocumentAttachButton.js';
import { DocumentUploadModal } from './DocumentUploadModal.js';
import { DocumentGenerationModal } from './DocumentGenerationModal.js';

/**
 * DocumentsManager Component
 * Main orchestrator for document management in conversations
 * Phase 5.1 - Document Management UI
 */
export class DocumentsManager extends LitElement {
    static properties = {
        sessionId: { type: String },
        attachedDocuments: { type: Array },
        uploadModalVisible: { type: Boolean },
        generationModalVisible: { type: Boolean }
    };

    static styles = css`
        * {
            font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            cursor: default;
            user-select: none;
        }

        :host {
            display: block;
        }

        .documents-toolbar {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 10px;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
        }

        .toolbar-divider {
            width: 1px;
            height: 24px;
            background: rgba(255, 255, 255, 0.1);
        }

        .generate-button {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            color: rgba(255, 255, 255, 0.9);
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .generate-button:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.2);
        }

        .generate-button-icon {
            font-size: 16px;
        }

        /* Attached Documents List (compact) */
        .attached-documents {
            margin-top: 12px;
        }

        .documents-chips {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }

        .document-chip {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            background: rgba(129, 140, 248, 0.15);
            border: 1px solid rgba(129, 140, 248, 0.3);
            border-radius: 16px;
            font-size: 13px;
            color: rgba(255, 255, 255, 0.9);
        }

        .chip-icon {
            font-size: 14px;
        }

        .chip-name {
            max-width: 150px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .chip-remove {
            width: 16px;
            height: 16px;
            flex-shrink: 0;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 10px;
            transition: all 0.15s ease;
        }

        .chip-remove:hover {
            background: rgba(239, 68, 68, 0.3);
            color: #ef4444;
        }
    `;

    constructor() {
        super();
        this.sessionId = null;
        this.attachedDocuments = [];
        this.uploadModalVisible = false;
        this.generationModalVisible = false;

        // Listen for session changes
        this._setupListeners();
    }

    connectedCallback() {
        super.connectedCallback();
        this._loadSessionId();
    }

    render() {
        return html`
            <!-- Toolbar with attach & generate buttons -->
            <div class="documents-toolbar">
                <!-- Attach Button -->
                <document-attach-button
                    ?hasDocuments="${this.attachedDocuments.length > 0}"
                    .documentCount="${this.attachedDocuments.length}"
                    @open-document-upload="${this._handleOpenUpload}"
                ></document-attach-button>

                <div class="toolbar-divider"></div>

                <!-- Generate Button -->
                <button class="generate-button" @click="${this._handleOpenGeneration}">
                    <span class="generate-button-icon">📄</span>
                    <span>Générer un document</span>
                </button>
            </div>

            <!-- Attached Documents Chips -->
            ${this.attachedDocuments.length > 0 ? html`
                <div class="attached-documents">
                    <div class="documents-chips">
                        ${this.attachedDocuments.map(doc => html`
                            <div class="document-chip">
                                <span class="chip-icon">📎</span>
                                <span class="chip-name">${doc.name}</span>
                                <span class="chip-remove" @click="${() => this._handleRemoveDocument(doc.id)}">
                                    ✕
                                </span>
                            </div>
                        `)}
                    </div>
                </div>
            ` : ''}

            <!-- Upload Modal -->
            <document-upload-modal
                ?visible="${this.uploadModalVisible}"
                @close="${this._handleCloseUpload}"
                @document-uploaded="${this._handleDocumentUploaded}"
                @document-deleted="${this._handleDocumentDeleted}"
            ></document-upload-modal>

            <!-- Generation Modal -->
            <document-generation-modal
                ?visible="${this.generationModalVisible}"
                .sessionId="${this.sessionId}"
                @close="${this._handleCloseGeneration}"
                @document-generated="${this._handleDocumentGenerated}"
            ></document-generation-modal>
        `;
    }

    _setupListeners() {
        // Listen for session changes from window.api events
        if (window.api && window.api.on) {
            window.api.on('session:changed', (session) => {
                this.sessionId = session.id;
            });
        }
    }

    async _loadSessionId() {
        // Try to get current session ID
        try {
            // This would need to be implemented in the IPC bridge
            // For now, we'll just use a placeholder
            this.sessionId = 'current-session';
        } catch (error) {
            console.error('Error loading session ID:', error);
        }
    }

    _handleOpenUpload() {
        this.uploadModalVisible = true;
    }

    _handleCloseUpload() {
        this.uploadModalVisible = false;
    }

    _handleOpenGeneration() {
        this.generationModalVisible = true;
    }

    _handleCloseGeneration() {
        this.generationModalVisible = false;
    }

    _handleDocumentUploaded(e) {
        const { documentId, name } = e.detail;

        this.attachedDocuments = [
            ...this.attachedDocuments,
            { id: documentId, name }
        ];

        // Notify parent/app about document upload
        this.dispatchEvent(new CustomEvent('document-attached', {
            detail: { documentId, name },
            bubbles: true,
            composed: true
        }));
    }

    _handleDocumentDeleted(e) {
        const { documentId } = e.detail;
        this.attachedDocuments = this.attachedDocuments.filter(doc => doc.id !== documentId);
    }

    async _handleRemoveDocument(documentId) {
        if (!confirm('Détacher ce document ?')) return;

        try {
            const result = await window.api.invoke('upload:delete-document', { documentId });

            if (result.success) {
                this.attachedDocuments = this.attachedDocuments.filter(doc => doc.id !== documentId);

                this.dispatchEvent(new CustomEvent('document-detached', {
                    detail: { documentId },
                    bubbles: true,
                    composed: true
                }));
            }
        } catch (error) {
            console.error('Error removing document:', error);
        }
    }

    _handleDocumentGenerated(e) {
        const result = e.detail;

        // Notify parent/app about document generation
        this.dispatchEvent(new CustomEvent('document-generated-success', {
            detail: result,
            bubbles: true,
            composed: true
        }));

        // Show success notification
        console.log('Document generated:', result.filePath);
    }
}

customElements.define('documents-manager', DocumentsManager);
