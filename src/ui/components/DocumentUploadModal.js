import { html, css, LitElement } from '../assets/lit-core-2.7.4.min.js';

/**
 * DocumentUploadModal Component
 * Modal for uploading and managing documents (inspired by Claude)
 * Phase 5 - Document Management UI
 */
export class DocumentUploadModal extends LitElement {
    static properties = {
        visible: { type: Boolean },
        uploadedDocuments: { type: Array },
        isUploading: { type: Boolean },
        uploadProgress: { type: Number },
        dragOver: { type: Boolean }
    };

    static styles = css`
        * {
            font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            cursor: default;
            user-select: none;
        }

        :host {
            display: block;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10000;
            pointer-events: none;
        }

        :host([visible]) {
            pointer-events: all;
        }

        .overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            opacity: 0;
            transition: opacity 0.2s ease;
        }

        :host([visible]) .overlay {
            opacity: 1;
        }

        .modal {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.95);
            width: 90%;
            max-width: 700px;
            max-height: 85vh;
            background: rgba(25, 25, 25, 0.98);
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.15);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
            display: flex;
            flex-direction: column;
        }

        :host([visible]) .modal {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }

        /* Header */
        .modal-header {
            padding: 24px 24px 16px 24px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .header-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
        }

        .modal-title {
            font-size: 18px;
            font-weight: 600;
            color: #fff;
            margin: 0;
        }

        .close-button {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            background: transparent;
            border: none;
            color: rgba(255, 255, 255, 0.6);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.15s ease;
        }

        .close-button:hover {
            background: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.9);
        }

        .modal-description {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.6);
            margin: 0;
        }

        /* Content */
        .modal-content {
            flex: 1;
            overflow-y: auto;
            padding: 24px;
        }

        /* Drag & Drop Zone */
        .upload-zone {
            border: 2px dashed rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            padding: 48px 24px;
            text-align: center;
            background: rgba(255, 255, 255, 0.02);
            transition: all 0.2s ease;
            cursor: pointer;
        }

        .upload-zone:hover,
        .upload-zone.drag-over {
            border-color: #818cf8;
            background: rgba(129, 140, 248, 0.05);
        }

        .upload-zone.drag-over {
            border-style: solid;
            background: rgba(129, 140, 248, 0.1);
        }

        .upload-icon {
            width: 48px;
            height: 48px;
            margin: 0 auto 16px;
            color: rgba(255, 255, 255, 0.4);
        }

        .upload-zone.drag-over .upload-icon {
            color: #818cf8;
        }

        .upload-title {
            font-size: 16px;
            font-weight: 600;
            color: #fff;
            margin: 0 0 8px 0;
        }

        .upload-subtitle {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.6);
            margin: 0 0 16px 0;
        }

        .browse-button {
            padding: 10px 20px;
            background: #818cf8;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .browse-button:hover {
            background: #6366f1;
        }

        .supported-formats {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.4);
            margin: 16px 0 0 0;
        }

        /* Hidden file input */
        input[type="file"] {
            display: none;
        }

        /* Uploaded Documents List */
        .documents-list {
            margin-top: 24px;
        }

        .documents-header {
            font-size: 14px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.8);
            margin: 0 0 12px 0;
        }

        .document-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 10px;
            margin-bottom: 8px;
            transition: all 0.15s ease;
        }

        .document-item:hover {
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(255, 255, 255, 0.15);
        }

        .document-icon {
            width: 40px;
            height: 40px;
            flex-shrink: 0;
            background: rgba(129, 140, 248, 0.15);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
        }

        .document-info {
            flex: 1;
            min-width: 0;
        }

        .document-name {
            font-size: 14px;
            font-weight: 500;
            color: #fff;
            margin: 0 0 4px 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .document-meta {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.5);
            display: flex;
            gap: 8px;
        }

        .delete-button {
            width: 32px;
            height: 32px;
            flex-shrink: 0;
            background: transparent;
            border: none;
            border-radius: 6px;
            color: rgba(255, 255, 255, 0.5);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.15s ease;
        }

        .delete-button:hover {
            background: rgba(239, 68, 68, 0.15);
            color: #ef4444;
        }

        /* Upload Progress */
        .upload-progress {
            margin-top: 16px;
            padding: 16px;
            background: rgba(129, 140, 248, 0.1);
            border: 1px solid rgba(129, 140, 248, 0.2);
            border-radius: 10px;
        }

        .progress-text {
            font-size: 13px;
            color: #818cf8;
            margin: 0 0 8px 0;
        }

        .progress-bar {
            width: 100%;
            height: 4px;
            background: rgba(129, 140, 248, 0.2);
            border-radius: 2px;
            overflow: hidden;
        }

        .progress-fill {
            height: 100%;
            background: #818cf8;
            transition: width 0.3s ease;
        }

        /* Empty State */
        .empty-state {
            text-align: center;
            padding: 24px;
            color: rgba(255, 255, 255, 0.4);
            font-size: 14px;
        }

        /* Scrollbar */
        .modal-content::-webkit-scrollbar {
            width: 8px;
        }

        .modal-content::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 4px;
        }

        .modal-content::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 4px;
        }

        .modal-content::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.3);
        }
    `;

    constructor() {
        super();
        this.visible = false;
        this.uploadedDocuments = [];
        this.isUploading = false;
        this.uploadProgress = 0;
        this.dragOver = false;
    }

    render() {
        return html`
            <div class="overlay" @click="${this._handleClose}"></div>

            <div class="modal">
                <!-- Header -->
                <div class="modal-header">
                    <div class="header-top">
                        <h2 class="modal-title">📎 Attacher des documents</h2>
                        <button class="close-button" @click="${this._handleClose}">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
                            </svg>
                        </button>
                    </div>
                    <p class="modal-description">
                        Ajoutez des documents pour enrichir vos conversations avec Lucide
                    </p>
                </div>

                <!-- Content -->
                <div class="modal-content">
                    <!-- Upload Zone -->
                    <div
                        class="upload-zone ${this.dragOver ? 'drag-over' : ''}"
                        @click="${this._handleBrowseClick}"
                        @dragover="${this._handleDragOver}"
                        @dragleave="${this._handleDragLeave}"
                        @drop="${this._handleDrop}"
                    >
                        <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="17 8 12 3 7 8"/>
                            <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>

                        <h3 class="upload-title">
                            ${this.dragOver ? 'Déposez vos fichiers ici' : 'Glissez vos fichiers ici'}
                        </h3>
                        <p class="upload-subtitle">ou</p>
                        <button class="browse-button">
                            📁 Parcourir les fichiers
                        </button>

                        <p class="supported-formats">
                            PDF, Excel, Word, Images, Texte • Max 50 MB
                        </p>
                    </div>

                    <input
                        type="file"
                        id="file-input"
                        multiple
                        accept=".pdf,.xlsx,.xls,.docx,.doc,.txt,.md,.png,.jpg,.jpeg"
                        @change="${this._handleFileSelect}"
                    />

                    <!-- Upload Progress -->
                    ${this.isUploading ? html`
                        <div class="upload-progress">
                            <p class="progress-text">Upload en cours... ${this.uploadProgress}%</p>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${this.uploadProgress}%"></div>
                            </div>
                        </div>
                    ` : ''}

                    <!-- Uploaded Documents List -->
                    ${this.uploadedDocuments.length > 0 ? html`
                        <div class="documents-list">
                            <h3 class="documents-header">
                                📄 Documents attachés (${this.uploadedDocuments.length})
                            </h3>
                            ${this.uploadedDocuments.map(doc => html`
                                <div class="document-item">
                                    <div class="document-icon">
                                        ${this._getDocumentIcon(doc.type)}
                                    </div>
                                    <div class="document-info">
                                        <p class="document-name">${doc.name}</p>
                                        <div class="document-meta">
                                            <span>${this._formatFileSize(doc.size)}</span>
                                            <span>•</span>
                                            <span>${this._getFileType(doc.type)}</span>
                                        </div>
                                    </div>
                                    <button
                                        class="delete-button"
                                        @click="${() => this._handleDeleteDocument(doc.id)}"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                            <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                                        </svg>
                                    </button>
                                </div>
                            `)}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    _handleClose() {
        this.visible = false;
        this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
    }

    _handleBrowseClick(e) {
        e.preventDefault();
        this.shadowRoot.querySelector('#file-input').click();
    }

    _handleDragOver(e) {
        e.preventDefault();
        this.dragOver = true;
    }

    _handleDragLeave(e) {
        e.preventDefault();
        this.dragOver = false;
    }

    async _handleDrop(e) {
        e.preventDefault();
        this.dragOver = false;

        const files = Array.from(e.dataTransfer.files);
        await this._uploadFiles(files);
    }

    async _handleFileSelect(e) {
        const files = Array.from(e.target.files);
        await this._uploadFiles(files);
        e.target.value = ''; // Reset input
    }

    async _uploadFiles(files) {
        if (files.length === 0) return;

        this.isUploading = true;
        this.uploadProgress = 0;

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                this.uploadProgress = Math.round(((i + 1) / files.length) * 100);

                // Read file as ArrayBuffer
                const arrayBuffer = await file.arrayBuffer();

                // Call IPC to upload
                const result = await window.api.invoke('upload:file', {
                    file: {
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        buffer: arrayBuffer
                    }
                });

                if (result.success) {
                    this.uploadedDocuments = [
                        ...this.uploadedDocuments,
                        {
                            id: result.documentId,
                            name: file.name,
                            size: file.size,
                            type: file.type,
                            preview: result.preview
                        }
                    ];

                    // Notify parent
                    this.dispatchEvent(new CustomEvent('document-uploaded', {
                        detail: { documentId: result.documentId, name: file.name },
                        bubbles: true,
                        composed: true
                    }));
                }
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert(`Erreur lors de l'upload: ${error.message}`);
        } finally {
            this.isUploading = false;
            this.uploadProgress = 0;
        }
    }

    async _handleDeleteDocument(documentId) {
        if (!confirm('Supprimer ce document ?')) return;

        try {
            const result = await window.api.invoke('upload:delete-document', { documentId });

            if (result.success) {
                this.uploadedDocuments = this.uploadedDocuments.filter(doc => doc.id !== documentId);

                this.dispatchEvent(new CustomEvent('document-deleted', {
                    detail: { documentId },
                    bubbles: true,
                    composed: true
                }));
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert(`Erreur lors de la suppression: ${error.message}`);
        }
    }

    _getDocumentIcon(type) {
        if (type.includes('pdf')) return '📄';
        if (type.includes('sheet') || type.includes('excel')) return '📊';
        if (type.includes('document') || type.includes('word')) return '📝';
        if (type.includes('image')) return '🖼️';
        if (type.includes('text')) return '📃';
        return '📎';
    }

    _formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    _getFileType(mimeType) {
        if (mimeType.includes('pdf')) return 'PDF';
        if (mimeType.includes('sheet')) return 'Excel';
        if (mimeType.includes('document')) return 'Word';
        if (mimeType.includes('image')) return 'Image';
        if (mimeType.includes('text')) return 'Texte';
        return 'Document';
    }
}

customElements.define('document-upload-modal', DocumentUploadModal);
