/**
 * Transcription Edit Service - Phase 6.3: Édition avancée
 *
 * Provides advanced editing capabilities for transcriptions:
 * - Edit segment text
 * - Merge/split segments
 * - Rename/merge speakers
 * - Add annotations (highlights, bookmarks)
 * - Undo/redo history
 */

const transcriptionRepository = require('./repositories');
const crypto = require('crypto');

class TranscriptionEditService {
    constructor() {
        this.editHistory = new Map(); // transcriptionId -> history stack
        this.maxHistorySize = 50;
        console.log('[TranscriptionEditService] Service initialized');
    }

    // ====== Segment Editing ======

    /**
     * Update segment text
     * @param {string} segmentId - Segment ID
     * @param {string} newText - New text content
     * @param {string} transcriptionId - Transcription ID (for history)
     * @returns {Object} Updated segment
     */
    updateSegmentText(segmentId, newText, transcriptionId) {
        console.log(`[TranscriptionEditService] Updating segment ${segmentId}`);

        // Get current segment
        const segments = transcriptionRepository.getSegmentsByTranscriptionId(transcriptionId);
        const segment = segments.find(s => s.id === segmentId);

        if (!segment) {
            throw new Error(`Segment not found: ${segmentId}`);
        }

        // Save to history
        this.addToHistory(transcriptionId, {
            type: 'edit_segment',
            segmentId,
            oldText: segment.text,
            newText,
            timestamp: Date.now()
        });

        // Update in database (we'll need to add this method to repository)
        const db = require('../../common/services/sqliteClient').getDb();
        const query = 'UPDATE transcription_segments SET text = ? WHERE id = ?';
        db.prepare(query).run(newText, segmentId);

        // Update word count in transcription
        this.updateTranscriptionWordCount(transcriptionId);

        return { ...segment, text: newText };
    }

    /**
     * Merge two consecutive segments
     * @param {string} segmentId1 - First segment ID
     * @param {string} segmentId2 - Second segment ID
     * @param {string} transcriptionId - Transcription ID
     * @returns {Object} Merged segment
     */
    mergeSegments(segmentId1, segmentId2, transcriptionId) {
        console.log(`[TranscriptionEditService] Merging segments ${segmentId1} and ${segmentId2}`);

        const segments = transcriptionRepository.getSegmentsByTranscriptionId(transcriptionId);
        const segment1 = segments.find(s => s.id === segmentId1);
        const segment2 = segments.find(s => s.id === segmentId2);

        if (!segment1 || !segment2) {
            throw new Error('One or both segments not found');
        }

        // Verify same speaker
        if (segment1.speaker !== segment2.speaker) {
            throw new Error('Cannot merge segments from different speakers');
        }

        // Create merged segment
        const mergedText = segment1.text + ' ' + segment2.text;
        const mergedDuration = (segment2.end_at - segment1.start_at);

        // Save to history
        this.addToHistory(transcriptionId, {
            type: 'merge_segments',
            segment1Id: segmentId1,
            segment2Id: segmentId2,
            segment1Data: segment1,
            segment2Data: segment2,
            timestamp: Date.now()
        });

        const db = require('../../common/services/sqliteClient').getDb();

        // Update first segment
        db.prepare(`
            UPDATE transcription_segments
            SET text = ?, end_at = ?, duration = ?
            WHERE id = ?
        `).run(mergedText, segment2.end_at, mergedDuration, segmentId1);

        // Delete second segment
        db.prepare('DELETE FROM transcription_segments WHERE id = ?').run(segmentId2);

        // Update counts
        this.updateTranscriptionCounts(transcriptionId);

        return { ...segment1, text: mergedText, end_at: segment2.end_at, duration: mergedDuration };
    }

    /**
     * Split a segment at a specific position
     * @param {string} segmentId - Segment ID to split
     * @param {number} splitPosition - Character position to split at
     * @param {string} transcriptionId - Transcription ID
     * @returns {Array} Two new segments
     */
    splitSegment(segmentId, splitPosition, transcriptionId) {
        console.log(`[TranscriptionEditService] Splitting segment ${segmentId} at position ${splitPosition}`);

        const segments = transcriptionRepository.getSegmentsByTranscriptionId(transcriptionId);
        const segment = segments.find(s => s.id === segmentId);

        if (!segment) {
            throw new Error(`Segment not found: ${segmentId}`);
        }

        if (splitPosition <= 0 || splitPosition >= segment.text.length) {
            throw new Error('Invalid split position');
        }

        // Split text
        const text1 = segment.text.substring(0, splitPosition).trim();
        const text2 = segment.text.substring(splitPosition).trim();

        // Calculate approximate time split (proportional to text length)
        const ratio = text1.length / segment.text.length;
        const duration = segment.end_at - segment.start_at;
        const splitTime = segment.start_at + Math.floor(duration * ratio);

        // Save to history
        this.addToHistory(transcriptionId, {
            type: 'split_segment',
            segmentId,
            originalSegment: segment,
            splitPosition,
            timestamp: Date.now()
        });

        const db = require('../../common/services/sqliteClient').getDb();
        const newSegmentId = crypto.randomUUID();

        // Update first segment
        db.prepare(`
            UPDATE transcription_segments
            SET text = ?, end_at = ?, duration = ?
            WHERE id = ?
        `).run(text1, splitTime, splitTime - segment.start_at, segmentId);

        // Create second segment
        db.prepare(`
            INSERT INTO transcription_segments
            (id, transcription_id, speaker, speaker_label, text, start_at, end_at, duration, confidence, language, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            newSegmentId,
            transcriptionId,
            segment.speaker,
            segment.speaker_label,
            text2,
            splitTime,
            segment.end_at,
            segment.end_at - splitTime,
            segment.confidence,
            segment.language,
            Math.floor(Date.now() / 1000)
        );

        // Update counts
        this.updateTranscriptionCounts(transcriptionId);

        return [
            { ...segment, text: text1, end_at: splitTime, duration: splitTime - segment.start_at },
            {
                id: newSegmentId,
                text: text2,
                start_at: splitTime,
                end_at: segment.end_at,
                duration: segment.end_at - splitTime,
                speaker: segment.speaker
            }
        ];
    }

    // ====== Speaker Management ======

    /**
     * Rename a speaker across all segments
     * @param {string} transcriptionId - Transcription ID
     * @param {string} oldName - Old speaker name
     * @param {string} newName - New speaker name
     * @returns {number} Number of segments updated
     */
    renameSpeaker(transcriptionId, oldName, newName) {
        console.log(`[TranscriptionEditService] Renaming speaker "${oldName}" to "${newName}"`);

        // Save to history
        this.addToHistory(transcriptionId, {
            type: 'rename_speaker',
            oldName,
            newName,
            timestamp: Date.now()
        });

        const db = require('../../common/services/sqliteClient').getDb();

        // Update all segments with this speaker
        const result = db.prepare(`
            UPDATE transcription_segments
            SET speaker = ?
            WHERE transcription_id = ? AND speaker = ?
        `).run(newName, transcriptionId, oldName);

        // Update participants list in transcription
        const transcription = transcriptionRepository.getById(transcriptionId);
        if (transcription && transcription.participants) {
            const participants = transcription.participants.map(p => p === oldName ? newName : p);
            transcriptionRepository.updateTranscription(transcriptionId, { participants });
        }

        return result.changes;
    }

    /**
     * Merge two speakers (replace all occurrences of speaker2 with speaker1)
     * @param {string} transcriptionId - Transcription ID
     * @param {string} speaker1 - Primary speaker name (keep this)
     * @param {string} speaker2 - Secondary speaker name (replace with speaker1)
     * @returns {number} Number of segments updated
     */
    mergeSpeakers(transcriptionId, speaker1, speaker2) {
        console.log(`[TranscriptionEditService] Merging speaker "${speaker2}" into "${speaker1}"`);

        // Save to history
        this.addToHistory(transcriptionId, {
            type: 'merge_speakers',
            speaker1,
            speaker2,
            timestamp: Date.now()
        });

        const db = require('../../common/services/sqliteClient').getDb();

        // Update all segments with speaker2 to speaker1
        const result = db.prepare(`
            UPDATE transcription_segments
            SET speaker = ?
            WHERE transcription_id = ? AND speaker = ?
        `).run(speaker1, transcriptionId, speaker2);

        // Update participants list
        const transcription = transcriptionRepository.getById(transcriptionId);
        if (transcription && transcription.participants) {
            const participants = transcription.participants
                .map(p => p === speaker2 ? speaker1 : p)
                .filter((p, i, arr) => arr.indexOf(p) === i); // Remove duplicates
            transcriptionRepository.updateTranscription(transcriptionId, { participants });
        }

        return result.changes;
    }

    // ====== Annotations ======

    /**
     * Add a highlight annotation to a segment
     * @param {string} segmentId - Segment ID
     * @param {number} startPos - Start character position
     * @param {number} endPos - End character position
     * @param {string} color - Highlight color
     * @param {string} note - Optional note
     * @returns {Object} Created annotation
     */
    addHighlight(segmentId, startPos, endPos, color = 'yellow', note = '') {
        console.log(`[TranscriptionEditService] Adding highlight to segment ${segmentId}`);

        // For MVP, we'll store highlights as JSON in segment metadata
        // In production, create a separate annotations table

        const annotationId = crypto.randomUUID();
        const annotation = {
            id: annotationId,
            type: 'highlight',
            segmentId,
            startPos,
            endPos,
            color,
            note,
            createdAt: Date.now()
        };

        return annotation;
    }

    /**
     * Add a bookmark to a segment
     * @param {string} transcriptionId - Transcription ID
     * @param {string} segmentId - Segment ID
     * @param {string} label - Bookmark label
     * @param {string} note - Optional note
     * @returns {Object} Created bookmark
     */
    addBookmark(transcriptionId, segmentId, label, note = '') {
        console.log(`[TranscriptionEditService] Adding bookmark to segment ${segmentId}`);

        // Use transcription_notes table with type='bookmark'
        const bookmark = transcriptionRepository.addNote({
            transcriptionId,
            uid: 'system', // TODO: get from context
            noteText: note || label,
            segmentId,
            tags: ['bookmark'],
            noteType: 'bookmark',
            createdBy: 'user'
        });

        return bookmark;
    }

    // ====== History Management ======

    /**
     * Add an action to edit history
     * @param {string} transcriptionId - Transcription ID
     * @param {Object} action - Action object
     */
    addToHistory(transcriptionId, action) {
        if (!this.editHistory.has(transcriptionId)) {
            this.editHistory.set(transcriptionId, []);
        }

        const history = this.editHistory.get(transcriptionId);
        history.push(action);

        // Limit history size
        if (history.length > this.maxHistorySize) {
            history.shift(); // Remove oldest
        }

        console.log(`[TranscriptionEditService] Added to history: ${action.type}`);
    }

    /**
     * Undo last action
     * @param {string} transcriptionId - Transcription ID
     * @returns {Object|null} Undone action or null
     */
    undo(transcriptionId) {
        if (!this.editHistory.has(transcriptionId)) {
            return null;
        }

        const history = this.editHistory.get(transcriptionId);
        if (history.length === 0) {
            return null;
        }

        const action = history.pop();
        console.log(`[TranscriptionEditService] Undoing: ${action.type}`);

        const db = require('../../common/services/sqliteClient').getDb();

        // Reverse the action
        switch (action.type) {
            case 'edit_segment':
                db.prepare('UPDATE transcription_segments SET text = ? WHERE id = ?')
                    .run(action.oldText, action.segmentId);
                break;

            case 'rename_speaker':
                db.prepare('UPDATE transcription_segments SET speaker = ? WHERE transcription_id = ? AND speaker = ?')
                    .run(action.oldName, transcriptionId, action.newName);
                break;

            case 'merge_speakers':
                db.prepare('UPDATE transcription_segments SET speaker = ? WHERE transcription_id = ? AND speaker = ?')
                    .run(action.speaker2, transcriptionId, action.speaker1);
                break;

            // Note: merge_segments and split_segment undo would require more complex logic
            // For MVP, we'll skip these

            default:
                console.warn(`[TranscriptionEditService] Undo not implemented for action type: ${action.type}`);
        }

        this.updateTranscriptionCounts(transcriptionId);

        return action;
    }

    /**
     * Get edit history for a transcription
     * @param {string} transcriptionId - Transcription ID
     * @returns {Array} History stack
     */
    getHistory(transcriptionId) {
        return this.editHistory.get(transcriptionId) || [];
    }

    /**
     * Clear edit history for a transcription
     * @param {string} transcriptionId - Transcription ID
     */
    clearHistory(transcriptionId) {
        this.editHistory.delete(transcriptionId);
        console.log(`[TranscriptionEditService] Cleared history for ${transcriptionId}`);
    }

    // ====== Utilities ======

    /**
     * Update word count for a transcription
     * @param {string} transcriptionId - Transcription ID
     */
    updateTranscriptionWordCount(transcriptionId) {
        const segments = transcriptionRepository.getSegmentsByTranscriptionId(transcriptionId);
        const fullText = segments.map(s => s.text).join(' ');
        const wordCount = fullText.split(/\s+/).filter(Boolean).length;

        transcriptionRepository.updateTranscription(transcriptionId, { word_count: wordCount });
    }

    /**
     * Update segment count and word count for a transcription
     * @param {string} transcriptionId - Transcription ID
     */
    updateTranscriptionCounts(transcriptionId) {
        const segments = transcriptionRepository.getSegmentsByTranscriptionId(transcriptionId);
        const fullText = segments.map(s => s.text).join(' ');
        const wordCount = fullText.split(/\s+/).filter(Boolean).length;

        transcriptionRepository.updateTranscription(transcriptionId, {
            transcript_count: segments.length,
            word_count: wordCount
        });
    }

    /**
     * Get all unique speakers in a transcription
     * @param {string} transcriptionId - Transcription ID
     * @returns {Array} List of speaker names
     */
    getSpeakers(transcriptionId) {
        const segments = transcriptionRepository.getSegmentsByTranscriptionId(transcriptionId);
        const speakers = [...new Set(segments.map(s => s.speaker))].filter(Boolean);
        return speakers;
    }

    /**
     * Get segment count by speaker
     * @param {string} transcriptionId - Transcription ID
     * @returns {Object} Speaker name -> count
     */
    getSegmentCountBySpeaker(transcriptionId) {
        const segments = transcriptionRepository.getSegmentsByTranscriptionId(transcriptionId);
        const counts = {};

        segments.forEach(seg => {
            const speaker = seg.speaker || 'Unknown';
            counts[speaker] = (counts[speaker] || 0) + 1;
        });

        return counts;
    }
}

// Singleton instance
const transcriptionEditService = new TranscriptionEditService();

module.exports = transcriptionEditService;
