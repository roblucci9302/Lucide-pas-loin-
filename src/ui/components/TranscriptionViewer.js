import { html, css, LitElement } from '../assets/lit-core-2.7.4.min.js';

/**
 * TranscriptionViewer Component
 * Phase 6: Transcription Center - Detailed view of a transcription
 *
 * Features:
 * - View full transcription with segments
 * - Edit title and description
 * - Generate meeting minutes
 * - View insights
 * - Add/view notes
 */
export class TranscriptionViewer extends LitElement {
    static properties = {
        transcription: { type: Object },
        isEditing: { type: Boolean },
        activeTab: { type: String }, // 'transcript', 'insights', 'notes'
        isGenerating: { type: Boolean },
        selectedFormat: { type: String }, // 'markdown', 'pdf', 'docx'
        selectedTemplate: { type: String } // 'meeting_minutes', 'phone_call_summary', etc.
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

        .viewer {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        /* Header Section */
        .header {
            padding: 20px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
        }

        .title-section {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            margin-bottom: 16px;
        }

        .title {
            font-size: 24px;
            font-weight: 700;
            color: rgba(255, 255, 255, 0.95);
            line-height: 1.3;
        }

        .title-input {
            width: 100%;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 8px 12px;
            font-size: 24px;
            font-weight: 700;
            color: rgba(255, 255, 255, 0.95);
            outline: none;
        }

        .title-input:focus {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(129, 140, 248, 0.4);
        }

        .header-actions {
            display: flex;
            gap: 8px;
        }

        .action-btn {
            padding: 8px 16px;
            background: rgba(129, 140, 248, 0.15);
            border: 1px solid rgba(129, 140, 248, 0.3);
            border-radius: 8px;
            color: rgba(129, 140, 248, 0.95);
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .action-btn:hover {
            background: rgba(129, 140, 248, 0.25);
            border-color: rgba(129, 140, 248, 0.4);
        }

        .action-btn.generating {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .format-selector {
            padding: 8px 12px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            color: rgba(255, 255, 255, 0.85);
            font-size: 13px;
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .format-selector:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(255, 255, 255, 0.2);
        }

        .format-selector:focus {
            outline: none;
            border-color: rgba(129, 140, 248, 0.4);
        }

        .metadata {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
        }

        .meta-item {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .meta-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: rgba(255, 255, 255, 0.5);
        }

        .meta-value {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.85);
        }

        /* Tabs */
        .tabs {
            display: flex;
            gap: 4px;
            padding: 4px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 10px;
        }

        .tab {
            flex: 1;
            padding: 10px 16px;
            background: transparent;
            border: none;
            border-radius: 8px;
            color: rgba(255, 255, 255, 0.6);
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .tab.active {
            background: rgba(129, 140, 248, 0.2);
            color: rgba(129, 140, 248, 0.95);
        }

        .tab:hover:not(.active) {
            background: rgba(255, 255, 255, 0.05);
            color: rgba(255, 255, 255, 0.8);
        }

        /* Content Section */
        .content {
            padding: 20px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            max-height: 600px;
            overflow-y: auto;
        }

        /* Transcript View */
        .transcript-list {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .segment {
            display: flex;
            gap: 12px;
            padding: 12px;
            background: rgba(255, 255, 255, 0.02);
            border-radius: 8px;
        }

        .segment-time {
            flex-shrink: 0;
            width: 80px;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.4);
            font-family: 'Monaco', monospace;
        }

        .segment-content {
            flex: 1;
        }

        .segment-speaker {
            font-size: 13px;
            font-weight: 600;
            color: rgba(129, 140, 248, 0.9);
            margin-bottom: 4px;
        }

        .segment-text {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.8);
            line-height: 1.6;
            user-select: text;
        }

        /* Insights View */
        .insights-list {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .insight {
            padding: 16px;
            background: rgba(74, 222, 128, 0.1);
            border: 1px solid rgba(74, 222, 128, 0.2);
            border-radius: 10px;
        }

        .insight-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
        }

        .insight-type {
            font-size: 12px;
            font-weight: 600;
            color: rgba(74, 222, 128, 0.9);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .insight-title {
            font-size: 15px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.9);
            margin-bottom: 8px;
        }

        .insight-content {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.75);
            line-height: 1.6;
            white-space: pre-wrap;
            user-select: text;
        }

        /* Empty States */
        .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: rgba(255, 255, 255, 0.4);
        }

        .empty-icon {
            font-size: 48px;
            margin-bottom: 12px;
        }

        .empty-text {
            font-size: 14px;
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
        this.transcription = null;
        this.isEditing = false;
        this.activeTab = 'transcript'; // 'transcript', 'insights', 'notes'
        this.isGenerating = false;
        this.selectedFormat = 'markdown'; // Default format
        this.selectedTemplate = 'meeting_minutes'; // Default template
    }

    render() {
        if (!this.transcription) {
            return html`<div class="empty-state">No transcription selected</div>`;
        }

        const { title, summary, duration, participants, tags, start_at, end_at, status, transcript_count, word_count, language } = this.transcription;

        return html`
            <div class="viewer">
                <!-- Header -->
                <div class="header">
                    <div class="title-section">
                        ${this.isEditing ? html`
                            <input
                                type="text"
                                class="title-input"
                                .value="${title || ''}"
                                @blur="${this._handleTitleBlur}"
                            />
                        ` : html`
                            <h1 class="title">${title || 'Untitled Transcription'}</h1>
                        `}

                        <div class="header-actions">
                            <select
                                class="format-selector"
                                .value="${this.selectedTemplate}"
                                @change="${e => this.selectedTemplate = e.target.value}"
                                title="Choose template"
                            >
                                <option value="meeting_minutes">Meeting Minutes</option>
                                <option value="phone_call_summary">Phone Call Summary</option>
                                <option value="interview_notes">Interview Notes</option>
                                <option value="lecture_notes">Lecture Notes</option>
                            </select>

                            <select
                                class="format-selector"
                                .value="${this.selectedFormat}"
                                @change="${e => this.selectedFormat = e.target.value}"
                                title="Choose format"
                            >
                                <option value="markdown">📝 Markdown</option>
                                <option value="pdf">📄 PDF</option>
                                <option value="docx">📃 Word</option>
                            </select>

                            <button
                                class="action-btn ${this.isGenerating ? 'generating' : ''}"
                                @click="${this._handleGenerateMinutes}"
                                ?disabled="${this.isGenerating}"
                            >
                                📄 ${this.isGenerating ? 'Generating...' : 'Generate Report'}
                            </button>
                        </div>
                    </div>

                    <div class="metadata">
                        <div class="meta-item">
                            <div class="meta-label">Date</div>
                            <div class="meta-value">${this.formatDate(start_at)}</div>
                        </div>
                        <div class="meta-item">
                            <div class="meta-label">Duration</div>
                            <div class="meta-value">${this.formatDuration(duration)}</div>
                        </div>
                        <div class="meta-item">
                            <div class="meta-label">Segments</div>
                            <div class="meta-value">${transcript_count || 0}</div>
                        </div>
                        <div class="meta-item">
                            <div class="meta-label">Words</div>
                            <div class="meta-value">${word_count || 0}</div>
                        </div>
                        <div class="meta-item">
                            <div class="meta-label">Participants</div>
                            <div class="meta-value">${participants?.join(', ') || 'Unknown'}</div>
                        </div>
                        <div class="meta-item">
                            <div class="meta-label">Language</div>
                            <div class="meta-value">${language || 'en'}</div>
                        </div>
                    </div>
                </div>

                <!-- Tabs -->
                <div class="tabs">
                    <button
                        class="tab ${this.activeTab === 'transcript' ? 'active' : ''}"
                        @click="${() => this.activeTab = 'transcript'}"
                    >
                        📝 Transcript (${this.transcription.segments?.length || 0})
                    </button>
                    <button
                        class="tab ${this.activeTab === 'insights' ? 'active' : ''}"
                        @click="${() => this.activeTab = 'insights'}"
                    >
                        💡 Insights (${this.transcription.insights?.length || 0})
                    </button>
                    <button
                        class="tab ${this.activeTab === 'notes' ? 'active' : ''}"
                        @click="${() => this.activeTab = 'notes'}"
                    >
                        📌 Notes (${this.transcription.notes?.length || 0})
                    </button>
                </div>

                <!-- Content -->
                <div class="content">
                    ${this._renderTabContent()}
                </div>
            </div>
        `;
    }

    _renderTabContent() {
        if (this.activeTab === 'transcript') {
            return this._renderTranscript();
        } else if (this.activeTab === 'insights') {
            return this._renderInsights();
        } else if (this.activeTab === 'notes') {
            return this._renderNotes();
        }
    }

    _renderTranscript() {
        const segments = this.transcription.segments || [];

        if (segments.length === 0) {
            return html`
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <div class="empty-text">No transcript segments available</div>
                </div>
            `;
        }

        return html`
            <div class="transcript-list">
                ${segments.map(segment => html`
                    <div class="segment">
                        <div class="segment-time">${this.formatTimestamp(segment.start_at)}</div>
                        <div class="segment-content">
                            <div class="segment-speaker">${segment.speaker}</div>
                            <div class="segment-text">${segment.text}</div>
                        </div>
                    </div>
                `)}
            </div>
        `;
    }

    _renderInsights() {
        const insights = this.transcription.insights || [];

        if (insights.length === 0) {
            return html`
                <div class="empty-state">
                    <div class="empty-icon">💡</div>
                    <div class="empty-text">No insights yet. Generate meeting minutes to create insights.</div>
                </div>
            `;
        }

        return html`
            <div class="insights-list">
                ${insights.map(insight => html`
                    <div class="insight">
                        <div class="insight-header">
                            <div class="insight-type">${insight.insight_type.replace(/_/g, ' ')}</div>
                        </div>
                        ${insight.title ? html`
                            <div class="insight-title">${insight.title}</div>
                        ` : ''}
                        <div class="insight-content">${insight.content}</div>
                    </div>
                `)}
            </div>
        `;
    }

    _renderNotes() {
        const notes = this.transcription.notes || [];

        if (notes.length === 0) {
            return html`
                <div class="empty-state">
                    <div class="empty-icon">📌</div>
                    <div class="empty-text">No notes yet. Add notes to remember important points.</div>
                </div>
            `;
        }

        return html`
            <div class="insights-list">
                ${notes.map(note => html`
                    <div class="insight">
                        <div class="insight-type">${note.note_type}</div>
                        <div class="insight-content">${note.note_text}</div>
                    </div>
                `)}
            </div>
        `;
    }

    async _handleGenerateMinutes() {
        this.isGenerating = true;

        this.dispatchEvent(new CustomEvent('generate-minutes', {
            detail: {
                transcriptionId: this.transcription.id,
                format: this.selectedFormat,
                templateId: this.selectedTemplate
            },
            bubbles: true,
            composed: true
        }));

        // Reset after a delay (will be updated by parent component)
        setTimeout(() => {
            this.isGenerating = false;
        }, 2000);
    }

    _handleTitleBlur(e) {
        const newTitle = e.target.value.trim();
        if (newTitle !== this.transcription.title) {
            this.dispatchEvent(new CustomEvent('update-transcription', {
                detail: {
                    transcriptionId: this.transcription.id,
                    updates: { title: newTitle }
                },
                bubbles: true,
                composed: true
            }));
        }
        this.isEditing = false;
    }

    formatDate(timestamp) {
        if (!timestamp) return 'Unknown';
        const date = new Date(timestamp * 1000);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatDuration(seconds) {
        if (!seconds) return '0m';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
}

customElements.define('transcription-viewer', TranscriptionViewer);
