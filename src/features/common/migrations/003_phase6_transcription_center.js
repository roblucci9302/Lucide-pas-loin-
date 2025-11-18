/**
 * Migration 003: Phase 6 - Transcription Center Tables
 *
 * Creates tables for advanced transcription management:
 * - transcriptions (aggregated metadata)
 * - transcription_segments (detailed speaker segments)
 * - transcription_insights (AI analysis storage)
 * - transcription_notes (user notes)
 */

const logger = require('../utils/logger');

/**
 * Apply migration: Create Phase 6 tables and indexes
 * @param {Database} db - SQLite database instance
 */
function up(db) {
    logger.info('[Migration 003] Creating Phase 6: Transcription Center tables...');

    try {
        // 1. Transcriptions Table (Aggregated Metadata)
        db.exec(`
            CREATE TABLE IF NOT EXISTS transcriptions (
                id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                uid TEXT NOT NULL,
                -- Metadata
                title TEXT,
                description TEXT,
                duration INTEGER, -- in seconds
                participants TEXT, -- JSON array: ["Me", "Them", "Person Name"]
                tags TEXT, -- JSON array: ["meeting", "work", etc.]
                -- Content
                summary TEXT, -- AI-generated summary
                transcript_count INTEGER DEFAULT 0, -- Number of segments
                word_count INTEGER DEFAULT 0,
                -- Timestamps
                start_at INTEGER, -- Timestamp of first segment
                end_at INTEGER, -- Timestamp of last segment
                -- Language & Status
                language TEXT, -- Detected language (e.g., "fr", "en")
                status TEXT DEFAULT 'completed', -- 'recording', 'processing', 'completed', 'error'
                -- Metadata
                created_at INTEGER,
                updated_at INTEGER,
                sync_state TEXT DEFAULT 'clean'
            )
        `);

        // Indexes for transcriptions
        db.exec(`
            CREATE INDEX IF NOT EXISTS idx_transcriptions_uid
            ON transcriptions(uid);
        `);
        db.exec(`
            CREATE INDEX IF NOT EXISTS idx_transcriptions_session
            ON transcriptions(session_id);
        `);
        db.exec(`
            CREATE INDEX IF NOT EXISTS idx_transcriptions_date
            ON transcriptions(start_at DESC);
        `);
        db.exec(`
            CREATE INDEX IF NOT EXISTS idx_transcriptions_status
            ON transcriptions(status);
        `);
        db.exec(`
            CREATE INDEX IF NOT EXISTS idx_transcriptions_duration
            ON transcriptions(duration DESC);
        `);

        logger.info('[Migration 003] ✅ transcriptions table created');

        // 2. Transcription Segments Table (Detailed Speaker Segments)
        db.exec(`
            CREATE TABLE IF NOT EXISTS transcription_segments (
                id TEXT PRIMARY KEY,
                transcription_id TEXT NOT NULL,
                -- Speaker info
                speaker TEXT NOT NULL, -- "Me", "Them", or specific name
                speaker_label TEXT, -- Optional: "CEO", "Manager", etc.
                -- Content
                text TEXT NOT NULL,
                -- Timing
                start_at INTEGER NOT NULL, -- Timestamp in ms
                end_at INTEGER NOT NULL, -- Timestamp in ms
                duration INTEGER, -- Duration in ms
                -- Quality
                confidence REAL, -- 0-1: transcription confidence
                language TEXT, -- Segment language if different
                -- Metadata
                created_at INTEGER,
                sync_state TEXT DEFAULT 'clean',
                FOREIGN KEY (transcription_id) REFERENCES transcriptions(id) ON DELETE CASCADE
            )
        `);

        // Indexes for transcription_segments
        db.exec(`
            CREATE INDEX IF NOT EXISTS idx_segments_transcription
            ON transcription_segments(transcription_id);
        `);
        db.exec(`
            CREATE INDEX IF NOT EXISTS idx_segments_speaker
            ON transcription_segments(speaker);
        `);
        db.exec(`
            CREATE INDEX IF NOT EXISTS idx_segments_time
            ON transcription_segments(start_at ASC);
        `);
        db.exec(`
            CREATE INDEX IF NOT EXISTS idx_segments_search
            ON transcription_segments(text);
        `);

        logger.info('[Migration 003] ✅ transcription_segments table created');

        // 3. Transcription Insights Table (AI Analysis Storage)
        db.exec(`
            CREATE TABLE IF NOT EXISTS transcription_insights (
                id TEXT PRIMARY KEY,
                transcription_id TEXT NOT NULL,
                -- Insight type
                insight_type TEXT NOT NULL, -- 'summary', 'action_items', 'decisions', 'topics', 'sentiment', 'quiz'
                -- Content
                title TEXT,
                content TEXT NOT NULL, -- Main insight content
                metadata TEXT, -- JSON: type-specific data
                -- Generation info
                generated_at INTEGER,
                model TEXT, -- LLM model used
                tokens_used INTEGER,
                -- Quality
                confidence REAL, -- 0-1: insight quality score
                -- Metadata
                created_at INTEGER,
                sync_state TEXT DEFAULT 'clean',
                FOREIGN KEY (transcription_id) REFERENCES transcriptions(id) ON DELETE CASCADE
            )
        `);

        // Indexes for transcription_insights
        db.exec(`
            CREATE INDEX IF NOT EXISTS idx_insights_transcription
            ON transcription_insights(transcription_id);
        `);
        db.exec(`
            CREATE INDEX IF NOT EXISTS idx_insights_type
            ON transcription_insights(insight_type);
        `);
        db.exec(`
            CREATE INDEX IF NOT EXISTS idx_insights_date
            ON transcription_insights(generated_at DESC);
        `);

        logger.info('[Migration 003] ✅ transcription_insights table created');

        // 4. Transcription Notes Table (User Notes)
        db.exec(`
            CREATE TABLE IF NOT EXISTS transcription_notes (
                id TEXT PRIMARY KEY,
                transcription_id TEXT NOT NULL,
                uid TEXT NOT NULL,
                -- Note content
                note_text TEXT NOT NULL,
                -- Reference
                segment_id TEXT, -- Optional: reference to specific segment
                timestamp_ref INTEGER, -- Optional: timestamp reference
                -- Tags
                tags TEXT, -- JSON array: ["important", "todo", etc.]
                note_type TEXT DEFAULT 'general', -- 'general', 'action', 'question', 'highlight'
                -- Metadata
                created_by TEXT, -- User who created
                created_at INTEGER,
                updated_at INTEGER,
                sync_state TEXT DEFAULT 'clean',
                FOREIGN KEY (transcription_id) REFERENCES transcriptions(id) ON DELETE CASCADE,
                FOREIGN KEY (segment_id) REFERENCES transcription_segments(id) ON DELETE SET NULL
            )
        `);

        // Indexes for transcription_notes
        db.exec(`
            CREATE INDEX IF NOT EXISTS idx_notes_transcription
            ON transcription_notes(transcription_id);
        `);
        db.exec(`
            CREATE INDEX IF NOT EXISTS idx_notes_uid
            ON transcription_notes(uid);
        `);
        db.exec(`
            CREATE INDEX IF NOT EXISTS idx_notes_type
            ON transcription_notes(note_type);
        `);
        db.exec(`
            CREATE INDEX IF NOT EXISTS idx_notes_date
            ON transcription_notes(created_at DESC);
        `);

        logger.info('[Migration 003] ✅ transcription_notes table created');

        logger.info('[Migration 003] ✅ All Phase 6 tables and indexes created successfully');

        return true;
    } catch (error) {
        logger.error('[Migration 003] ❌ Error creating tables:', error);
        throw error;
    }
}

/**
 * Rollback migration: Drop Phase 6 tables
 * @param {Database} db - SQLite database instance
 */
function down(db) {
    logger.info('[Migration 003] Rolling back Phase 6 tables...');

    try {
        db.exec('DROP TABLE IF EXISTS transcription_notes');
        db.exec('DROP TABLE IF EXISTS transcription_insights');
        db.exec('DROP TABLE IF EXISTS transcription_segments');
        db.exec('DROP TABLE IF EXISTS transcriptions');

        logger.info('[Migration 003] ✅ Phase 6 tables dropped');

        return true;
    } catch (error) {
        logger.error('[Migration 003] ❌ Error dropping tables:', error);
        throw error;
    }
}

module.exports = {
    up,
    down,
    version: 3,
    description: 'Phase 6: Transcription Center - Advanced transcription management and insights'
};
