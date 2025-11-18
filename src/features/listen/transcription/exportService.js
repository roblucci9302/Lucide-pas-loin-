/**
 * Export Service - Phase 6.2: Export & Intégration
 *
 * Handles exporting transcription reports to various formats:
 * - PDF (using Electron's built-in PDF generator)
 * - DOCX (using markdown-to-docx conversion)
 * - Markdown (native format)
 */

const fs = require('fs').promises;
const path = require('path');
const { BrowserWindow } = require('electron');
const { marked } = require('marked');

class ExportService {
    constructor() {
        this.tempDir = path.join(process.cwd(), 'data', 'temp_export');
        this.ensureTempDir();
        console.log('[ExportService] Service initialized');
    }

    /**
     * Ensure temp directory exists
     */
    async ensureTempDir() {
        try {
            await fs.mkdir(this.tempDir, { recursive: true });
        } catch (error) {
            console.error('[ExportService] Failed to create temp directory:', error);
        }
    }

    /**
     * Export report to PDF using Electron's built-in PDF generator
     * @param {string} markdownContent - Markdown content to export
     * @param {string} outputPath - Destination path for PDF
     * @param {Object} options - Export options
     * @returns {Promise<Object>} Export result
     */
    async exportToPDF(markdownContent, outputPath, options = {}) {
        console.log(`[ExportService] Exporting to PDF: ${outputPath}`);

        try {
            // Convert Markdown to HTML
            const htmlContent = this.markdownToHTML(markdownContent, options);

            // Create hidden browser window for PDF generation
            const win = new BrowserWindow({
                show: false,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true
                }
            });

            // Load HTML content
            await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

            // Wait for page to load
            await new Promise(resolve => setTimeout(resolve, 500));

            // Generate PDF
            const pdfData = await win.webContents.printToPDF({
                marginsType: 0,
                printBackground: true,
                printSelectionOnly: false,
                landscape: false,
                pageSize: 'A4',
                scaleFactor: 100
            });

            // Save PDF
            await fs.writeFile(outputPath, pdfData);

            // Cleanup
            win.close();

            console.log(`[ExportService] ✅ PDF exported successfully: ${outputPath}`);

            return {
                success: true,
                filePath: outputPath,
                format: 'pdf',
                size: pdfData.length
            };
        } catch (error) {
            console.error('[ExportService] Error exporting to PDF:', error);
            throw new Error(`Failed to export PDF: ${error.message}`);
        }
    }

    /**
     * Export report to DOCX (simplified version)
     * Note: For production, use a library like markdown-to-docx or docx
     * @param {string} markdownContent - Markdown content to export
     * @param {string} outputPath - Destination path for DOCX
     * @param {Object} options - Export options
     * @returns {Promise<Object>} Export result
     */
    async exportToDOCX(markdownContent, outputPath, options = {}) {
        console.log(`[ExportService] Exporting to DOCX: ${outputPath}`);

        try {
            // For MVP, we'll save as RTF which Word can open
            // In production, use a proper DOCX library

            // Convert Markdown to basic RTF
            const rtfContent = this.markdownToRTF(markdownContent);

            // Save as RTF (Word can open this)
            const rtfPath = outputPath.replace('.docx', '.rtf');
            await fs.writeFile(rtfPath, rtfContent, 'utf-8');

            console.log(`[ExportService] ✅ RTF exported successfully: ${rtfPath}`);
            console.warn('[ExportService] Note: Exported as RTF (Word compatible). Full DOCX support requires additional library.');

            return {
                success: true,
                filePath: rtfPath,
                format: 'rtf',
                size: Buffer.byteLength(rtfContent, 'utf-8')
            };
        } catch (error) {
            console.error('[ExportService] Error exporting to DOCX/RTF:', error);
            throw new Error(`Failed to export DOCX: ${error.message}`);
        }
    }

    /**
     * Convert Markdown to styled HTML for PDF export
     * @param {string} markdown - Markdown content
     * @param {Object} options - Styling options
     * @returns {string} HTML content
     */
    markdownToHTML(markdown, options = {}) {
        const {
            title = 'Document',
            author = 'Lucide AI Assistant',
            date = new Date().toLocaleDateString()
        } = options;

        // Convert Markdown to HTML using marked
        let htmlBody;
        try {
            // Try using marked if available
            htmlBody = marked.parse ? marked.parse(markdown) : this.simpleMarkdownToHTML(markdown);
        } catch (error) {
            console.warn('[ExportService] marked library not available, using simple conversion');
            htmlBody = this.simpleMarkdownToHTML(markdown);
        }

        // Create styled HTML document
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 21cm;
            margin: 0 auto;
            padding: 2cm;
            background: white;
        }

        h1 {
            font-size: 28px;
            font-weight: 700;
            margin: 24px 0 16px 0;
            color: #1a1a1a;
            border-bottom: 2px solid #4f46e5;
            padding-bottom: 8px;
        }

        h2 {
            font-size: 22px;
            font-weight: 600;
            margin: 20px 0 12px 0;
            color: #2d2d2d;
        }

        h3 {
            font-size: 18px;
            font-weight: 600;
            margin: 16px 0 10px 0;
            color: #404040;
        }

        p {
            margin: 10px 0;
        }

        strong, b {
            font-weight: 600;
            color: #1a1a1a;
        }

        ul, ol {
            margin: 10px 0 10px 24px;
        }

        li {
            margin: 4px 0;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;
        }

        th, td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
        }

        th {
            background-color: #f8f9fa;
            font-weight: 600;
            color: #1a1a1a;
        }

        tr:nth-child(even) {
            background-color: #f9fafb;
        }

        hr {
            border: none;
            border-top: 1px solid #e5e7eb;
            margin: 24px 0;
        }

        code {
            background-color: #f3f4f6;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 0.9em;
        }

        pre {
            background-color: #f3f4f6;
            padding: 12px;
            border-radius: 6px;
            overflow-x: auto;
            margin: 12px 0;
        }

        pre code {
            background-color: transparent;
            padding: 0;
        }

        blockquote {
            border-left: 4px solid #4f46e5;
            padding-left: 16px;
            margin: 12px 0;
            color: #666;
            font-style: italic;
        }

        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 1px solid #e5e7eb;
        }

        .header h1 {
            border: none;
            margin: 0;
        }

        .header .meta {
            margin-top: 8px;
            font-size: 14px;
            color: #666;
        }

        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #999;
        }

        @media print {
            body {
                padding: 0;
            }

            .no-print {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="meta">Generated by ${author} • ${date}</div>
    </div>

    ${htmlBody}

    <div class="footer">
        <p>Document generated by Lucide AI Assistant</p>
    </div>
</body>
</html>
        `;
    }

    /**
     * Simple Markdown to HTML converter (fallback if marked is not available)
     * @param {string} markdown - Markdown content
     * @returns {string} HTML content
     */
    simpleMarkdownToHTML(markdown) {
        let html = markdown;

        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

        // Bold
        html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');

        // Italic
        html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

        // Line breaks
        html = html.replace(/\n\n/g, '</p><p>');
        html = html.replace(/\n/g, '<br>');

        // Horizontal rules
        html = html.replace(/^---$/gim, '<hr>');

        // Wrap in paragraphs
        html = '<p>' + html + '</p>';

        return html;
    }

    /**
     * Convert Markdown to basic RTF (for Word compatibility)
     * @param {string} markdown - Markdown content
     * @returns {string} RTF content
     */
    markdownToRTF(markdown) {
        // Basic RTF structure
        let rtf = '{\\rtf1\\ansi\\deff0\n';

        // Font table
        rtf += '{\\fonttbl{\\f0\\fswiss\\fcharset0 Arial;}}\n';

        // Color table
        rtf += '{\\colortbl;\\red0\\green0\\blue0;\\red79\\green70\\blue229;}\n';

        // Document
        rtf += '\\viewkind4\\uc1\\pard\\f0\\fs24\n';

        // Convert markdown content
        const lines = markdown.split('\n');

        for (let line of lines) {
            // Headers
            if (line.startsWith('# ')) {
                rtf += `\\fs36\\b ${this.escapeRTF(line.substring(2))}\\b0\\fs24\\par\n`;
            } else if (line.startsWith('## ')) {
                rtf += `\\fs28\\b ${this.escapeRTF(line.substring(3))}\\b0\\fs24\\par\n`;
            } else if (line.startsWith('### ')) {
                rtf += `\\fs24\\b ${this.escapeRTF(line.substring(4))}\\b0\\fs24\\par\n`;
            }
            // Horizontal rule
            else if (line.trim() === '---') {
                rtf += '\\par\\brdrb\\brdrs\\brdrw10\\brsp20\\par\n';
            }
            // Regular text
            else if (line.trim()) {
                // Bold
                line = line.replace(/\*\*(.*?)\*\*/g, '\\b $1\\b0');
                // Italic
                line = line.replace(/\*(.*?)\*/g, '\\i $1\\i0');

                rtf += `${this.escapeRTF(line)}\\par\n`;
            } else {
                rtf += '\\par\n';
            }
        }

        rtf += '}';

        return rtf;
    }

    /**
     * Escape special RTF characters
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeRTF(text) {
        return text
            .replace(/\\/g, '\\\\')
            .replace(/\{/g, '\\{')
            .replace(/\}/g, '\\}');
    }

    /**
     * Get file extension for format
     * @param {string} format - Format type
     * @returns {string} File extension
     */
    getExtension(format) {
        const extensions = {
            'pdf': '.pdf',
            'docx': '.rtf', // Using RTF for now
            'markdown': '.md',
            'rtf': '.rtf'
        };
        return extensions[format] || '.txt';
    }

    /**
     * Cleanup temp files
     */
    async cleanup() {
        try {
            const files = await fs.readdir(this.tempDir);
            for (const file of files) {
                await fs.unlink(path.join(this.tempDir, file));
            }
            console.log('[ExportService] Temp files cleaned up');
        } catch (error) {
            console.error('[ExportService] Error during cleanup:', error);
        }
    }
}

// Singleton instance
const exportService = new ExportService();

module.exports = exportService;
