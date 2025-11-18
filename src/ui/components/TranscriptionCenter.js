import { html, css, LitElement } from '../assets/lit-core-2.7.4.min.js';

/**
 * TranscriptionCenter Component
 * Phase 6: Transcription Center - Main container for transcription management
 *
 * Features:
 * - List all transcriptions
 * - Search transcriptions
 * - View/edit transcriptions
 * - Generate meeting minutes
 */
export class TranscriptionCenter extends LitElement {
    static properties = {
        transcriptions: { type: Array },
        isLoading: { type: Boolean },
        searchTerm: { type: String },
        selectedTranscription: { type: Object },
        viewMode: { type: String }, // 'list' or 'detail'
        statistics: { type: Object }
    };

    static styles = css`
        * {
            font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            cursor: default;
            user-select: none;
        }

        :host {
            display: block;
            width: 100%;
            height: 100%;
        }

        .transcription-center {
            display: flex;
            flex-direction: column;
            height: 100%;
            background: rgba(0, 0, 0, 0.4);
            border-radius: 12px;
            overflow: hidden;
        }

        /* Header */
        .header {
            padding: 20px 24px;
            background: rgba(0, 0, 0, 0.6);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .header-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
        }

        .header-title {
            font-size: 24px;
            font-weight: 700;
            color: rgba(255, 255, 255, 0.95);
        }

        .header-stats {
            display: flex;
            gap: 24px;
            font-size: 13px;
            color: rgba(255, 255, 255, 0.6);
        }

        .stat-item {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
        }

        .stat-value {
            font-size: 20px;
            font-weight: 600;
            color: rgba(129, 140, 248, 0.9);
        }

        .stat-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* Search Bar */
        .search-bar {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 16px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            transition: all 0.2s ease;
        }

        .search-bar:focus-within {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(129, 140, 248, 0.4);
        }

        .search-icon {
            font-size: 16px;
            color: rgba(255, 255, 255, 0.4);
        }

        .search-input {
            flex: 1;
            background: transparent;
            border: none;
            outline: none;
            color: rgba(255, 255, 255, 0.9);
            font-size: 14px;
        }

        .search-input::placeholder {
            color: rgba(255, 255, 255, 0.3);
        }

        /* Content Area */
        .content {
            flex: 1;
            overflow-y: auto;
            padding: 16px 24px;
        }

        /* Empty State */
        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            gap: 16px;
            color: rgba(255, 255, 255, 0.4);
        }

        .empty-icon {
            font-size: 64px;
        }

        .empty-message {
            font-size: 16px;
            font-weight: 500;
        }

        .empty-hint {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.3);
        }

        /* Loading State */
        .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            font-size: 16px;
            color: rgba(255, 255, 255, 0.5);
        }

        /* Transcription List */
        .transcription-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        /* Back Button (when in detail view) */
        .back-button {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            color: rgba(255, 255, 255, 0.8);
            font-size: 14px;
            cursor: pointer;
            transition: all 0.15s ease;
            margin-bottom: 16px;
            width: fit-content;
        }

        .back-button:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.2);
        }

        /* Scrollbar */
        .content::-webkit-scrollbar {
            width: 8px;
        }

        .content::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.2);
        }

        .content::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 4px;
        }

        .content::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.3);
        }
    `;

    constructor() {
        super();
        this.transcriptions = [];
        this.isLoading = true;
        this.searchTerm = '';
        this.selectedTranscription = null;
        this.viewMode = 'list'; // 'list' or 'detail'
        this.statistics = {
            total: 0,
            totalDuration: 0,
            totalWords: 0
        };
    }

    connectedCallback() {
        super.connectedCallback();
        this.loadTranscriptions();
        this.loadStatistics();
    }

    render() {
        return html`
            <div class="transcription-center">
                <!-- Header -->
                <div class="header">
                    <div class="header-top">
                        <h1 class="header-title">📼 Transcription Center</h1>
                        <div class="header-stats">
                            <div class="stat-item">
                                <div class="stat-value">${this.statistics.total}</div>
                                <div class="stat-label">Transcriptions</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">${this.formatDuration(this.statistics.totalDuration)}</div>
                                <div class="stat-label">Total Duration</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">${this.formatNumber(this.statistics.totalWords)}</div>
                                <div class="stat-label">Total Words</div>
                            </div>
                        </div>
                    </div>

                    <!-- Search Bar -->
                    ${this.viewMode === 'list' ? html`
                        <div class="search-bar">
                            <span class="search-icon">🔍</span>
                            <input
                                type="text"
                                class="search-input"
                                placeholder="Search transcriptions..."
                                .value="${this.searchTerm}"
                                @input="${this._handleSearch}"
                            />
                        </div>
                    ` : ''}
                </div>

                <!-- Content Area -->
                <div class="content">
                    ${this._renderContent()}
                </div>
            </div>
        `;
    }

    _renderContent() {
        if (this.isLoading) {
            return html`
                <div class="loading">
                    Loading transcriptions...
                </div>
            `;
        }

        if (this.viewMode === 'detail' && this.selectedTranscription) {
            return html`
                <button class="back-button" @click="${this._handleBackToList}">
                    ← Back to list
                </button>
                <transcription-viewer
                    .transcription="${this.selectedTranscription}"
                    @generate-minutes="${this._handleGenerateMinutes}"
                    @update-transcription="${this._handleUpdateTranscription}"
                ></transcription-viewer>
            `;
        }

        if (this.transcriptions.length === 0) {
            return html`
                <div class="empty-state">
                    <div class="empty-icon">📼</div>
                    <div class="empty-message">No transcriptions yet</div>
                    <div class="empty-hint">Transcriptions from your conversations will appear here</div>
                </div>
            `;
        }

        return html`
            <div class="transcription-list">
                ${this.transcriptions.map(transcription => html`
                    <transcription-card
                        .transcription="${transcription}"
                        @click="${() => this._handleSelectTranscription(transcription)}"
                        @delete="${() => this._handleDeleteTranscription(transcription.id)}"
                    ></transcription-card>
                `)}
            </div>
        `;
    }

    async loadTranscriptions() {
        this.isLoading = true;

        try {
            const result = await window.api.invoke('transcription:list', {
                limit: 100,
                offset: 0
            });

            if (result.success) {
                this.transcriptions = result.transcriptions;
            } else {
                console.error('Failed to load transcriptions:', result.error);
            }
        } catch (error) {
            console.error('Error loading transcriptions:', error);
        } finally {
            this.isLoading = false;
        }
    }

    async loadStatistics() {
        try {
            const result = await window.api.invoke('transcription:get-statistics');

            if (result.success) {
                this.statistics = result.statistics;
            }
        } catch (error) {
            console.error('Error loading statistics:', error);
        }
    }

    async _handleSearch(e) {
        this.searchTerm = e.target.value;

        if (this.searchTerm.trim() === '') {
            await this.loadTranscriptions();
            return;
        }

        try {
            const result = await window.api.invoke('transcription:search', {
                searchTerm: this.searchTerm,
                options: { limit: 50 }
            });

            if (result.success) {
                this.transcriptions = result.results;
            }
        } catch (error) {
            console.error('Error searching transcriptions:', error);
        }
    }

    _handleSelectTranscription(transcription) {
        this.selectedTranscription = transcription;
        this.viewMode = 'detail';
    }

    _handleBackToList() {
        this.selectedTranscription = null;
        this.viewMode = 'list';
        this.loadTranscriptions(); // Reload in case of updates
    }

    async _handleDeleteTranscription(transcriptionId) {
        if (!confirm('Are you sure you want to delete this transcription?')) {
            return;
        }

        try {
            const result = await window.api.invoke('transcription:delete', {
                transcriptionId
            });

            if (result.success) {
                await this.loadTranscriptions();
                await this.loadStatistics();
            } else {
                alert(`Failed to delete: ${result.error}`);
            }
        } catch (error) {
            console.error('Error deleting transcription:', error);
            alert('An error occurred while deleting the transcription');
        }
    }

    async _handleGenerateMinutes(e) {
        const { transcriptionId, format = 'markdown', templateId = 'meeting_minutes' } = e.detail;

        try {
            const result = await window.api.invoke('transcription:generate-meeting-minutes', {
                transcriptionId,
                options: {
                    format,
                    language: 'en',
                    templateId
                }
            });

            if (result.success) {
                alert(`Meeting minutes generated!\nSaved to: ${result.filePath}`);
                // Reload transcription to show new insight
                const updatedResult = await window.api.invoke('transcription:get', { transcriptionId });
                if (updatedResult.success) {
                    this.selectedTranscription = updatedResult.transcription;
                }
            } else {
                alert(`Failed to generate meeting minutes: ${result.error}`);
            }
        } catch (error) {
            console.error('Error generating meeting minutes:', error);
            alert('An error occurred while generating meeting minutes');
        }
    }

    async _handleUpdateTranscription(e) {
        const { transcriptionId, updates } = e.detail;

        try {
            const result = await window.api.invoke('transcription:update', {
                transcriptionId,
                updates
            });

            if (result.success) {
                this.selectedTranscription = result.transcription;
            } else {
                alert(`Failed to update: ${result.error}`);
            }
        } catch (error) {
            console.error('Error updating transcription:', error);
        }
    }

    formatDuration(seconds) {
        if (!seconds) return '0m';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }

    formatNumber(num) {
        if (!num) return '0';
        if (num >= 1000000) {
            return `${(num / 1000000).toFixed(1)}M`;
        }
        if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}K`;
        }
        return num.toString();
    }
}

customElements.define('transcription-center', TranscriptionCenter);
