const sqliteClient = require('../../../common/services/sqliteClient');
const crypto = require('crypto');

/**
 * Transcription Repository - SQLite Implementation
 * Manages transcriptions (aggregated metadata) and related entities
 */

/**
 * Create a new transcription (aggregated from transcript segments)
 */
function createTranscription({ uid, sessionId, title, description, duration, participants, tags, summary, language, status = 'completed' }) {
    const db = sqliteClient.getDb();
    const transcriptionId = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    const query = `
        INSERT INTO transcriptions (
            id, session_id, uid, title, description, duration,
            participants, tags, summary, transcript_count, word_count,
            start_at, end_at, language, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
        db.prepare(query).run(
            transcriptionId,
            sessionId,
            uid,
            title || null,
            description || null,
            duration || 0,
            participants ? JSON.stringify(participants) : JSON.stringify(['Me', 'Them']),
            tags ? JSON.stringify(tags) : JSON.stringify([]),
            summary || null,
            0, // transcript_count (will be updated when segments are added)
            0, // word_count (will be updated when segments are added)
            now,
            now,
            language || 'en',
            status,
            now,
            now
        );

        return { id: transcriptionId };
    } catch (err) {
        console.error('[TranscriptionRepo] Error creating transcription:', err);
        throw err;
    }
}

/**
 * Get all transcriptions for a user
 */
function getAllByUserId(uid, options = {}) {
    const db = sqliteClient.getDb();
    const { limit = 50, offset = 0, orderBy = 'start_at', orderDir = 'DESC' } = options;

    const query = `
        SELECT * FROM transcriptions
        WHERE uid = ?
        ORDER BY ${orderBy} ${orderDir}
        LIMIT ? OFFSET ?
    `;

    try {
        const rows = db.prepare(query).all(uid, limit, offset);
        return rows.map(row => ({
            ...row,
            participants: row.participants ? JSON.parse(row.participants) : [],
            tags: row.tags ? JSON.parse(row.tags) : []
        }));
    } catch (err) {
        console.error('[TranscriptionRepo] Error getting transcriptions:', err);
        throw err;
    }
}

/**
 * Get a single transcription by ID
 */
function getById(transcriptionId) {
    const db = sqliteClient.getDb();
    const query = 'SELECT * FROM transcriptions WHERE id = ?';

    try {
        const row = db.prepare(query).get(transcriptionId);
        if (!row) return null;

        return {
            ...row,
            participants: row.participants ? JSON.parse(row.participants) : [],
            tags: row.tags ? JSON.parse(row.tags) : []
        };
    } catch (err) {
        console.error('[TranscriptionRepo] Error getting transcription:', err);
        throw err;
    }
}

/**
 * Get transcription by session ID
 */
function getBySessionId(sessionId) {
    const db = sqliteClient.getDb();
    const query = 'SELECT * FROM transcriptions WHERE session_id = ?';

    try {
        const row = db.prepare(query).get(sessionId);
        if (!row) return null;

        return {
            ...row,
            participants: row.participants ? JSON.parse(row.participants) : [],
            tags: row.tags ? JSON.parse(row.tags) : []
        };
    } catch (err) {
        console.error('[TranscriptionRepo] Error getting transcription by session:', err);
        throw err;
    }
}

/**
 * Update a transcription
 */
function updateTranscription(transcriptionId, updates) {
    const db = sqliteClient.getDb();
    const now = Math.floor(Date.now() / 1000);

    const allowedFields = ['title', 'description', 'duration', 'participants', 'tags', 'summary', 'transcript_count', 'word_count', 'language', 'status'];
    const updateFields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
            updateFields.push(`${key} = ?`);
            if (key === 'participants' || key === 'tags') {
                values.push(JSON.stringify(value));
            } else {
                values.push(value);
            }
        }
    }

    if (updateFields.length === 0) {
        console.warn('[TranscriptionRepo] No valid fields to update');
        return false;
    }

    updateFields.push('updated_at = ?');
    values.push(now, transcriptionId);

    const query = `UPDATE transcriptions SET ${updateFields.join(', ')} WHERE id = ?`;

    try {
        const result = db.prepare(query).run(...values);
        return result.changes > 0;
    } catch (err) {
        console.error('[TranscriptionRepo] Error updating transcription:', err);
        throw err;
    }
}

/**
 * Delete a transcription (cascades to segments, insights, notes via DB constraints)
 */
function deleteTranscription(transcriptionId) {
    const db = sqliteClient.getDb();
    const query = 'DELETE FROM transcriptions WHERE id = ?';

    try {
        const result = db.prepare(query).run(transcriptionId);
        return result.changes > 0;
    } catch (err) {
        console.error('[TranscriptionRepo] Error deleting transcription:', err);
        throw err;
    }
}

/**
 * Search transcriptions by text (title, description, summary)
 */
function searchTranscriptions(uid, searchTerm, options = {}) {
    const db = sqliteClient.getDb();
    const { limit = 20 } = options;
    const searchPattern = `%${searchTerm}%`;

    const query = `
        SELECT * FROM transcriptions
        WHERE uid = ?
        AND (title LIKE ? OR description LIKE ? OR summary LIKE ?)
        ORDER BY start_at DESC
        LIMIT ?
    `;

    try {
        const rows = db.prepare(query).all(uid, searchPattern, searchPattern, searchPattern, limit);
        return rows.map(row => ({
            ...row,
            participants: row.participants ? JSON.parse(row.participants) : [],
            tags: row.tags ? JSON.parse(row.tags) : []
        }));
    } catch (err) {
        console.error('[TranscriptionRepo] Error searching transcriptions:', err);
        throw err;
    }
}

/**
 * Get count of transcriptions for a user
 */
function getCountByUserId(uid) {
    const db = sqliteClient.getDb();
    const query = 'SELECT COUNT(*) as count FROM transcriptions WHERE uid = ?';

    try {
        const result = db.prepare(query).get(uid);
        return result.count;
    } catch (err) {
        console.error('[TranscriptionRepo] Error counting transcriptions:', err);
        throw err;
    }
}

// ====== Transcription Segments ======

/**
 * Add a segment to a transcription
 */
function addSegment({ transcriptionId, speaker, speakerLabel, text, startAt, endAt, duration, confidence, language }) {
    const db = sqliteClient.getDb();
    const segmentId = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    const query = `
        INSERT INTO transcription_segments (
            id, transcription_id, speaker, speaker_label, text,
            start_at, end_at, duration, confidence, language, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
        db.prepare(query).run(
            segmentId,
            transcriptionId,
            speaker,
            speakerLabel || null,
            text,
            startAt,
            endAt,
            duration || (endAt - startAt),
            confidence || null,
            language || null,
            now
        );

        return { id: segmentId };
    } catch (err) {
        console.error('[TranscriptionRepo] Error adding segment:', err);
        throw err;
    }
}

/**
 * Get all segments for a transcription
 */
function getSegmentsByTranscriptionId(transcriptionId) {
    const db = sqliteClient.getDb();
    const query = 'SELECT * FROM transcription_segments WHERE transcription_id = ? ORDER BY start_at ASC';

    try {
        return db.prepare(query).all(transcriptionId);
    } catch (err) {
        console.error('[TranscriptionRepo] Error getting segments:', err);
        throw err;
    }
}

// ====== Transcription Insights ======

/**
 * Add an insight to a transcription
 */
function addInsight({ transcriptionId, insightType, title, content, metadata, model, tokensUsed, confidence }) {
    const db = sqliteClient.getDb();
    const insightId = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    const query = `
        INSERT INTO transcription_insights (
            id, transcription_id, insight_type, title, content,
            metadata, generated_at, model, tokens_used, confidence, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
        db.prepare(query).run(
            insightId,
            transcriptionId,
            insightType,
            title || null,
            content,
            metadata ? JSON.stringify(metadata) : null,
            now,
            model || null,
            tokensUsed || null,
            confidence || null,
            now
        );

        return { id: insightId };
    } catch (err) {
        console.error('[TranscriptionRepo] Error adding insight:', err);
        throw err;
    }
}

/**
 * Get all insights for a transcription
 */
function getInsightsByTranscriptionId(transcriptionId) {
    const db = sqliteClient.getDb();
    const query = 'SELECT * FROM transcription_insights WHERE transcription_id = ? ORDER BY generated_at DESC';

    try {
        const rows = db.prepare(query).all(transcriptionId);
        return rows.map(row => ({
            ...row,
            metadata: row.metadata ? JSON.parse(row.metadata) : null
        }));
    } catch (err) {
        console.error('[TranscriptionRepo] Error getting insights:', err);
        throw err;
    }
}

/**
 * Get insights by type for a transcription
 */
function getInsightsByType(transcriptionId, insightType) {
    const db = sqliteClient.getDb();
    const query = 'SELECT * FROM transcription_insights WHERE transcription_id = ? AND insight_type = ? ORDER BY generated_at DESC';

    try {
        const rows = db.prepare(query).all(transcriptionId, insightType);
        return rows.map(row => ({
            ...row,
            metadata: row.metadata ? JSON.parse(row.metadata) : null
        }));
    } catch (err) {
        console.error('[TranscriptionRepo] Error getting insights by type:', err);
        throw err;
    }
}

// ====== Transcription Notes ======

/**
 * Add a note to a transcription
 */
function addNote({ transcriptionId, uid, noteText, segmentId, timestampRef, tags, noteType = 'general', createdBy }) {
    const db = sqliteClient.getDb();
    const noteId = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    const query = `
        INSERT INTO transcription_notes (
            id, transcription_id, uid, note_text, segment_id,
            timestamp_ref, tags, note_type, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
        db.prepare(query).run(
            noteId,
            transcriptionId,
            uid,
            noteText,
            segmentId || null,
            timestampRef || null,
            tags ? JSON.stringify(tags) : null,
            noteType,
            createdBy || uid,
            now,
            now
        );

        return { id: noteId };
    } catch (err) {
        console.error('[TranscriptionRepo] Error adding note:', err);
        throw err;
    }
}

/**
 * Get all notes for a transcription
 */
function getNotesByTranscriptionId(transcriptionId) {
    const db = sqliteClient.getDb();
    const query = 'SELECT * FROM transcription_notes WHERE transcription_id = ? ORDER BY created_at DESC';

    try {
        const rows = db.prepare(query).all(transcriptionId);
        return rows.map(row => ({
            ...row,
            tags: row.tags ? JSON.parse(row.tags) : []
        }));
    } catch (err) {
        console.error('[TranscriptionRepo] Error getting notes:', err);
        throw err;
    }
}

/**
 * Update a note
 */
function updateNote(noteId, { noteText, tags, noteType }) {
    const db = sqliteClient.getDb();
    const now = Math.floor(Date.now() / 1000);

    const updateFields = [];
    const values = [];

    if (noteText !== undefined) {
        updateFields.push('note_text = ?');
        values.push(noteText);
    }
    if (tags !== undefined) {
        updateFields.push('tags = ?');
        values.push(JSON.stringify(tags));
    }
    if (noteType !== undefined) {
        updateFields.push('note_type = ?');
        values.push(noteType);
    }

    if (updateFields.length === 0) return false;

    updateFields.push('updated_at = ?');
    values.push(now, noteId);

    const query = `UPDATE transcription_notes SET ${updateFields.join(', ')} WHERE id = ?`;

    try {
        const result = db.prepare(query).run(...values);
        return result.changes > 0;
    } catch (err) {
        console.error('[TranscriptionRepo] Error updating note:', err);
        throw err;
    }
}

/**
 * Delete a note
 */
function deleteNote(noteId) {
    const db = sqliteClient.getDb();
    const query = 'DELETE FROM transcription_notes WHERE id = ?';

    try {
        const result = db.prepare(query).run(noteId);
        return result.changes > 0;
    } catch (err) {
        console.error('[TranscriptionRepo] Error deleting note:', err);
        throw err;
    }
}

module.exports = {
    // Transcriptions
    createTranscription,
    getAllByUserId,
    getById,
    getBySessionId,
    updateTranscription,
    deleteTranscription,
    searchTranscriptions,
    getCountByUserId,

    // Segments
    addSegment,
    getSegmentsByTranscriptionId,

    // Insights
    addInsight,
    getInsightsByTranscriptionId,
    getInsightsByType,

    // Notes
    addNote,
    getNotesByTranscriptionId,
    updateNote,
    deleteNote
};
