/**
 * External Data Service
 *
 * Service pour la connexion et l'import de données depuis des sources externes:
 * - PostgreSQL
 * - MySQL
 * - REST APIs
 * - Future: MongoDB, Supabase, etc.
 *
 * Fonctionnalités:
 * - Test de connexion
 * - Exécution de queries
 * - Import automatique avec mapping
 * - Auto-indexation des données importées
 * - Historique des imports
 * - Gestion des credentials encryptés
 *
 * @module externalDataService
 */

const { loaders } = require('../utils/dependencyLoader');
const uuid = loaders.loadUuid();
const uuidv4 = uuid.v4;
const sqliteClient = require('./sqliteClient');
const autoIndexingService = require('./autoIndexingService');
const encryptionService = require('./encryptionService');

console.log('[ExternalDataService] Service loaded');

class ExternalDataService {
    constructor() {
        this.db = null;
        this.connections = {}; // Cache des connexions actives
        console.log('[ExternalDataService] Service initialized');
    }

    /**
     * Initialize the service
     */
    async initialize() {
        if (!this.db) {
            this.db = sqliteClient.getDb();
        }
        console.log('[ExternalDataService] Service ready');
    }

    // ========================================================================
    // POSTGRESQL CONNECTION
    // ========================================================================

    /**
     * Test PostgreSQL connection
     *
     * @param {object} config - PostgreSQL connection config
     * @param {string} config.host - Host
     * @param {number} config.port - Port (default: 5432)
     * @param {string} config.database - Database name
     * @param {string} config.user - Username
     * @param {string} config.password - Password
     * @returns {Promise<object>} Test result
     */
    async testPostgresConnection(config) {
        try {
            // Load PostgreSQL package with graceful degradation
            const pg = loaders.loadPostgres();

            // Check if it's the mock (not available)
            if (pg.Pool && pg.Pool.name === 'MockPool') {
                return {
                    success: false,
                    error: 'PostgreSQL driver not installed. Run: npm install pg',
                    needsInstall: true
                };
            }

            const { Pool } = pg;
            const pool = new Pool({
                host: config.host,
                port: config.port || 5432,
                database: config.database,
                user: config.user,
                password: config.password,
                connectionTimeoutMillis: 5000
            });

            // Test simple query
            const result = await pool.query('SELECT NOW() as current_time, version() as version');

            await pool.end();

            return {
                success: true,
                message: 'PostgreSQL connection successful',
                serverTime: result.rows[0].current_time,
                version: result.rows[0].version
            };

        } catch (error) {
            console.error('[ExternalDataService] PostgreSQL test failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Execute query on PostgreSQL database
     *
     * @param {string} sourceId - External source ID
     * @param {string} query - SQL query to execute
     * @param {array} params - Query parameters (optional)
     * @returns {Promise<object>} Query result
     */
    async queryPostgres(sourceId, query, params = []) {
        try {
            // Get source config
            const source = await this._getExternalSource(sourceId);
            if (!source) {
                throw new Error('External source not found');
            }

            if (source.source_type !== 'postgresql') {
                throw new Error('Source is not PostgreSQL');
            }

            // Load PostgreSQL package with graceful degradation
            const pg = loaders.loadPostgres();

            // Check if it's the mock (not available)
            if (pg.Pool && pg.Pool.name === 'MockPool') {
                throw new Error('PostgreSQL driver not installed. Run: npm install pg');
            }

            // Decrypt credentials
            const config = JSON.parse(source.connection_config);
            if (source.credentials_encrypted) {
                config.password = await encryptionService.decrypt(config.password);
            }

            const { Pool } = pg;
            const pool = new Pool({
                host: config.host,
                port: config.port || 5432,
                database: config.database,
                user: config.user,
                password: config.password
            });

            // Execute query
            const result = await pool.query(query, params);

            await pool.end();

            return {
                success: true,
                rows: result.rows,
                rowCount: result.rowCount,
                fields: result.fields
            };

        } catch (error) {
            console.error('[ExternalDataService] PostgreSQL query failed:', error.message);
            throw error;
        }
    }

    // ========================================================================
    // MYSQL CONNECTION
    // ========================================================================

    /**
     * Test MySQL connection
     *
     * @param {object} config - MySQL connection config
     * @param {string} config.host - Host
     * @param {number} config.port - Port (default: 3306)
     * @param {string} config.database - Database name
     * @param {string} config.user - Username
     * @param {string} config.password - Password
     * @returns {Promise<object>} Test result
     */
    async testMySQLConnection(config) {
        try {
            // Load MySQL package with graceful degradation
            const mysql = loaders.loadMySQL();

            // Check if it's the mock (not available)
            if (!mysql.createConnection || typeof mysql.createConnection !== 'function') {
                return {
                    success: false,
                    error: 'MySQL driver not installed. Run: npm install mysql2',
                    needsInstall: true
                };
            }

            // MySQL needs promise version
            if (!mysql.createConnection().then) {
                return {
                    success: false,
                    error: 'MySQL driver not installed. Run: npm install mysql2',
                    needsInstall: true
                };
            }

            const connection = await mysql.createConnection({
                host: config.host,
                port: config.port || 3306,
                database: config.database,
                user: config.user,
                password: config.password,
                connectTimeout: 5000
            });

            // Test simple query
            const [rows] = await connection.execute('SELECT NOW() as current_time, VERSION() as version');

            await connection.end();

            return {
                success: true,
                message: 'MySQL connection successful',
                serverTime: rows[0].current_time,
                version: rows[0].version
            };

        } catch (error) {
            console.error('[ExternalDataService] MySQL test failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Execute query on MySQL database
     *
     * @param {string} sourceId - External source ID
     * @param {string} query - SQL query to execute
     * @param {array} params - Query parameters (optional)
     * @returns {Promise<object>} Query result
     */
    async queryMySQL(sourceId, query, params = []) {
        try {
            // Get source config
            const source = await this._getExternalSource(sourceId);
            if (!source) {
                throw new Error('External source not found');
            }

            if (source.source_type !== 'mysql') {
                throw new Error('Source is not MySQL');
            }

            // Load MySQL driver with graceful degradation
            const mysql = loaders.loadMySQL();

            // Check if it's the mock (not available)
            if (!mysql.createConnection || typeof mysql.createConnection !== 'function') {
                throw new Error('MySQL driver not installed. Run: npm install mysql2');
            }

            // Decrypt credentials
            const config = JSON.parse(source.connection_config);
            if (source.credentials_encrypted) {
                config.password = await encryptionService.decrypt(config.password);
            }

            const connection = await mysql.createConnection({
                host: config.host,
                port: config.port || 3306,
                database: config.database,
                user: config.user,
                password: config.password
            });

            // Execute query
            const [rows, fields] = await connection.execute(query, params);

            await connection.end();

            return {
                success: true,
                rows: rows,
                rowCount: rows.length,
                fields: fields
            };

        } catch (error) {
            console.error('[ExternalDataService] MySQL query failed:', error.message);
            throw error;
        }
    }

    // ========================================================================
    // REST API CONNECTION
    // ========================================================================

    /**
     * Test REST API connection
     *
     * @param {object} config - REST API config
     * @param {string} config.baseUrl - Base URL
     * @param {object} config.headers - HTTP headers (optional)
     * @param {string} config.authType - Auth type: 'none', 'bearer', 'basic', 'apikey'
     * @param {string} config.authToken - Auth token (if authType = 'bearer' or 'apikey')
     * @returns {Promise<object>} Test result
     */
    async testRestAPIConnection(config) {
        try {
            const url = config.baseUrl;
            const headers = { ...config.headers };

            // Add authentication
            if (config.authType === 'bearer' && config.authToken) {
                headers['Authorization'] = `Bearer ${config.authToken}`;
            } else if (config.authType === 'apikey' && config.authToken) {
                headers[config.authKeyHeader || 'X-API-Key'] = config.authToken;
            } else if (config.authType === 'basic' && config.authUsername && config.authPassword) {
                const credentials = Buffer.from(`${config.authUsername}:${config.authPassword}`).toString('base64');
                headers['Authorization'] = `Basic ${credentials}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: headers,
                signal: AbortSignal.timeout(5000)
            });

            if (!response.ok) {
                return {
                    success: false,
                    error: `HTTP ${response.status}: ${response.statusText}`
                };
            }

            return {
                success: true,
                message: 'REST API connection successful',
                status: response.status,
                statusText: response.statusText
            };

        } catch (error) {
            console.error('[ExternalDataService] REST API test failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Fetch data from REST API
     *
     * @param {string} sourceId - External source ID
     * @param {string} endpoint - API endpoint (relative to baseUrl)
     * @param {object} options - Fetch options (method, body, etc.)
     * @returns {Promise<object>} API response
     */
    async fetchFromAPI(sourceId, endpoint, options = {}) {
        try {
            // Get source config
            const source = await this._getExternalSource(sourceId);
            if (!source) {
                throw new Error('External source not found');
            }

            if (source.source_type !== 'rest_api') {
                throw new Error('Source is not REST API');
            }

            // Decrypt credentials if needed
            const config = JSON.parse(source.connection_config);
            if (source.credentials_encrypted && config.authToken) {
                config.authToken = await encryptionService.decrypt(config.authToken);
            }

            const url = `${config.baseUrl}${endpoint}`;
            const headers = { ...config.headers, ...options.headers };

            // Add authentication
            if (config.authType === 'bearer' && config.authToken) {
                headers['Authorization'] = `Bearer ${config.authToken}`;
            } else if (config.authType === 'apikey' && config.authToken) {
                headers[config.authKeyHeader || 'X-API-Key'] = config.authToken;
            }

            const response = await fetch(url, {
                method: options.method || 'GET',
                headers: headers,
                body: options.body ? JSON.stringify(options.body) : undefined
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            return {
                success: true,
                data: data,
                status: response.status
            };

        } catch (error) {
            console.error('[ExternalDataService] API fetch failed:', error.message);
            throw error;
        }
    }

    // ========================================================================
    // EXTERNAL SOURCE MANAGEMENT
    // ========================================================================

    /**
     * Create or update external source
     *
     * @param {object} sourceData - Source configuration
     * @param {string} uid - User ID
     * @returns {Promise<string>} Source ID
     */
    async createOrUpdateExternalSource(sourceData, uid) {
        const {
            id = uuidv4(),
            source_name,
            source_type, // 'postgresql', 'mysql', 'rest_api'
            connection_config, // JSON object with connection details
            sync_enabled = 0,
            sync_frequency = null, // 'hourly', 'daily', 'weekly', null
            last_sync_at = null
        } = sourceData;

        if (!this.db) {
            await this.initialize();
        }

        // Encrypt sensitive credentials
        let configToStore = { ...connection_config };
        let credentialsEncrypted = 0;

        if (connection_config.password) {
            configToStore.password = await encryptionService.encrypt(connection_config.password);
            credentialsEncrypted = 1;
        }
        if (connection_config.authToken) {
            configToStore.authToken = await encryptionService.encrypt(connection_config.authToken);
            credentialsEncrypted = 1;
        }

        const now = Date.now();

        // Check if source exists
        const existing = this.db.prepare(`
            SELECT id FROM external_sources WHERE id = ?
        `).get(id);

        if (existing) {
            // Update
            this.db.prepare(`
                UPDATE external_sources
                SET source_name = ?,
                    source_type = ?,
                    connection_config = ?,
                    credentials_encrypted = ?,
                    sync_enabled = ?,
                    sync_frequency = ?,
                    updated_at = ?
                WHERE id = ?
            `).run(
                source_name,
                source_type,
                JSON.stringify(configToStore),
                credentialsEncrypted,
                sync_enabled,
                sync_frequency,
                now,
                id
            );

            console.log(`[ExternalDataService] Updated external source: ${source_name}`);
        } else {
            // Create
            this.db.prepare(`
                INSERT INTO external_sources (
                    id, uid, source_name, source_type, connection_config,
                    credentials_encrypted, sync_enabled, sync_frequency,
                    last_sync_at, created_at, updated_at, sync_state
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                id,
                uid,
                source_name,
                source_type,
                JSON.stringify(configToStore),
                credentialsEncrypted,
                sync_enabled,
                sync_frequency,
                last_sync_at,
                now,
                now,
                'clean'
            );

            console.log(`[ExternalDataService] Created external source: ${source_name}`);
        }

        return id;
    }

    /**
     * Get external source by ID
     * @private
     */
    async _getExternalSource(sourceId) {
        if (!this.db) {
            await this.initialize();
        }

        const source = this.db.prepare(`
            SELECT * FROM external_sources WHERE id = ?
        `).get(sourceId);

        return source;
    }

    /**
     * Get all external sources for a user
     *
     * @param {string} uid - User ID
     * @returns {Promise<object[]>} Array of sources
     */
    async getExternalSources(uid) {
        if (!this.db) {
            await this.initialize();
        }

        const sources = this.db.prepare(`
            SELECT id, source_name, source_type, sync_enabled,
                   sync_frequency, last_sync_at, created_at
            FROM external_sources
            WHERE uid = ?
            ORDER BY created_at DESC
        `).all(uid);

        return sources;
    }

    // ========================================================================
    // DATA IMPORT
    // ========================================================================

    /**
     * Import data from database and auto-index
     *
     * @param {string} sourceId - External source ID
     * @param {string} query - SQL query to execute
     * @param {object} mappingConfig - Column mapping configuration
     * @param {string} uid - User ID
     * @returns {Promise<object>} Import result
     */
    async importFromDatabase(sourceId, query, mappingConfig, uid) {
        try {
            console.log(`[ExternalDataService] Starting import from source: ${sourceId}`);

            // Get source
            const source = await this._getExternalSource(sourceId);
            if (!source) {
                throw new Error('External source not found');
            }

            // Execute query based on source type
            let queryResult;
            if (source.source_type === 'postgresql') {
                queryResult = await this.queryPostgres(sourceId, query);
            } else if (source.source_type === 'mysql') {
                queryResult = await this.queryMySQL(sourceId, query);
            } else {
                throw new Error(`Unsupported source type for SQL import: ${source.source_type}`);
            }

            if (!queryResult.success) {
                throw new Error('Query execution failed');
            }

            const rows = queryResult.rows;
            console.log(`[ExternalDataService] Retrieved ${rows.length} rows from database`);

            // Map and index each row
            const importId = uuidv4();
            const indexedContent = [];
            let successCount = 0;
            let errorCount = 0;

            for (const row of rows) {
                try {
                    // Map row to indexable content
                    const content = this._mapRowToContent(row, mappingConfig);

                    // Index content
                    const indexed = await this._indexExternalContent(
                        content,
                        uid,
                        sourceId,
                        importId
                    );

                    if (indexed) {
                        indexedContent.push(indexed);
                        successCount++;
                    }
                } catch (error) {
                    console.error('[ExternalDataService] Failed to index row:', error.message);
                    errorCount++;
                }
            }

            // Record import history
            await this._recordImportHistory(importId, sourceId, uid, {
                query: query,
                totalRows: rows.length,
                successCount: successCount,
                errorCount: errorCount
            });

            // Update last_sync_at
            const now = Date.now();
            this.db.prepare(`
                UPDATE external_sources
                SET last_sync_at = ?, updated_at = ?
                WHERE id = ?
            `).run(now, now, sourceId);

            console.log(`[ExternalDataService] Import completed: ${successCount} indexed, ${errorCount} errors`);

            return {
                success: true,
                importId: importId,
                totalRows: rows.length,
                indexedCount: successCount,
                errorCount: errorCount,
                indexedContent: indexedContent
            };

        } catch (error) {
            console.error('[ExternalDataService] Import failed:', error.message);
            throw error;
        }
    }

    /**
     * Map database row to indexable content
     * @private
     */
    _mapRowToContent(row, mappingConfig) {
        const {
            titleColumn = null,
            contentColumns = [],
            metadataColumns = []
        } = mappingConfig;

        // Build title
        let title = 'Imported Data';
        if (titleColumn && row[titleColumn]) {
            title = String(row[titleColumn]);
        }

        // Build content text from specified columns
        let contentText = '';
        if (contentColumns.length > 0) {
            contentText = contentColumns
                .map(col => row[col] ? String(row[col]) : '')
                .filter(text => text.length > 0)
                .join('\n\n');
        } else {
            // If no columns specified, use all columns
            contentText = Object.entries(row)
                .map(([key, value]) => `${key}: ${value}`)
                .join('\n');
        }

        // Extract metadata
        const metadata = {};
        metadataColumns.forEach(col => {
            if (row[col] !== undefined) {
                metadata[col] = row[col];
            }
        });

        return {
            title: title,
            content: contentText,
            metadata: metadata,
            rawData: row
        };
    }

    /**
     * Index external content using autoIndexingService
     * @private
     */
    async _indexExternalContent(content, uid, sourceId, importId) {
        try {
            // Use autoIndexingService to index the content
            // We'll create a "virtual" content entry that looks like a document

            const contentId = uuidv4();

            // Extract entities and generate summary using knowledgeOrganizerService
            const knowledgeOrganizer = require('./knowledgeOrganizerService');

            const entities = await knowledgeOrganizer.extractEntities(content.content);
            const summary = await knowledgeOrganizer.generateSummary(content.content, 50);
            const tags = await knowledgeOrganizer.generateTags(content.content, 5);

            // Save entities to knowledge graph
            for (const project of (entities.projects || []).slice(0, 5)) {
                await knowledgeOrganizer.createOrUpdateEntity({
                    entity_type: 'project',
                    entity_name: project,
                    related_content_id: contentId
                }, uid);
            }

            for (const person of (entities.people || []).slice(0, 10)) {
                await knowledgeOrganizer.createOrUpdateEntity({
                    entity_type: 'person',
                    entity_name: person,
                    related_content_id: contentId
                }, uid);
            }

            // Calculate importance
            const importanceScore = 0.7; // External data is moderately important by default

            // Save to auto_indexed_content
            const now = Date.now();

            this.db.prepare(`
                INSERT INTO auto_indexed_content (
                    id, uid, source_type, source_id, source_title,
                    content, content_summary, raw_content,
                    entities, tags, project,
                    importance_score, embedding,
                    auto_generated, indexed_at,
                    created_at, updated_at, sync_state
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                contentId,
                uid,
                'external_database',
                sourceId,
                content.title,
                content.content,
                summary,
                JSON.stringify(content.rawData),
                JSON.stringify(entities),
                JSON.stringify(tags),
                entities.projects && entities.projects.length > 0 ? entities.projects[0] : null,
                importanceScore,
                null, // embedding will be generated later
                1,
                now,
                now,
                now,
                'clean'
            );

            console.log(`[ExternalDataService] Indexed external content: ${content.title}`);

            return {
                id: contentId,
                title: content.title,
                summary: summary
            };

        } catch (error) {
            console.error('[ExternalDataService] Failed to index content:', error.message);
            throw error;
        }
    }

    /**
     * Record import history
     * @private
     */
    async _recordImportHistory(importId, sourceId, uid, stats) {
        if (!this.db) {
            await this.initialize();
        }

        const now = Date.now();

        this.db.prepare(`
            INSERT INTO import_history (
                id, uid, source_id, import_type,
                records_imported, records_failed,
                import_config, error_log,
                started_at, completed_at,
                created_at, updated_at, sync_state
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            importId,
            uid,
            sourceId,
            'database_query',
            stats.successCount,
            stats.errorCount,
            JSON.stringify({ query: stats.query }),
            null,
            now,
            now,
            now,
            now,
            'clean'
        );

        console.log(`[ExternalDataService] Recorded import history: ${importId}`);
    }

    /**
     * Get import history for a source
     *
     * @param {string} sourceId - External source ID
     * @param {number} limit - Max number of records
     * @returns {Promise<object[]>} Import history
     */
    async getImportHistory(sourceId, limit = 10) {
        if (!this.db) {
            await this.initialize();
        }

        const history = this.db.prepare(`
            SELECT * FROM import_history
            WHERE source_id = ?
            ORDER BY created_at DESC
            LIMIT ?
        `).all(sourceId, limit);

        return history;
    }
}

// Export singleton instance
const externalDataService = new ExternalDataService();
module.exports = externalDataService;
