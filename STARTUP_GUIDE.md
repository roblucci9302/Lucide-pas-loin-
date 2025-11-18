# 🚀 Guide de Démarrage - Lucide Application

**Date de création**: 18 Novembre 2025
**Version**: 0.2.4
**Status**: Application Electron Desktop

---

## 📋 Table des Matières

1. [Diagnostic Rapide](#diagnostic-rapide)
2. [Prérequis Système](#prérequis-système)
3. [Installation Complète](#installation-complète)
4. [Problèmes Courants](#problèmes-courants)
5. [Configuration Avancée](#configuration-avancée)
6. [Architecture de l'Application](#architecture-de-lapplication)

---

## 🔍 Diagnostic Rapide

Avant de commencer, vérifiez l'état de votre installation:

```bash
node scripts/diagnostic.js
```

Ce script vérifie automatiquement:
- ✅ Dépendances npm installées
- ✅ Binaire Electron présent
- ✅ Fichiers buildés (header.js, content.js)
- ✅ Configuration (.env)
- ✅ Fichiers source
- ✅ Base de données

---

## 💻 Prérequis Système

### Logiciels Requis

| Logiciel | Version Minimale | Vérification |
|----------|------------------|--------------|
| **Node.js** | v18.0.0+ | `node --version` |
| **npm** | v9.0.0+ | `npm --version` |
| **Git** | v2.0.0+ | `git --version` |

### Système d'Exploitation

- ✅ **macOS** 10.13+ (High Sierra ou supérieur)
- ✅ **Windows** 10/11 (64-bit)
- ✅ **Linux** (Ubuntu 18.04+, Debian 10+, Fedora 32+)

### Espace Disque

- **Minimum**: 500 MB (application + dépendances)
- **Recommandé**: 1 GB (avec espace pour les données)

---

## 🛠️ Installation Complète

### Étape 1: Cloner le Projet

```bash
git clone https://github.com/roblucci9302/Lucide-pas-loin-.git
cd Lucide-pas-loin-
```

### Étape 2: Installer les Dépendances

```bash
npm install
```

**⚠️ Problème connu**: Si `npm install` échoue à cause de `keytar`:

#### Sur Linux (Ubuntu/Debian):
```bash
sudo apt-get update
sudo apt-get install libsecret-1-dev
npm install
```

#### Sur Linux (Fedora/RHEL):
```bash
sudo dnf install libsecret-devel
npm install
```

#### Sur macOS/Windows:
```bash
# keytar fonctionne nativement, pas d'action requise
npm install
```

**Note**: `keytar` est optionnel. L'application fonctionne sans lui (utilise un stockage en mémoire).

### Étape 3: Créer le Fichier de Configuration

```bash
cp .env.example .env
```

**Pour le moment**, vous pouvez laisser les valeurs par défaut. L'application démarrera en mode local.

**Pour activer toutes les fonctionnalités**, éditez `.env` et ajoutez vos vraies clés API:
- Firebase (authentification cloud)
- Anthropic Claude (AI)
- OpenAI (AI)
- Deepgram (transcription audio)

### Étape 4: Builder les Fichiers UI

```bash
npm run build:renderer
```

Cette commande génère:
- `public/build/header.js` (interface header)
- `public/build/content.js` (interface principale)

### Étape 5: Vérifier l'Installation

```bash
node scripts/diagnostic.js
```

Vous devriez voir:
```
✅ TOUT EST PRÊT !
Pour démarrer: npm start
```

### Étape 6: Lancer l'Application

```bash
npm start
```

🎉 L'application Lucide devrait se lancer !

---

## 🐛 Problèmes Courants

### Problème 1: "Electron failed to install correctly"

**Symptôme**:
```
Error: Electron failed to install correctly, please delete node_modules/electron and try installing again
```

**Cause**: Le binaire Electron n'a pas été téléchargé (problème réseau, proxy, etc.)

**Solutions**:

**Option A** - Réinstaller Electron:
```bash
npm uninstall electron
npm install electron@30.5.1
```

**Option B** - Forcer le téléchargement:
```bash
cd node_modules/electron
node install.js
cd ../..
```

**Option C** - Réinstallation complète:
```bash
rm -rf node_modules package-lock.json
npm install
```

**Option D** - Configurer un proxy (si nécessaire):
```bash
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
npm install electron@30.5.1
```

---

### Problème 2: Erreur "Cannot find module 'keytar'"

**Symptôme**:
```
npm ERR! gyp ERR! configure error
npm ERR! Package 'libsecret-1', required by 'virtual:world', not found
```

**Cause**: `keytar` nécessite `libsecret-1` sur Linux

**Solution**:

✅ **Déjà corrigé dans package.json** - `keytar` est maintenant optionnel

L'application démarre sans keytar et affiche:
```
[EncryptionService] keytar is not available. Will use in-memory key for this session.
```

**Pour installer keytar (optionnel)**:
```bash
# Linux
sudo apt-get install libsecret-1-dev  # Ubuntu/Debian
sudo dnf install libsecret-devel      # Fedora/RHEL

# Puis réinstaller
npm install
```

---

### Problème 3: "better-sqlite3 build failed"

**Symptôme**:
```
Error: Cannot find module './build/Release/better_sqlite3.node'
```

**Solution**:
```bash
npm rebuild better-sqlite3
```

---

### Problème 4: Fichiers buildés manquants

**Symptôme**:
```
GET file:///public/build/header.js net::ERR_FILE_NOT_FOUND
```

**Solution**:
```bash
npm run build:renderer
```

Pour développement avec auto-rebuild:
```bash
npm run watch:renderer
```

---

### Problème 5: Base de données corrompue

**Symptôme**: Erreurs SQLite au démarrage

**Solution**:
```bash
# Sauvegarder l'ancienne DB
mv data/lucide.db data/lucide.db.backup

# Redémarrer (nouvelle DB sera créée)
npm start
```

---

## ⚙️ Configuration Avancée

### Variables d'Environnement (.env)

#### Configuration Firebase (Authentification Cloud)

```env
FIREBASE_API_KEY=AIza...
FIREBASE_AUTH_DOMAIN=votre-projet.firebaseapp.com
FIREBASE_PROJECT_ID=votre-projet
FIREBASE_STORAGE_BUCKET=votre-projet.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456:web:abc123
FIREBASE_MEASUREMENT_ID=G-XXXXXXXX
```

**Obtenir ces valeurs**:
1. Aller sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionner votre projet
3. Paramètres du projet → Applications → Configuration SDK

#### Configuration APIs IA

```env
# Claude AI (Anthropic)
ANTHROPIC_API_KEY=sk-ant-...

# OpenAI (ChatGPT, GPT-4)
OPENAI_API_KEY=sk-...

# Google Gemini
GOOGLE_API_KEY=AIza...

# Deepgram (Transcription Audio)
DEEPGRAM_API_KEY=...
```

#### Configuration Application

```env
# URL de l'interface web (pour liens de personnalisation)
pickleglass_WEB_URL=https://votre-domaine.com

# Port du serveur local (si utilisé)
PORT=3000
```

### Scripts NPM Disponibles

| Script | Description |
|--------|-------------|
| `npm start` | Lance l'application (build + electron) |
| `npm run build:renderer` | Build les fichiers UI une fois |
| `npm run watch:renderer` | Build UI avec auto-reload |
| `npm run build:all` | Build complet (UI + Web) |
| `npm run package` | Créer un package distributable |
| `npm run build` | Build pour production |
| `node scripts/diagnostic.js` | Vérifier l'état de l'installation |

### Développement

**Mode développement avec hot-reload**:
```bash
# Terminal 1: Watch et rebuild automatique
npm run watch:renderer

# Terminal 2: Lancer Electron
electron .
```

**Debugging**:
```bash
# Activer DevTools automatiquement
ELECTRON_ENABLE_LOGGING=1 npm start
```

---

## 🏗️ Architecture de l'Application

### Structure des Dossiers

```
Lucide-pas-loin-/
├── src/
│   ├── index.js              # Point d'entrée principal (Main Process)
│   ├── preload.js            # Script preload (sécurité)
│   ├── window/
│   │   └── windowManager.js  # Gestion des fenêtres Electron
│   ├── features/             # Fonctionnalités métier
│   │   ├── common/
│   │   │   ├── services/     # Services (Firebase, DB, Auth, etc.)
│   │   │   └── repositories/ # Accès données
│   │   ├── listen/           # Fonctionnalité Écoute
│   │   ├── ask/              # Fonctionnalité Questions
│   │   └── settings/         # Paramètres
│   ├── bridge/               # Communication IPC
│   └── ui/
│       ├── app/              # Application UI principale
│       │   ├── header.html   # Interface header
│       │   ├── content.html  # Interface content
│       │   ├── HeaderController.js
│       │   └── LucideApp.js
│       ├── components/       # Web Components (Lit Element)
│       ├── assets/           # CSS, images, libs
│       └── styles/           # Feuilles de style
├── public/
│   └── build/                # Fichiers JS buildés (générés)
│       ├── header.js
│       └── content.js
├── data/
│   └── lucide.db            # Base de données SQLite (créée au runtime)
├── scripts/
│   └── diagnostic.js        # Script de diagnostic
├── build.js                 # Configuration esbuild
├── .env                     # Configuration (à créer)
└── package.json             # Dépendances et scripts
```

### Technologies Utilisées

- **Framework**: Electron 30.5.1
- **UI Framework**: Lit Element (Web Components)
- **Build Tool**: esbuild
- **Database**: better-sqlite3
- **Backend**: Firebase (optionnel)
- **AI**: Anthropic Claude, OpenAI, Google Gemini
- **Audio**: Deepgram (transcription)

### Flux de Démarrage

1. **npm start** exécute `npm run build:renderer && electron .`
2. **build:renderer** compile `HeaderController.js` → `header.js` et `LucideApp.js` → `content.js`
3. **electron .** lance `src/index.js` (Main Process)
4. **index.js** initialise:
   - dotenv (charge `.env`)
   - Firebase (optionnel)
   - Database SQLite (crée `data/lucide.db` si nécessaire)
   - Services (Auth, ModelState, Encryption, etc.)
   - Window Manager (crée les fenêtres)
5. **Window Manager** charge:
   - `header.html` → charge `public/build/header.js`
   - `content.html` → charge `public/build/content.js`
6. **Renderer Process** affiche l'interface utilisateur

---

## 📞 Support et Débogage

### Logs de Diagnostic

**Voir tous les logs Electron**:
```bash
ELECTRON_ENABLE_LOGGING=1 npm start
```

**Logs de la console**:
- Ouvrir DevTools dans l'application (Cmd/Ctrl + Shift + I)
- Onglet Console

**Logs du Main Process**:
- Affichés dans le terminal où vous avez lancé `npm start`

### Fichiers de Log

- **Database**: Logs dans la console au démarrage
- **Firebase**: Logs préfixés `[Firebase]`
- **Encryption**: Logs préfixés `[EncryptionService]`

### Vérifications Finales

✅ **Avant de signaler un bug**:

1. Exécuter le diagnostic:
   ```bash
   node scripts/diagnostic.js
   ```

2. Vérifier les logs dans la console

3. Vérifier que `.env` est configuré

4. Essayer avec une base de données vide:
   ```bash
   mv data/lucide.db data/lucide.db.backup
   npm start
   ```

---

## 🎯 Résumé - Démarrage Express

**Installation en 30 secondes**:
```bash
git clone https://github.com/roblucci9302/Lucide-pas-loin-.git
cd Lucide-pas-loin-
npm install
cp .env.example .env
npm run build:renderer
npm start
```

**En cas de problème**:
```bash
node scripts/diagnostic.js
```

---

**Créé par**: Audit automatisé Claude
**Dernière mise à jour**: 18 Novembre 2025
**Version du guide**: 1.0
