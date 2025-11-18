import { html, css, LitElement } from '../assets/lit-core-2.7.4.min.js';

/**
 * TranscriptionCard Component
 * Phase 6: Transcription Center - Individual transcription card in list view
 *
 * Displays summary information for a transcription:
 * - Title
 * - Date/time
 * - Duration
 * - Participants
 * - Summary preview
 * - Tags
 */
export class TranscriptionCard extends LitElement {
    static properties = {
        transcription: { type: Object }
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

        .card {
            padding: 16px 20px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .card:hover {
            background: rgba(255, 255, 255, 0.06);
            border-color: rgba(129, 140, 248, 0.3);
            transform: translateY(-2px);
        }

        .card-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            margin-bottom: 12px;
        }

        .card-title {
            font-size: 16px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.95);
            margin-bottom: 4px;
            line-height: 1.4;
        }

        .card-date {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.5);
        }

        .card-actions {
            display: flex;
            gap: 8px;
        }

        .action-button {
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .action-button:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.2);
        }

        .delete-button:hover {
            background: rgba(239, 68, 68, 0.2);
            border-color: rgba(239, 68, 68, 0.4);
            color: #ef4444;
        }

        .card-meta {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 12px;
            flex-wrap: wrap;
        }

        .meta-item {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            color: rgba(255, 255, 255, 0.6);
        }

        .meta-icon {
            font-size: 14px;
        }

        .card-summary {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.65);
            line-height: 1.5;
            margin-bottom: 12px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .card-tags {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
        }

        .tag {
            padding: 4px 10px;
            background: rgba(129, 140, 248, 0.15);
            border: 1px solid rgba(129, 140, 248, 0.25);
            border-radius: 12px;
            font-size: 11px;
            color: rgba(129, 140, 248, 0.9);
            font-weight: 500;
        }

        .participants {
            display: flex;
            gap: 4px;
            flex-wrap: wrap;
        }

        .participant-badge {
            padding: 3px 8px;
            background: rgba(255, 255, 255, 0.08);
            border-radius: 10px;
            font-size: 11px;
            color: rgba(255, 255, 255, 0.7);
        }

        .status-badge {
            padding: 3px 8px;
            background: rgba(74, 222, 128, 0.15);
            border: 1px solid rgba(74, 222, 128, 0.3);
            border-radius: 10px;
            font-size: 11px;
            color: rgba(74, 222, 128, 0.9);
            font-weight: 500;
        }

        .status-badge.processing {
            background: rgba(251, 191, 36, 0.15);
            border-color: rgba(251, 191, 36, 0.3);
            color: rgba(251, 191, 36, 0.9);
        }
    `;

    constructor() {
        super();
        this.transcription = null;
    }

    render() {
        if (!this.transcription) {
            return html``;
        }

        const { title, summary, duration, participants, tags, start_at, status, transcript_count, word_count } = this.transcription;

        return html`
            <div class="card">
                <div class="card-header">
                    <div>
                        <div class="card-title">${title || 'Untitled Transcription'}</div>
                        <div class="card-date">${this.formatDate(start_at)}</div>
                    </div>
                    <div class="card-actions">
                        <button
                            class="action-button delete-button"
                            @click="${this._handleDelete}"
                            title="Delete transcription"
                        >
                            🗑️
                        </button>
                    </div>
                </div>

                <div class="card-meta">
                    <div class="meta-item">
                        <span class="meta-icon">⏱️</span>
                        <span>${this.formatDuration(duration)}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-icon">💬</span>
                        <span>${transcript_count || 0} segments</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-icon">📝</span>
                        <span>${this.formatNumber(word_count || 0)} words</span>
                    </div>
                    ${status ? html`
                        <div class="status-badge ${status !== 'completed' ? 'processing' : ''}">
                            ${status}
                        </div>
                    ` : ''}
                </div>

                ${participants && participants.length > 0 ? html`
                    <div class="card-meta">
                        <div class="meta-item">
                            <span class="meta-icon">👥</span>
                            <div class="participants">
                                ${participants.slice(0, 3).map(p => html`
                                    <span class="participant-badge">${p}</span>
                                `)}
                                ${participants.length > 3 ? html`
                                    <span class="participant-badge">+${participants.length - 3} more</span>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                ` : ''}

                ${summary ? html`
                    <div class="card-summary">${summary}</div>
                ` : ''}

                ${tags && tags.length > 0 ? html`
                    <div class="card-tags">
                        ${tags.map(tag => html`
                            <span class="tag">${tag}</span>
                        `)}
                    </div>
                ` : ''}
            </div>
        `;
    }

    _handleDelete(e) {
        e.stopPropagation(); // Prevent card click
        this.dispatchEvent(new CustomEvent('delete', {
            detail: { transcriptionId: this.transcription.id },
            bubbles: true,
            composed: true
        }));
    }

    formatDate(timestamp) {
        if (!timestamp) return 'Unknown date';
        const date = new Date(timestamp * 1000);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return 'Today ' + date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } else if (days === 1) {
            return 'Yesterday ' + date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } else if (days < 7) {
            return `${days} days ago`;
        } else {
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
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
        if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}K`;
        }
        return num.toString();
    }
}

customElements.define('transcription-card', TranscriptionCard);
