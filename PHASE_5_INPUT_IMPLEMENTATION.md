# Phase 5 INPUT : Upload & Parsing Avancé de Documents ✅

**Date** : 2025-11-18
**Status** : ✅ Complété (INPUT partie)
**Objectif** : Permettre l'upload intuitif et le parsing avancé de documents multiples formats

---

## 📋 Vue d'ensemble

Phase 5 INPUT implémente la première partie de la gestion documentaire : l'**upload et parsing avancé** de documents.

### Fonctionnalités implémentées

✅ **Parsing multi-formats** :
- PDF : texte extraction (pdf-parse)
- Excel : sheets + données + formules (xlsx)
- DOCX : texte extraction (mammoth)
- Images : OCR ready (Tesseract.js)
- TXT/MD : parsing direct

✅ **Sécurité** :
- Validation taille (max 50MB)
- Whitelist types MIME
- Détection signatures executables
- Sanitization noms de fichiers

✅ **Upload multiple** :
- Batch processing
- Rapport détaillé (success/failed)
- Preview génération

✅ **IPC Handlers** :
- 6 handlers pour upload/preview/delete
- Integration complète dans featureBridge

---

## 🏗️ Architecture Implémentée

```
Frontend (UI)
  ↓ IPC
documentUploadBridge (6 handlers)
  • upload:file
  • upload:multiple
  • upload:preview
  • upload:get-document
  • upload:delete-document
  • upload:get-supported-types
  ↓
DocumentInputService
  • processFile()
  • handleMultipleUploads()
  • extractContent()
  • validateFile()
  • generatePreview()
  ↓
Parsers spécialisés
  • parsePDF() - pdf-parse
  • parseExcel() - xlsx
  • parseDOCX() - mammoth
  • parseImageOCR() - Tesseract (ready)
  • parseText()
  ↓
Storage
  • File system (data/uploads/{userId}/)
  • SQLite (documents table)
```

---

## 📦 Fichiers Créés

### 1. DocumentInputService (600+ lignes)

**Chemin** : `src/features/common/services/documentInputService.js`

**Fonctionnalités principales** :

```javascript
class DocumentInputService {
    // Upload et parsing
    async processFile(file, userId, options)
    async handleMultipleUploads(files, userId, options)

    // Parsers spécialisés
    async parsePDF(filePath)           // pdf-parse
    async parseExcel(filePath)         // xlsx
    async parseDOCX(filePath)          // mammoth
    async parseImageOCR(filePath)      // Tesseract.js
    async parsePowerPoint(filePath)    // TODO
    async parseText(filePath)

    // Utilitaires
    async validateFile(file)
    async saveFile(file, userId)
    async extractMetadata(file, content)
    async generatePreview(content, fileType)
    async storeDocument(data)
    async deleteDocument(documentId, userId)
}
```

**Caractéristiques** :

- ✅ Lazy loading des dépendances lourdes (pdf-parse, xlsx, mammoth)
- ✅ Validation stricte (taille, type, signatures)
- ✅ Parsing intelligent selon le type
- ✅ Preview automatique
- ✅ Gestion d'erreurs robuste
- ✅ Logging détaillé

**Exemple d'utilisation** :

```javascript
const result = await documentInputService.processFile(
    {
        name: 'report.pdf',
        size: 1024000,
        type: 'application/pdf',
        buffer: fileBuffer
    },
    userId,
    { parseImages: true }
);

// Returns:
{
    success: true,
    documentId: '123-abc',
    preview: { type: 'text', content: 'First 500 chars...' },
    metadata: { pages: 10, fileName: 'report.pdf' },
    stats: { size: 1024000, type: 'application/pdf', pages: 10 }
}
```

---

### 2. DocumentUploadBridge (180+ lignes)

**Chemin** : `src/bridge/modules/documentUploadBridge.js`

**6 Handlers IPC** :

```javascript
// 1. Upload fichier unique
ipcMain.handle('upload:file', async (event, { file, options }) => { })

// 2. Upload multiple (batch)
ipcMain.handle('upload:multiple', async (event, { files, options }) => { })

// 3. Preview avant upload
ipcMain.handle('upload:preview', async (event, { file }) => { })

// 4. Récupérer document
ipcMain.handle('upload:get-document', async (event, { documentId }) => { })

// 5. Supprimer document
ipcMain.handle('upload:delete-document', async (event, { documentId }) => { })

// 6. Types supportés
ipcMain.handle('upload:get-supported-types', async () => { })
```

**Exemple d'utilisation (Frontend)** :

```javascript
// Upload single file
const result = await window.api.invoke('upload:file', {
    file: {
        name: 'data.xlsx',
        size: fileBlob.size,
        type: fileBlob.type,
        buffer: await fileBlob.arrayBuffer()
    },
    options: { parseSheets: true }
});

if (result.success) {
    console.log('Document ID:', result.documentId);
    console.log('Preview:', result.preview);
}

// Upload multiple files
const batchResult = await window.api.invoke('upload:multiple', {
    files: [file1, file2, file3]
});

console.log(`${batchResult.successful}/${batchResult.total} uploaded`);
```

---

### 3. Integration featureBridge.js

**Modification** : Ajout de documentUploadBridge

```javascript
const documentUploadBridge = require('./modules/documentUploadBridge');

// In initialize()
documentUploadBridge.initialize(); // Phase 5 - Document Management (INPUT)
```

---

## 🎯 Fonctionnalités Détaillées

### 1. Parsing PDF Avancé

**Implémenté** :
- ✅ Extraction texte (pdf-parse)
- ✅ Métadonnées (auteur, pages, etc.)
- ✅ Comptage pages

**À implémenter (Phase 5.1)** :
- ⏳ Extraction images (pdf2pic)
- ⏳ Extraction tableaux (tabula-js)

**Code** :

```javascript
async parsePDF(filePath) {
    const buffer = await fs.readFile(filePath);
    const data = await pdfParse(buffer);

    return {
        type: 'pdf',
        text: data.text,
        pages: data.numpages,
        metadata: data.info,
        images: [], // TODO: pdf2pic
        tables: []  // TODO: tabula-js
    };
}
```

---

### 2. Parsing Excel Complet

**Implémenté** :
- ✅ Toutes les sheets
- ✅ Données en array
- ✅ Formules extraction
- ✅ Range detection

**Code** :

```javascript
async parseExcel(filePath) {
    const workbook = XLSX.readFile(filePath);
    const sheets = [];

    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const formulas = XLSX.utils.sheet_to_formulae(sheet);

        sheets.push({
            name: sheetName,
            data,          // [[cell1, cell2], [cell3, cell4]]
            formulas,      // ['A1=SUM(B1:B10)', ...]
            rows: data.length,
            cols: data[0]?.length || 0
        });
    }

    return { type: 'excel', text, sheets };
}
```

**Exemple résultat** :

```json
{
    "type": "excel",
    "text": "Sheet: Sales Q1\nJan\t1000\nFeb\t1200...",
    "sheets": [
        {
            "name": "Sales Q1",
            "data": [
                ["Month", "Revenue"],
                ["Jan", 1000],
                ["Feb", 1200]
            ],
            "formulas": ["C2=SUM(B2:B10)"],
            "rows": 3,
            "cols": 2
        }
    ]
}
```

---

### 3. Validation Sécurité

**Implémenté** :

```javascript
async validateFile(file) {
    // 1. Size check (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
        throw new Error('File too large (max 50MB)');
    }

    // 2. Type whitelist
    const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument...',
        'text/plain',
        'image/png',
        // ...
    ];

    if (!allowedTypes.includes(file.type)) {
        throw new Error(`File type not allowed: ${file.type}`);
    }

    // 3. Signature check (prevent executables)
    const header = buffer.slice(0, 4).toString('hex');
    const dangerousHeaders = [
        '4d5a9000', // EXE
        '7f454c46', // ELF
        'cafebabe'  // Java class
    ];

    if (dangerousHeaders.includes(header)) {
        throw new Error('Potentially dangerous file detected');
    }

    return true;
}
```

---

### 4. Preview Génération

**Types de preview** :

```javascript
// Preview texte (PDF, DOCX, TXT)
{
    type: 'text',
    content: 'First 500 chars of the document...'
}

// Preview tableau (Excel)
{
    type: 'table',
    sheetName: 'Sales Q1',
    rows: [
        ['Month', 'Revenue'],
        ['Jan', 1000],
        ['Feb', 1200]
    ],
    totalRows: 100,
    totalCols: 10
}

// Preview slide (PowerPoint)
{
    type: 'slide',
    content: { title: 'Intro', text: '...' }
}
```

---

### 5. Upload Multiple (Batch)

**Code** :

```javascript
async handleMultipleUploads(files, userId) {
    const results = [];

    for (const file of files) {
        try {
            const result = await this.processFile(file, userId);
            results.push({
                success: true,
                fileName: file.name,
                documentId: result.documentId
            });
        } catch (error) {
            results.push({
                success: false,
                fileName: file.name,
                error: error.message
            });
        }
    }

    return {
        total: files.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
    };
}
```

**Exemple résultat** :

```json
{
    "total": 3,
    "successful": 2,
    "failed": 1,
    "results": [
        {
            "success": true,
            "fileName": "report.pdf",
            "documentId": "123"
        },
        {
            "success": true,
            "fileName": "data.xlsx",
            "documentId": "124"
        },
        {
            "success": false,
            "fileName": "image.exe",
            "error": "File type not allowed"
        }
    ]
}
```

---

## 📦 Dépendances NPM Requises

```json
{
  "dependencies": {
    "pdf-parse": "^1.1.1",        // ✅ PDF text extraction
    "xlsx": "^0.18.5",             // ✅ Excel parsing
    "mammoth": "^1.6.0",           // ✅ DOCX parsing
    "tesseract.js": "^4.1.1"       // ⏳ OCR (optionnel, lourd)
  },
  "devDependencies": {
    "pdf2pic": "^2.1.4",           // ⏳ PDF images (Phase 5.1)
    "tabula-js": "^1.0.0"          // ⏳ PDF tables (Phase 5.1)
  }
}
```

**Installation** :

```bash
npm install pdf-parse xlsx mammoth
# Optionnel (OCR, lourd ~50MB):
# npm install tesseract.js
```

---

## 🧪 Tests

### Test 1: Upload PDF

```javascript
const pdfFile = {
    name: 'report.pdf',
    type: 'application/pdf',
    size: 1024000,
    buffer: fs.readFileSync('./test.pdf')
};

const result = await window.api.invoke('upload:file', { file: pdfFile });

console.log(result);
// {
//   success: true,
//   documentId: '...',
//   preview: { type: 'text', content: '...' },
//   stats: { pages: 10 }
// }
```

### Test 2: Upload Excel

```javascript
const excelFile = {
    name: 'sales.xlsx',
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 512000,
    buffer: fs.readFileSync('./test.xlsx')
};

const result = await window.api.invoke('upload:file', { file: excelFile });

console.log(result.preview);
// {
//   type: 'table',
//   sheetName: 'Sales Q1',
//   rows: [['Month', 'Revenue'], ['Jan', 1000]],
//   totalRows: 100
// }
```

### Test 3: Batch Upload

```javascript
const files = [pdfFile, excelFile, txtFile];

const result = await window.api.invoke('upload:multiple', { files });

console.log(`${result.successful}/${result.total} uploaded`);
// 3/3 uploaded
```

---

## 🚀 Prochaines Étapes (Phase 5 OUTPUT)

### À implémenter

1. **UI Drag & Drop Component** (React)
   - Zone drag & drop élégante
   - Preview en temps réel
   - Barre de progression
   - Liste fichiers uploadés

2. **DocumentGenerationService**
   - Templates par agent
   - Génération depuis conversations
   - Formatting professionnel

3. **Templates Professionnels**
   - IT Expert : Technical Documentation
   - Marketing Expert : Campaign Brief
   - HR Specialist : HR Report
   - CEO Advisor : Board Report

4. **Export Multi-formats**
   - PDF avec headers/footers
   - DOCX avec tableaux
   - Markdown avec formatting

---

## ✅ Résumé Phase 5 INPUT

**Créé** :
- ✅ DocumentInputService (600+ lignes)
- ✅ documentUploadBridge (180+ lignes)
- ✅ Integration featureBridge

**Fonctionnalités** :
- ✅ Parsing PDF (texte)
- ✅ Parsing Excel (sheets + formules)
- ✅ Parsing DOCX (texte)
- ✅ Parsing TXT/MD
- ✅ OCR ready (Tesseract)
- ✅ Upload multiple
- ✅ Validation sécurité
- ✅ Preview génération
- ✅ 6 IPC handlers

**Total** : ~800 lignes ajoutées

**Prochaine étape** : Phase 5 OUTPUT (UI + Génération)

---

**Lucide peut maintenant comprendre VOS documents avec parsing intelligent ! 📄✨**
