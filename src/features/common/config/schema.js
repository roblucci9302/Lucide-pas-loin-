const LATEST_SCHEMA = {
    users: {
        columns: [
            { name: 'uid', type: 'TEXT PRIMARY KEY' },
            { name: 'display_name', type: 'TEXT NOT NULL' },
            { name: 'email', type: 'TEXT NOT NULL' },
            { name: 'created_at', type: 'INTEGER' },
            { name: 'auto_update_enabled', type: 'INTEGER DEFAULT 1' },
            { name: 'has_migrated_to_firebase', type: 'INTEGER DEFAULT 0' },
            { name: 'active_agent_profile', type: 'TEXT DEFAULT \'lucide_assistant\'' }
        ]
    },
    sessions: {
        columns: [
            { name: 'id', type: 'TEXT PRIMARY KEY' },
            { name: 'uid', type: 'TEXT NOT NULL' },
            { name: 'title', type: 'TEXT' },
            { name: 'session_type', type: 'TEXT DEFAULT \'ask\'' },
            { name: 'started_at', type: 'INTEGER' },
            { name: 'ended_at', type: 'INTEGER' },
            { name: 'sync_state', type: 'TEXT DEFAULT \'clean\'' },
            { name: 'updated_at', type: 'INTEGER' },
            // Phase 2: Enhanced conversation history
            { name: 'tags', type: 'TEXT' }, // JSON array: ["work", "personal", etc.]
            { name: 'description', type: 'TEXT' }, // Optional longer description
            { name: 'agent_profile', type: 'TEXT' }, // Which Lucy profile was used
            { name: 'message_count', type: 'INTEGER DEFAULT 0' }, // Number of messages
            { name: 'auto_title', type: 'INTEGER DEFAULT 1' } // 1 if title auto-generated
        ]
    },
    transcripts: {
        columns: [
            { name: 'id', type: 'TEXT PRIMARY KEY' },
            { name: 'session_id', type: 'TEXT NOT NULL' },
            { name: 'start_at', type: 'INTEGER' },
            { name: 'end_at', type: 'INTEGER' },
            { name: 'speaker', type: 'TEXT' },
            { name: 'text', type: 'TEXT' },
            { name: 'lang', type: 'TEXT' },
            { name: 'created_at', type: 'INTEGER' },
            { name: 'sync_state', type: 'TEXT DEFAULT \'clean\'' }
        ]
    },
    ai_messages: {
        columns: [
            { name: 'id', type: 'TEXT PRIMARY KEY' },
            { name: 'session_id', type: 'TEXT NOT NULL' },
            { name: 'sent_at', type: 'INTEGER' },
            { name: 'role', type: 'TEXT' },
            { name: 'content', type: 'TEXT' },
            { name: 'tokens', type: 'INTEGER' },
            { name: 'model', type: 'TEXT' },
            { name: 'created_at', type: 'INTEGER' },
            { name: 'sync_state', type: 'TEXT DEFAULT \'clean\'' }
        ]
    },
    summaries: {
        columns: [
            { name: 'session_id', type: 'TEXT PRIMARY KEY' },
            { name: 'generated_at', type: 'INTEGER' },
            { name: 'model', type: 'TEXT' },
            { name: 'text', type: 'TEXT' },
            { name: 'tldr', type: 'TEXT' },
            { name: 'bullet_json', type: 'TEXT' },
            { name: 'action_json', type: 'TEXT' },
            { name: 'tokens_used', type: 'INTEGER' },
            { name: 'updated_at', type: 'INTEGER' },
            { name: 'sync_state', type: 'TEXT DEFAULT \'clean\'' }
        ]
    },
    prompt_presets: {
        columns: [
            { name: 'id', type: 'TEXT PRIMARY KEY' },
            { name: 'uid', type: 'TEXT NOT NULL' },
            { name: 'title', type: 'TEXT NOT NULL' },
            { name: 'prompt', type: 'TEXT NOT NULL' },
            { name: 'is_default', type: 'INTEGER NOT NULL' },
            { name: 'created_at', type: 'INTEGER' },
            { name: 'sync_state', type: 'TEXT DEFAULT \'clean\'' }
        ]
    },
    ollama_models: {
        columns: [
            { name: 'name', type: 'TEXT PRIMARY KEY' },
            { name: 'size', type: 'TEXT NOT NULL' },
            { name: 'installed', type: 'INTEGER DEFAULT 0' },
            { name: 'installing', type: 'INTEGER DEFAULT 0' }
        ]
    },
    whisper_models: {
        columns: [
            { name: 'id', type: 'TEXT PRIMARY KEY' },
            { name: 'name', type: 'TEXT NOT NULL' },
            { name: 'size', type: 'TEXT NOT NULL' },
            { name: 'installed', type: 'INTEGER DEFAULT 0' },
            { name: 'installing', type: 'INTEGER DEFAULT 0' }
        ]
    },
    provider_settings: {
        columns: [
            { name: 'provider', type: 'TEXT NOT NULL' },
            { name: 'api_key', type: 'TEXT' },
            { name: 'selected_llm_model', type: 'TEXT' },
            { name: 'selected_stt_model', type: 'TEXT' },
            { name: 'is_active_llm', type: 'INTEGER DEFAULT 0' },
            { name: 'is_active_stt', type: 'INTEGER DEFAULT 0' },
            { name: 'created_at', type: 'INTEGER' },
            { name: 'updated_at', type: 'INTEGER' }
        ],
        constraints: ['PRIMARY KEY (provider)']
    },
    shortcuts: {
        columns: [
            { name: 'action', type: 'TEXT PRIMARY KEY' },
            { name: 'accelerator', type: 'TEXT NOT NULL' },
            { name: 'created_at', type: 'INTEGER' }
        ]
    },
    permissions: {
        columns: [
            { name: 'uid', type: 'TEXT PRIMARY KEY' },
            { name: 'keychain_completed', type: 'INTEGER DEFAULT 0' }
        ]
    },
    // Phase 4: Knowledge Base - Document Management
    documents: {
        columns: [
            { name: 'id', type: 'TEXT PRIMARY KEY' },
            { name: 'uid', type: 'TEXT NOT NULL' }, // Owner
            { name: 'title', type: 'TEXT NOT NULL' }, // Document title
            { name: 'filename', type: 'TEXT NOT NULL' }, // Original filename
            { name: 'file_type', type: 'TEXT NOT NULL' }, // pdf, docx, txt, md
            { name: 'file_size', type: 'INTEGER' }, // Size in bytes
            { name: 'file_path', type: 'TEXT' }, // Local file path or cloud URL
            { name: 'content', type: 'TEXT' }, // Extracted text content
            { name: 'tags', type: 'TEXT' }, // JSON array of tags
            { name: 'description', type: 'TEXT' }, // Optional description
            { name: 'chunk_count', type: 'INTEGER DEFAULT 0' }, // Number of chunks
            { name: 'indexed', type: 'INTEGER DEFAULT 0' }, // 1 if indexed with embeddings
            { name: 'created_at', type: 'INTEGER' },
            { name: 'updated_at', type: 'INTEGER' },
            { name: 'sync_state', type: 'TEXT DEFAULT \'clean\'' }
        ]
    },
    // Phase 4: Knowledge Base - Document Chunks for Semantic Search
    document_chunks: {
        columns: [
            { name: 'id', type: 'TEXT PRIMARY KEY' },
            { name: 'document_id', type: 'TEXT NOT NULL' }, // Foreign key to documents
            { name: 'chunk_index', type: 'INTEGER NOT NULL' }, // Order in document
            { name: 'content', type: 'TEXT NOT NULL' }, // Chunk text
            { name: 'char_start', type: 'INTEGER' }, // Start position in original
            { name: 'char_end', type: 'INTEGER' }, // End position in original
            { name: 'token_count', type: 'INTEGER' }, // Estimated tokens
            { name: 'embedding', type: 'TEXT' }, // JSON array of vector floats
            { name: 'created_at', type: 'INTEGER' },
            { name: 'sync_state', type: 'TEXT DEFAULT \'clean\'' }
        ]
    },
    // Phase 4: Knowledge Base - Citation Tracking
    document_citations: {
        columns: [
            { name: 'id', type: 'TEXT PRIMARY KEY' },
            { name: 'session_id', type: 'TEXT NOT NULL' }, // Related conversation
            { name: 'message_id', type: 'TEXT' }, // AI message that cited
            { name: 'document_id', type: 'TEXT NOT NULL' }, // Cited document
            { name: 'chunk_id', type: 'TEXT' }, // Specific chunk cited
            { name: 'relevance_score', type: 'REAL' }, // Similarity score
            { name: 'context_used', type: 'TEXT' }, // Actual text included in prompt
            { name: 'created_at', type: 'INTEGER' },
            { name: 'sync_state', type: 'TEXT DEFAULT \'clean\'' }
        ]
    },
    // Phase WOW 1: User Profiles & Onboarding
    user_profiles: {
        columns: [
            { name: 'uid', type: 'TEXT PRIMARY KEY' },
            { name: 'active_profile', type: 'TEXT DEFAULT \'lucide_assistant\'' }, // Current active profile
            { name: 'onboarding_completed', type: 'INTEGER DEFAULT 0' }, // 1 if onboarding done
            { name: 'profile_preferences', type: 'TEXT' }, // JSON: {industry, company_size, goals, etc.}
            { name: 'created_at', type: 'INTEGER' },
            { name: 'updated_at', type: 'INTEGER' },
            { name: 'sync_state', type: 'TEXT DEFAULT \'clean\'' }
        ]
    },
    // Phase WOW 1: Profile Switch Tracking
    profile_switches: {
        columns: [
            { name: 'id', type: 'TEXT PRIMARY KEY' },
            { name: 'uid', type: 'TEXT NOT NULL' },
            { name: 'from_profile', type: 'TEXT' },
            { name: 'to_profile', type: 'TEXT NOT NULL' },
            { name: 'reason', type: 'TEXT' }, // 'manual' or 'auto'
            { name: 'switched_at', type: 'INTEGER' },
            { name: 'sync_state', type: 'TEXT DEFAULT \'clean\'' }
        ]
    },
    // Phase 2: Augmented Memory - Auto-indexed Content
    auto_indexed_content: {
        columns: [
            { name: 'id', type: 'TEXT PRIMARY KEY' },
            { name: 'uid', type: 'TEXT NOT NULL' },
            // Source info
            { name: 'source_type', type: 'TEXT NOT NULL' }, // 'conversation', 'screenshot', 'audio', 'ai_response'
            { name: 'source_id', type: 'TEXT' }, // session_id, message_id, transcript_id
            { name: 'source_title', type: 'TEXT' }, // Auto-generated title
            // Content
            { name: 'content', type: 'TEXT NOT NULL' }, // Extracted/summarized text
            { name: 'content_summary', type: 'TEXT' }, // Short summary (1-2 sentences)
            { name: 'raw_content', type: 'TEXT' }, // Original raw content if applicable
            // Metadata
            { name: 'entities', type: 'TEXT' }, // JSON: {projects:[], people:[], companies:[], dates:[], etc.}
            { name: 'tags', type: 'TEXT' }, // JSON array: auto-generated tags
            { name: 'project', type: 'TEXT' }, // Main project detected
            { name: 'importance_score', type: 'REAL DEFAULT 0.5' }, // 0-1: importance score
            // Embedding for semantic search
            { name: 'embedding', type: 'TEXT' }, // JSON array: vector embedding
            // Organization
            { name: 'auto_generated', type: 'INTEGER DEFAULT 1' },
            { name: 'indexed_at', type: 'INTEGER' },
            { name: 'created_at', type: 'INTEGER' },
            { name: 'updated_at', type: 'INTEGER' },
            { name: 'sync_state', type: 'TEXT DEFAULT \'clean\'' }
        ]
    },
    // Phase 2: Augmented Memory - Knowledge Graph
    knowledge_graph: {
        columns: [
            { name: 'id', type: 'TEXT PRIMARY KEY' },
            { name: 'uid', type: 'TEXT NOT NULL' },
            // Entity
            { name: 'entity_type', type: 'TEXT NOT NULL' }, // 'project', 'person', 'company', 'topic', 'technology'
            { name: 'entity_name', type: 'TEXT NOT NULL' },
            { name: 'entity_description', type: 'TEXT' },
            // Statistics
            { name: 'first_seen', type: 'INTEGER' },
            { name: 'last_seen', type: 'INTEGER' },
            { name: 'mention_count', type: 'INTEGER DEFAULT 1' },
            // Relations
            { name: 'related_entities', type: 'TEXT' }, // JSON: [{type:'person', name:'Marie', relation:'works_on'}]
            { name: 'related_documents', type: 'TEXT' }, // JSON: array of document IDs
            { name: 'related_content', type: 'TEXT' }, // JSON: array of auto_indexed_content IDs
            // Metadata
            { name: 'metadata', type: 'TEXT' }, // JSON: type-specific data
            { name: 'importance_score', type: 'REAL DEFAULT 0.5' }, // Based on frequency and context
            { name: 'created_at', type: 'INTEGER' },
            { name: 'updated_at', type: 'INTEGER' },
            { name: 'sync_state', type: 'TEXT DEFAULT \'clean\'' }
        ]
    },
    // Phase 2: Augmented Memory - Memory Statistics
    memory_stats: {
        columns: [
            { name: 'uid', type: 'TEXT PRIMARY KEY' },
            // Counters by type
            { name: 'total_elements', type: 'INTEGER DEFAULT 0' },
            { name: 'documents_count', type: 'INTEGER DEFAULT 0' },
            { name: 'conversations_indexed', type: 'INTEGER DEFAULT 0' },
            { name: 'screenshots_indexed', type: 'INTEGER DEFAULT 0' },
            { name: 'audio_indexed', type: 'INTEGER DEFAULT 0' },
            { name: 'ai_responses_indexed', type: 'INTEGER DEFAULT 0' },
            // Size
            { name: 'total_size_bytes', type: 'INTEGER DEFAULT 0' },
            { name: 'embeddings_count', type: 'INTEGER DEFAULT 0' },
            // Entities
            { name: 'projects_count', type: 'INTEGER DEFAULT 0' },
            { name: 'people_count', type: 'INTEGER DEFAULT 0' },
            { name: 'companies_count', type: 'INTEGER DEFAULT 0' },
            { name: 'topics_count', type: 'INTEGER DEFAULT 0' },
            // Activity
            { name: 'last_indexed_at', type: 'INTEGER' },
            { name: 'indexing_in_progress', type: 'INTEGER DEFAULT 0' },
            // Metadata
            { name: 'created_at', type: 'INTEGER' },
            { name: 'updated_at', type: 'INTEGER' },
            { name: 'sync_state', type: 'TEXT DEFAULT \'clean\'' }
        ]
    },
    // Phase 2: Augmented Memory - External Data Sources
    external_sources: {
        columns: [
            { name: 'id', type: 'TEXT PRIMARY KEY' },
            { name: 'uid', type: 'TEXT NOT NULL' },
            // Source type
            { name: 'source_type', type: 'TEXT NOT NULL' }, // 'postgresql', 'mysql', 'mongodb', 'rest', 'notion', 'airtable'
            { name: 'source_name', type: 'TEXT NOT NULL' }, // User-given name
            // Connection config (encrypted)
            { name: 'connection_config', type: 'TEXT NOT NULL' }, // JSON encrypted: {host, port, database, credentials}
            // Mapping
            { name: 'mapping_config', type: 'TEXT' }, // JSON: how to map external data
            // Synchronization
            { name: 'sync_enabled', type: 'INTEGER DEFAULT 0' },
            { name: 'sync_frequency', type: 'TEXT' }, // 'manual', 'daily', 'weekly', 'real-time'
            { name: 'last_sync_at', type: 'INTEGER' },
            { name: 'next_sync_at', type: 'INTEGER' },
            { name: 'sync_status', type: 'TEXT' }, // 'idle', 'syncing', 'error', 'success'
            { name: 'sync_error', type: 'TEXT' },
            // Statistics
            { name: 'documents_imported', type: 'INTEGER DEFAULT 0' },
            { name: 'total_size_bytes', type: 'INTEGER DEFAULT 0' },
            // Metadata
            { name: 'created_at', type: 'INTEGER' },
            { name: 'updated_at', type: 'INTEGER' },
            { name: 'sync_state', type: 'TEXT DEFAULT \'clean\'' }
        ]
    },
    // Phase 2: Augmented Memory - Import History
    import_history: {
        columns: [
            { name: 'id', type: 'TEXT PRIMARY KEY' },
            { name: 'uid', type: 'TEXT NOT NULL' },
            { name: 'source_id', type: 'TEXT NOT NULL' }, // external_sources.id
            // Import info
            { name: 'import_type', type: 'TEXT' }, // 'manual', 'scheduled', 'initial'
            { name: 'started_at', type: 'INTEGER' },
            { name: 'completed_at', type: 'INTEGER' },
            { name: 'status', type: 'TEXT' }, // 'running', 'completed', 'failed', 'partial'
            // Results
            { name: 'records_processed', type: 'INTEGER DEFAULT 0' },
            { name: 'records_imported', type: 'INTEGER DEFAULT 0' },
            { name: 'records_failed', type: 'INTEGER DEFAULT 0' },
            { name: 'errors', type: 'TEXT' }, // JSON: array of errors
            // Metadata
            { name: 'created_at', type: 'INTEGER' },
            { name: 'sync_state', type: 'TEXT DEFAULT \'clean\'' }
        ]
    },
    // Phase 6: Transcription Center - Advanced Transcription Management
    transcriptions: {
        columns: [
            { name: 'id', type: 'TEXT PRIMARY KEY' },
            { name: 'session_id', type: 'TEXT NOT NULL' },
            { name: 'uid', type: 'TEXT NOT NULL' },
            // Metadata
            { name: 'title', type: 'TEXT' },
            { name: 'description', type: 'TEXT' },
            { name: 'duration', type: 'INTEGER' }, // in seconds
            { name: 'participants', type: 'TEXT' }, // JSON array
            { name: 'tags', type: 'TEXT' }, // JSON array
            // Content
            { name: 'summary', type: 'TEXT' },
            { name: 'transcript_count', type: 'INTEGER DEFAULT 0' },
            { name: 'word_count', type: 'INTEGER DEFAULT 0' },
            // Timestamps
            { name: 'start_at', type: 'INTEGER' },
            { name: 'end_at', type: 'INTEGER' },
            // Language & Status
            { name: 'language', type: 'TEXT' },
            { name: 'status', type: 'TEXT DEFAULT \'completed\'' },
            // Metadata
            { name: 'created_at', type: 'INTEGER' },
            { name: 'updated_at', type: 'INTEGER' },
            { name: 'sync_state', type: 'TEXT DEFAULT \'clean\'' }
        ]
    },
    transcription_segments: {
        columns: [
            { name: 'id', type: 'TEXT PRIMARY KEY' },
            { name: 'transcription_id', type: 'TEXT NOT NULL' },
            // Speaker info
            { name: 'speaker', type: 'TEXT NOT NULL' },
            { name: 'speaker_label', type: 'TEXT' },
            // Content
            { name: 'text', type: 'TEXT NOT NULL' },
            // Timing
            { name: 'start_at', type: 'INTEGER NOT NULL' },
            { name: 'end_at', type: 'INTEGER NOT NULL' },
            { name: 'duration', type: 'INTEGER' },
            // Quality
            { name: 'confidence', type: 'REAL' },
            { name: 'language', type: 'TEXT' },
            // Metadata
            { name: 'created_at', type: 'INTEGER' },
            { name: 'sync_state', type: 'TEXT DEFAULT \'clean\'' }
        ]
    },
    transcription_insights: {
        columns: [
            { name: 'id', type: 'TEXT PRIMARY KEY' },
            { name: 'transcription_id', type: 'TEXT NOT NULL' },
            // Insight type
            { name: 'insight_type', type: 'TEXT NOT NULL' },
            // Content
            { name: 'title', type: 'TEXT' },
            { name: 'content', type: 'TEXT NOT NULL' },
            { name: 'metadata', type: 'TEXT' }, // JSON
            // Generation info
            { name: 'generated_at', type: 'INTEGER' },
            { name: 'model', type: 'TEXT' },
            { name: 'tokens_used', type: 'INTEGER' },
            // Quality
            { name: 'confidence', type: 'REAL' },
            // Metadata
            { name: 'created_at', type: 'INTEGER' },
            { name: 'sync_state', type: 'TEXT DEFAULT \'clean\'' }
        ]
    },
    transcription_notes: {
        columns: [
            { name: 'id', type: 'TEXT PRIMARY KEY' },
            { name: 'transcription_id', type: 'TEXT NOT NULL' },
            { name: 'uid', type: 'TEXT NOT NULL' },
            // Note content
            { name: 'note_text', type: 'TEXT NOT NULL' },
            // Reference
            { name: 'segment_id', type: 'TEXT' },
            { name: 'timestamp_ref', type: 'INTEGER' },
            // Tags
            { name: 'tags', type: 'TEXT' }, // JSON array
            { name: 'note_type', type: 'TEXT DEFAULT \'general\'' },
            // Metadata
            { name: 'created_by', type: 'TEXT' },
            { name: 'created_at', type: 'INTEGER' },
            { name: 'updated_at', type: 'INTEGER' },
            { name: 'sync_state', type: 'TEXT DEFAULT \'clean\'' }
        ]
    },
    // Phase 3: Agent Improvement - Response Feedback
    response_feedback: {
        columns: [
            { name: 'id', type: 'TEXT PRIMARY KEY' },
            { name: 'uid', type: 'TEXT NOT NULL' },
            { name: 'session_id', type: 'TEXT NOT NULL' },
            { name: 'message_id', type: 'TEXT NOT NULL' },
            { name: 'agent_profile', type: 'TEXT NOT NULL' },
            // Feedback
            { name: 'rating', type: 'INTEGER' }, // 1-5 stars (or -1 for thumbs down, 1 for thumbs up)
            { name: 'feedback_type', type: 'TEXT' }, // 'helpful', 'accurate', 'tone', 'format', 'other'
            { name: 'comment', type: 'TEXT' }, // Optional text comment
            { name: 'is_positive', type: 'INTEGER DEFAULT 1' }, // 1 = positive, 0 = negative
            // Context
            { name: 'question', type: 'TEXT' }, // The user's question
            { name: 'response_preview', type: 'TEXT' }, // First 200 chars of response
            { name: 'response_length', type: 'INTEGER' }, // Full response length
            { name: 'response_time_ms', type: 'INTEGER' }, // Time to generate response
            // Metadata
            { name: 'created_at', type: 'INTEGER' },
            { name: 'sync_state', type: 'TEXT DEFAULT \'clean\'' }
        ]
    },
    // Phase 3: Agent Improvement - Response Quality Metrics
    response_quality_metrics: {
        columns: [
            { name: 'id', type: 'TEXT PRIMARY KEY' },
            { name: 'uid', type: 'TEXT NOT NULL' },
            { name: 'session_id', type: 'TEXT NOT NULL' },
            { name: 'message_id', type: 'TEXT NOT NULL' },
            { name: 'agent_profile', type: 'TEXT NOT NULL' },
            // Quality scores (0-1 range)
            { name: 'overall_score', type: 'REAL' },
            { name: 'length_score', type: 'REAL' }, // Is length appropriate?
            { name: 'structure_score', type: 'REAL' }, // Has good structure (headers, bullets)?
            { name: 'vocabulary_score', type: 'REAL' }, // Uses domain vocabulary?
            { name: 'framework_score', type: 'REAL' }, // References relevant frameworks?
            { name: 'coherence_score', type: 'REAL' }, // Coherent and well-organized?
            // Performance metrics
            { name: 'latency_ms', type: 'INTEGER' }, // Response time
            { name: 'tokens_input', type: 'INTEGER' },
            { name: 'tokens_output', type: 'INTEGER' },
            { name: 'sources_used', type: 'INTEGER' }, // Number of RAG sources used
            { name: 'cache_hit', type: 'INTEGER DEFAULT 0' }, // 1 if from cache
            // LLM-as-Judge (optional, for sampling)
            { name: 'llm_judge_score', type: 'REAL' }, // Score from LLM evaluation
            { name: 'llm_judge_reasoning', type: 'TEXT' }, // Why this score?
            // Context
            { name: 'model_used', type: 'TEXT' },
            { name: 'provider_used', type: 'TEXT' },
            { name: 'temperature', type: 'REAL' },
            // Metadata
            { name: 'created_at', type: 'INTEGER' },
            { name: 'sync_state', type: 'TEXT DEFAULT \'clean\'' }
        ]
    }
};

module.exports = LATEST_SCHEMA; 