import { html, css, LitElement } from '../../ui/assets/lit-core-2.7.4.min.js';
import { parser, parser_write, parser_end, default_renderer } from '../../ui/assets/smd.js';
import './QuickActionsPanel.js';

export class AskView extends LitElement {
    static properties = {
        currentResponse: { type: String },
        currentQuestion: { type: String },
        isLoading: { type: Boolean },
        copyState: { type: String },
        isHovering: { type: Boolean },
        hoveredLineIndex: { type: Number },
        lineCopyState: { type: Object },
        showTextInput: { type: Boolean },
        headerText: { type: String },
        headerAnimating: { type: Boolean },
        isStreaming: { type: Boolean },
        urlInputValue: { type: String },
        browserMode: { type: Boolean },
        webviewLoading: { type: Boolean },
        browserError: { type: Object },
        pageTitle: { type: String },
        // 🆕 NIVEAU 3 : Propriétés avancées
        zoomLevel: { type: Number },
        devToolsOpen: { type: Boolean },
        findInPageOpen: { type: Boolean },
        findQuery: { type: String },
        findResults: { type: Object },
        currentFavicon: { type: String },
        isSecure: { type: Boolean },
        downloadInProgress: { type: Object },
    };

    static styles = css`
        :host {
            display: block;
            width: 100%;
            height: 100%;
            color: white;
            transform: translate3d(0, 0, 0);
            backface-visibility: hidden;
            transition: transform 0.2s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.2s ease-out;
            will-change: transform, opacity;
        }

        :host(.hiding) {
            animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.6, 1) forwards;
        }

        :host(.showing) {
            animation: slideDown 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        :host(.hidden) {
            opacity: 0;
            transform: translateY(-150%) scale(0.85);
            pointer-events: none;
        }

        @keyframes slideUp {
            0% {
                opacity: 1;
                transform: translateY(0) scale(1);
                filter: blur(0px);
            }
            30% {
                opacity: 0.7;
                transform: translateY(-20%) scale(0.98);
                filter: blur(0.5px);
            }
            70% {
                opacity: 0.3;
                transform: translateY(-80%) scale(0.92);
                filter: blur(1.5px);
            }
            100% {
                opacity: 0;
                transform: translateY(-150%) scale(0.85);
                filter: blur(2px);
            }
        }

        @keyframes slideDown {
            0% {
                opacity: 0;
                transform: translateY(-150%) scale(0.85);
                filter: blur(2px);
            }
            30% {
                opacity: 0.5;
                transform: translateY(-50%) scale(0.92);
                filter: blur(1px);
            }
            65% {
                opacity: 0.9;
                transform: translateY(-5%) scale(0.99);
                filter: blur(0.2px);
            }
            85% {
                opacity: 0.98;
                transform: translateY(2%) scale(1.005);
                filter: blur(0px);
            }
            100% {
                opacity: 1;
                transform: translateY(0) scale(1);
                filter: blur(0px);
            }
        }

        * {
            font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            cursor: default;
            user-select: none;
        }

        /* Allow text selection in assistant responses */
        .response-container, .response-container * {
            user-select: text !important;
            cursor: text !important;
        }

        .response-container pre {
            background: rgba(0, 0, 0, 0.4) !important;
            border-radius: 8px !important;
            padding: 12px !important;
            margin: 8px 0 !important;
            overflow-x: auto !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            white-space: pre !important;
            word-wrap: normal !important;
            word-break: normal !important;
        }

        .response-container code {
            font-family: 'Monaco', 'Menlo', 'Consolas', monospace !important;
            font-size: 11px !important;
            background: transparent !important;
            white-space: pre !important;
            word-wrap: normal !important;
            word-break: normal !important;
        }

        .response-container pre code {
            white-space: pre !important;
            word-wrap: normal !important;
            word-break: normal !important;
            display: block !important;
        }

        .response-container p code {
            background: rgba(255, 255, 255, 0.1) !important;
            padding: 2px 4px !important;
            border-radius: 3px !important;
            color: #ffd700 !important;
        }

        .hljs-keyword {
            color: #ff79c6 !important;
        }
        .hljs-string {
            color: #f1fa8c !important;
        }
        .hljs-comment {
            color: #6272a4 !important;
        }
        .hljs-number {
            color: #bd93f9 !important;
        }
        .hljs-function {
            color: #50fa7b !important;
        }
        .hljs-variable {
            color: #8be9fd !important;
        }
        .hljs-built_in {
            color: #ffb86c !important;
        }
        .hljs-title {
            color: #50fa7b !important;
        }
        .hljs-attr {
            color: #50fa7b !important;
        }
        .hljs-tag {
            color: #ff79c6 !important;
        }

        .ask-container {
            display: flex;
            flex-direction: column;
            height: 100%;
            width: 100%;
            background: rgba(0, 0, 0, 0.6);
            border-radius: 12px;
            outline: 0.5px rgba(255, 255, 255, 0.3) solid;
            outline-offset: -1px;
            backdrop-filter: blur(1px);
            box-sizing: border-box;
            position: relative;
            overflow: hidden;
        }

        .ask-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.15);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            border-radius: 12px;
            filter: blur(10px);
            z-index: -1;
        }

        .response-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            background: transparent;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            flex-shrink: 0;
        }

        .response-header.hidden {
            display: none;
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-shrink: 0;
        }

        .response-icon {
            width: 20px;
            height: 20px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .response-icon svg {
            width: 12px;
            height: 12px;
            stroke: rgba(255, 255, 255, 0.9);
        }

        .response-label {
            font-size: 13px;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.9);
            white-space: nowrap;
            position: relative;
            overflow: hidden;
        }

        .response-label.animating {
            animation: fadeInOut 0.3s ease-in-out;
        }

        @keyframes fadeInOut {
            0% {
                opacity: 1;
                transform: translateY(0);
            }
            50% {
                opacity: 0;
                transform: translateY(-10px);
            }
            100% {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .header-right {
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 1;
            justify-content: flex-end;
        }

        .question-text {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.7);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 300px;
            margin-right: 8px;
        }

        .header-controls {
            display: flex;
            gap: 8px;
            align-items: center;
            flex-shrink: 0;
        }

        .copy-button {
            background: transparent;
            color: rgba(255, 255, 255, 0.9);
            border: 1px solid rgba(255, 255, 255, 0.2);
            padding: 4px;
            border-radius: 3px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 24px;
            height: 24px;
            flex-shrink: 0;
            transition: background-color 0.15s ease;
            position: relative;
            overflow: hidden;
        }

        .copy-button:hover {
            background: rgba(255, 255, 255, 0.15);
        }

        .copy-button svg {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out;
        }

        .copy-button .check-icon {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.5);
        }

        .copy-button.copied .copy-icon {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.5);
        }

        .copy-button.copied .check-icon {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }

        .close-button {
            background: rgba(255, 255, 255, 0.07);
            color: white;
            border: none;
            padding: 4px;
            border-radius: 20px;
            outline: 1px rgba(255, 255, 255, 0.3) solid;
            outline-offset: -1px;
            backdrop-filter: blur(0.5px);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 20px;
            height: 20px;
        }

        .close-button:hover {
            background: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 1);
        }

        .response-container {
            flex: 1;
            padding: 16px;
            padding-left: 48px;
            overflow-y: auto;
            font-size: 14px;
            line-height: 1.6;
            background: transparent;
            min-height: 0;
            max-height: 400px;
            position: relative;
        }

        .response-container.hidden {
            display: none;
        }

        .response-container::-webkit-scrollbar {
            width: 6px;
        }

        .response-container::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 3px;
        }

        .response-container::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 3px;
        }

        .response-container::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.3);
        }

        .loading-dots {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 40px;
        }

        .loading-dot {
            width: 8px;
            height: 8px;
            background: rgba(255, 255, 255, 0.6);
            border-radius: 50%;
            animation: pulse 1.5s ease-in-out infinite;
        }

        .loading-dot:nth-child(1) {
            animation-delay: 0s;
        }

        .loading-dot:nth-child(2) {
            animation-delay: 0.2s;
        }

        .loading-dot:nth-child(3) {
            animation-delay: 0.4s;
        }

        @keyframes pulse {
            0%,
            80%,
            100% {
                opacity: 0.3;
                transform: scale(0.8);
            }
            40% {
                opacity: 1;
                transform: scale(1.2);
            }
        }

        .response-line {
            position: relative;
            padding: 2px 0;
            margin: 0;
            transition: background-color 0.15s ease;
        }

        .response-line:hover {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 4px;
        }

        .line-copy-button {
            position: absolute;
            left: -32px;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 3px;
            padding: 2px;
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.15s ease, background-color 0.15s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 20px;
            height: 20px;
        }

        .response-line:hover .line-copy-button {
            opacity: 1;
        }

        .line-copy-button:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .line-copy-button.copied {
            background: rgba(40, 167, 69, 0.3);
        }

        .line-copy-button svg {
            width: 12px;
            height: 12px;
            stroke: rgba(255, 255, 255, 0.9);
        }

        .text-input-container {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 16px;
            background: rgba(0, 0, 0, 0.1);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            flex-shrink: 0;
            transition: opacity 0.1s ease-in-out, transform 0.1s ease-in-out;
            transform-origin: bottom;
        }

        .text-input-container.hidden {
            opacity: 0;
            transform: scaleY(0);
            padding: 0;
            height: 0;
            overflow: hidden;
            border-top: none;
        }

        .text-input-container.no-response {
            border-top: none;
        }

        #textInput {
            flex: 1;
            padding: 10px 14px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 20px;
            outline: none;
            border: none;
            color: white;
            font-size: 14px;
            font-family: 'Helvetica Neue', sans-serif;
            font-weight: 400;
        }

        #textInput::placeholder {
            color: rgba(255, 255, 255, 0.5);
        }

        #textInput:focus {
            outline: none;
        }

        .response-line h1,
        .response-line h2,
        .response-line h3,
        .response-line h4,
        .response-line h5,
        .response-line h6 {
            color: rgba(255, 255, 255, 0.95);
            margin: 16px 0 8px 0;
            font-weight: 600;
        }

        .response-line p {
            margin: 8px 0;
            color: rgba(255, 255, 255, 0.9);
        }

        .response-line ul,
        .response-line ol {
            margin: 8px 0;
            padding-left: 20px;
        }

        .response-line li {
            margin: 4px 0;
            color: rgba(255, 255, 255, 0.9);
        }

        .response-line code {
            background: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.95);
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 13px;
        }

        .response-line pre {
            background: rgba(255, 255, 255, 0.05);
            color: rgba(255, 255, 255, 0.95);
            padding: 12px;
            border-radius: 6px;
            overflow-x: auto;
            margin: 12px 0;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .response-line pre code {
            background: none;
            padding: 0;
        }

        .response-line blockquote {
            border-left: 3px solid rgba(255, 255, 255, 0.3);
            margin: 12px 0;
            padding: 8px 16px;
            background: rgba(255, 255, 255, 0.05);
            color: rgba(255, 255, 255, 0.8);
        }

        .empty-state {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: rgba(255, 255, 255, 0.5);
            font-size: 14px;
        }

        .btn-gap {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            gap: 4px;
        }

        /* ────────────────[ GLASS BYPASS ]─────────────── */
        :host-context(body.has-glass) .ask-container,
        :host-context(body.has-glass) .response-header,
        :host-context(body.has-glass) .response-icon,
        :host-context(body.has-glass) .copy-button,
        :host-context(body.has-glass) .close-button,
        :host-context(body.has-glass) .line-copy-button,
        :host-context(body.has-glass) .text-input-container,
        :host-context(body.has-glass) .response-container pre,
        :host-context(body.has-glass) .response-container p code,
        :host-context(body.has-glass) .response-container pre code {
            background: transparent !important;
            border: none !important;
            outline: none !important;
            box-shadow: none !important;
            filter: none !important;
            backdrop-filter: none !important;
        }

        :host-context(body.has-glass) .ask-container::before {
            display: none !important;
        }

        :host-context(body.has-glass) .copy-button:hover,
        :host-context(body.has-glass) .close-button:hover,
        :host-context(body.has-glass) .line-copy-button,
        :host-context(body.has-glass) .line-copy-button:hover,
        :host-context(body.has-glass) .response-line:hover {
            background: transparent !important;
        }

        :host-context(body.has-glass) .response-container::-webkit-scrollbar-track,
        :host-context(body.has-glass) .response-container::-webkit-scrollbar-thumb {
            background: transparent !important;
        }

        .submit-btn, .clear-btn {
            display: flex;
            align-items: center;
            background: transparent;
            color: white;
            border: none;
            border-radius: 6px;
            margin-left: 8px;
            font-size: 13px;
            font-family: 'Helvetica Neue', sans-serif;
            font-weight: 500;
            overflow: hidden;
            cursor: pointer;
            transition: background 0.15s;
            height: 32px;
            padding: 0 10px;
            box-shadow: none;
        }
        .submit-btn:hover, .clear-btn:hover {
            background: rgba(255,255,255,0.1);
        }
        .btn-label {
            margin-right: 8px;
            display: flex;
            align-items: center;
            height: 100%;
        }
        .btn-icon {
            background: rgba(255,255,255,0.1);
            border-radius: 13%;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 18px;
            height: 18px;
        }
        .btn-icon img, .btn-icon svg {
            width: 13px;
            height: 13px;
            display: block;
        }
        .header-clear-btn {
            background: transparent;
            border: none;
            display: flex;
            align-items: center;
            gap: 2px;
            cursor: pointer;
            padding: 0 2px;
        }
        .header-clear-btn .icon-box {
            color: white;
            font-size: 12px;
            font-family: 'Helvetica Neue', sans-serif;
            font-weight: 500;
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 13%;
            width: 18px;
            height: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .header-clear-btn:hover .icon-box {
            background-color: rgba(255,255,255,0.18);
        }

        /* Styles pour le mode navigateur */
        .browser-mode {
            display: flex;
            flex-direction: column;
            height: 100%;
        }

        .browser-navigation-bar {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background: rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            height: 44px;
            flex-shrink: 0;
        }

        .nav-button {
            background: rgba(255, 255, 255, 0.1);
            border: none;
            border-radius: 6px;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: rgba(255, 255, 255, 0.9);
            transition: all 0.2s ease;
        }

        .nav-button:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.15);
        }

        .nav-button:disabled {
            opacity: 0.3;
            cursor: not-allowed;
        }

        .close-browser-btn {
            background: rgba(255, 80, 80, 0.2);
        }

        .close-browser-btn:hover {
            background: rgba(255, 80, 80, 0.3);
        }

        .url-display {
            flex: 1;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 8px;
            padding: 6px 12px;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.7);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .url-input {
            flex: 1;
            background: rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            padding: 6px 12px;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.9);
            font-family: 'SF Mono', 'Menlo', monospace;
            outline: none;
            transition: all 0.2s;
            cursor: text;
        }

        .url-input:hover {
            background: rgba(0, 0, 0, 0.3);
            border-color: rgba(255, 255, 255, 0.3);
        }

        .url-input:focus {
            background: rgba(0, 0, 0, 0.4);
            border-color: rgba(100, 150, 255, 0.6);
            box-shadow: 0 0 0 2px rgba(100, 150, 255, 0.2);
        }

        .browser-webview {
            flex: 1;
            width: 100%;
            height: 100%; /* CORRECTION BUG #1c : Hauteur explicite pour webview */
            min-height: 0; /* Permet au flex de réduire la taille si nécessaire */
            border: none;
            background: white;
        }

        /* 🆕 NIVEAU 1 : Loading indicator */
        .loading-indicator {
            position: absolute;
            top: 44px; /* Hauteur de la barre de navigation */
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 16px;
            z-index: 100;
            backdrop-filter: blur(4px);
        }

        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(255, 255, 255, 0.2);
            border-top-color: rgba(100, 150, 255, 0.8);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .loading-text {
            color: rgba(255, 255, 255, 0.9);
            font-size: 13px;
            font-weight: 500;
        }

        /* 🆕 NIVEAU 1 : Error display */
        .browser-error {
            position: absolute;
            top: 44px;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(20, 20, 30, 0.95);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 16px;
            z-index: 100;
            padding: 32px;
            backdrop-filter: blur(8px);
        }

        .error-icon {
            width: 64px;
            height: 64px;
            background: rgba(255, 80, 80, 0.15);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 8px;
        }

        .error-icon svg {
            width: 32px;
            height: 32px;
            stroke: rgba(255, 80, 80, 0.9);
            stroke-width: 2;
        }

        .error-title {
            color: rgba(255, 255, 255, 0.95);
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 4px;
        }

        .error-message {
            color: rgba(255, 255, 255, 0.7);
            font-size: 13px;
            text-align: center;
            max-width: 400px;
            line-height: 1.5;
        }

        .error-code {
            color: rgba(255, 255, 255, 0.5);
            font-size: 11px;
            font-family: 'SF Mono', 'Menlo', monospace;
            margin-top: 8px;
        }

        .error-retry-btn {
            margin-top: 16px;
            background: rgba(100, 150, 255, 0.2);
            border: 1px solid rgba(100, 150, 255, 0.4);
            color: rgba(255, 255, 255, 0.9);
            padding: 8px 20px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
        }

        .error-retry-btn:hover {
            background: rgba(100, 150, 255, 0.3);
            border-color: rgba(100, 150, 255, 0.6);
        }

        /* ═══════════════════════════════════════════════════════════ */
        /* 🆕 NIVEAU 3 : STYLES POUR FONCTIONNALITÉS AVANCÉES */
        /* ═══════════════════════════════════════════════════════════ */

        /* 🔧 DevTools Button */
        .devtools-button {
            background: rgba(255, 180, 50, 0.15);
            border: 1px solid rgba(255, 180, 50, 0.3);
        }

        .devtools-button:hover:not(:disabled) {
            background: rgba(255, 180, 50, 0.25);
            border-color: rgba(255, 180, 50, 0.5);
        }

        .devtools-button.active {
            background: rgba(255, 180, 50, 0.3);
            border-color: rgba(255, 180, 50, 0.6);
        }

        /* 🔍 Zoom Controls */
        .zoom-controls {
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .zoom-level {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.7);
            min-width: 40px;
            text-align: center;
        }

        /* 🔎 Find in Page Bar */
        .find-bar {
            position: absolute;
            top: 44px;
            right: 12px;
            background: rgba(30, 30, 40, 0.98);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            padding: 8px 12px;
            display: flex;
            align-items: center;
            gap: 8px;
            z-index: 200;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(10px);
        }

        .find-input {
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            padding: 4px 8px;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.9);
            width: 200px;
            outline: none;
            cursor: text;
            user-select: text;
        }

        .find-input:focus {
            border-color: rgba(100, 150, 255, 0.6);
            box-shadow: 0 0 0 2px rgba(100, 150, 255, 0.2);
        }

        .find-results {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.6);
            min-width: 50px;
        }

        .find-nav-button {
            background: rgba(255, 255, 255, 0.1);
            border: none;
            border-radius: 4px;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: rgba(255, 255, 255, 0.8);
            transition: all 0.15s;
        }

        .find-nav-button:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .find-close-button {
            background: rgba(255, 80, 80, 0.2);
            border: none;
            border-radius: 4px;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: rgba(255, 255, 255, 0.9);
            transition: all 0.15s;
        }

        .find-close-button:hover {
            background: rgba(255, 80, 80, 0.3);
        }

        /* 🔒 Security Indicator */
        .security-indicator {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            width: 16px;
            height: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .security-indicator.secure {
            color: rgba(80, 200, 120, 0.9);
        }

        .security-indicator.insecure {
            color: rgba(255, 180, 50, 0.9);
        }

        .url-input-with-icons {
            flex: 1;
            position: relative;
        }

        .url-input-with-icons .url-input {
            width: 100%;
            padding-left: 32px;
            padding-right: 32px;
        }

        /* 🎨 Favicon */
        .favicon-container {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            width: 16px;
            height: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .favicon {
            width: 16px;
            height: 16px;
            border-radius: 2px;
        }

        .favicon-placeholder {
            width: 16px;
            height: 16px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 2px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            color: rgba(255, 255, 255, 0.5);
        }

        /* 📥 Download Popup */
        .download-popup {
            position: absolute;
            bottom: 16px;
            right: 16px;
            background: rgba(30, 30, 40, 0.98);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            padding: 16px;
            min-width: 320px;
            max-width: 400px;
            z-index: 300;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(10px);
        }

        .download-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
        }

        .download-icon {
            width: 40px;
            height: 40px;
            background: rgba(100, 150, 255, 0.2);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .download-icon svg {
            width: 20px;
            height: 20px;
            stroke: rgba(100, 150, 255, 0.9);
        }

        .download-info {
            flex: 1;
            min-width: 0;
        }

        .download-filename {
            font-size: 13px;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.9);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .download-size {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.5);
            margin-top: 2px;
        }

        .download-progress {
            width: 100%;
            height: 4px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 2px;
            overflow: hidden;
            margin: 12px 0;
        }

        .download-progress-bar {
            height: 100%;
            background: linear-gradient(90deg, rgba(100, 150, 255, 0.8), rgba(100, 200, 255, 0.8));
            border-radius: 2px;
            transition: width 0.3s ease;
        }

        .download-actions {
            display: flex;
            gap: 8px;
            margin-top: 12px;
        }

        .download-btn {
            flex: 1;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
        }

        .download-btn.primary {
            background: rgba(100, 150, 255, 0.3);
            border: 1px solid rgba(100, 150, 255, 0.5);
            color: rgba(255, 255, 255, 0.9);
        }

        .download-btn.primary:hover {
            background: rgba(100, 150, 255, 0.4);
            border-color: rgba(100, 150, 255, 0.7);
        }

        .download-btn.secondary {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: rgba(255, 255, 255, 0.7);
        }

        .download-btn.secondary:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.3);
        }

        .download-status {
            font-size: 12px;
            margin-top: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .download-status.success {
            color: rgba(80, 200, 120, 0.9);
        }

        .download-status.error {
            color: rgba(255, 80, 80, 0.9);
        }
    `;

    constructor() {
        super();
        this.currentResponse = '';
        this.currentQuestion = '';
        this.isLoading = false;
        this.copyState = 'idle';
        this.showTextInput = true;
        this.headerText = 'AI Response';
        this.headerAnimating = false;
        this.isStreaming = false;

        this.marked = null;
        this.hljs = null;
        this.DOMPurify = null;
        this.isLibrariesLoaded = false;

        // SMD.js streaming markdown parser
        this.smdParser = null;
        this.smdContainer = null;
        this.lastProcessedLength = 0;

        // Browser mode pour afficher les sites web
        this.browserMode = false;
        this.currentUrl = '';
        this.urlInputValue = '';
        this.browserHistory = [];
        this.browserHistoryIndex = -1;
        this.webviewLoading = false;
        this.browserError = null;
        this.pageTitle = '';
        this.webviewListeners = []; // Pour cleanup des listeners

        // 🆕 NIVEAU 3 : Fonctionnalités avancées
        this.zoomLevel = 100; // 100 = 100%
        this.devToolsOpen = false;
        this.findInPageOpen = false;
        this.findQuery = '';
        this.findResults = { activeMatchOrdinal: 0, matches: 0 };
        this.currentFavicon = '';
        this.isSecure = false;
        this.downloadInProgress = null;
        this.findRequestId = null; // Pour tracking des requêtes find

        this.handleSendText = this.handleSendText.bind(this);
        this.handleTextKeydown = this.handleTextKeydown.bind(this);
        this.handleCopy = this.handleCopy.bind(this);
        this.clearResponseContent = this.clearResponseContent.bind(this);
        this.handleEscKey = this.handleEscKey.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
        this.handleCloseAskWindow = this.handleCloseAskWindow.bind(this);
        this.handleCloseIfNoContent = this.handleCloseIfNoContent.bind(this);
        this.handleOpenUrl = this.handleOpenUrl.bind(this);
        this.handleCloseBrowser = this.handleCloseBrowser.bind(this);
        this.handleBrowserBack = this.handleBrowserBack.bind(this);
        this.handleBrowserForward = this.handleBrowserForward.bind(this);
        this.handleBrowserRefresh = this.handleBrowserRefresh.bind(this);
        this.handleBrowserStop = this.handleBrowserStop.bind(this);
        // 🆕 NIVEAU 3 : Bindings handlers avancés
        this.handleToggleDevTools = this.handleToggleDevTools.bind(this);
        this.handleZoomIn = this.handleZoomIn.bind(this);
        this.handleZoomOut = this.handleZoomOut.bind(this);
        this.handleZoomReset = this.handleZoomReset.bind(this);
        this.handleOpenFindInPage = this.handleOpenFindInPage.bind(this);
        this.handleCloseFindInPage = this.handleCloseFindInPage.bind(this);
        this.handleFindQueryChange = this.handleFindQueryChange.bind(this);
        this.handleFindNext = this.handleFindNext.bind(this);
        this.handleFindPrevious = this.handleFindPrevious.bind(this);
        this.handleDownloadAccept = this.handleDownloadAccept.bind(this);
        this.handleDownloadCancel = this.handleDownloadCancel.bind(this);
        this.handleDownloadComplete = this.handleDownloadComplete.bind(this);
        this.handleDownloadError = this.handleDownloadError.bind(this);
        this.handleBrowserKeydown = this.handleBrowserKeydown.bind(this);

        this.loadLibraries();

        // --- Resize helpers ---
        this.isThrottled = false;
    }

    connectedCallback() {
        super.connectedCallback();

        console.log('📱 AskView connectedCallback - IPC 이벤트 리스너 설정');

        document.addEventListener('keydown', this.handleEscKey);
        // 🆕 NIVEAU 3 : Raccourcis clavier pour le navigateur
        document.addEventListener('keydown', this.handleBrowserKeydown);

        this.resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                const needed = entry.contentRect.height;
                const current = window.innerHeight;

                if (needed > current - 4) {
                    this.requestWindowResize(Math.ceil(needed));
                }
            }
        });

        const container = this.shadowRoot?.querySelector('.ask-container');
        if (container) this.resizeObserver.observe(container);

        this.handleQuestionFromAssistant = (event, question) => {
            console.log('AskView: Received question from ListenView:', question);
            this.handleSendText(null, question);
        };

        // Handle workflow selection from QuickActionsPanel
        this.handleWorkflowSelected = async (event) => {
            const { workflow } = event.detail;
            console.log('[AskView] Workflow selected:', workflow.id);

            try {
                // Get active profile
                const profileData = await window.api.settingsView.agent.getActiveProfile();
                const activeProfile = profileData || 'lucide_assistant';

                // Build prompt from workflow template
                const prompt = await window.api.workflows.buildPrompt(activeProfile, workflow.id, {});

                // Send the workflow prompt
                if (prompt) {
                    this.handleSendText(null, prompt);
                }
            } catch (error) {
                console.error('[AskView] Error handling workflow selection:', error);
            }
        };

        document.addEventListener('workflow-selected', this.handleWorkflowSelected);

        if (window.api) {
            // Écouter les événements pour ouvrir des URLs dans le navigateur intégré
            window.api.askView.onOpenUrl((event, url) => {
                console.log('[AskView] Received URL to open:', url);
                this.handleOpenUrl(url);
            });

            window.api.askView.onShowTextInput(() => {
                console.log('Show text input signal received');
                if (!this.showTextInput) {
                    this.showTextInput = true;
                    this.updateComplete.then(() => this.focusTextInput());
                  } else {
                    this.focusTextInput();
                  }
            });

            window.api.askView.onScrollResponseUp(() => this.handleScroll('up'));
            window.api.askView.onScrollResponseDown(() => this.handleScroll('down'));
            window.api.askView.onAskStateUpdate((event, newState) => {
                this.currentResponse = newState.currentResponse;
                this.currentQuestion = newState.currentQuestion;
                this.isLoading       = newState.isLoading;
                this.isStreaming     = newState.isStreaming;

                const wasHidden = !this.showTextInput;
                this.showTextInput = newState.showTextInput;

                if (newState.showTextInput) {
                  if (wasHidden) {
                    this.updateComplete.then(() => this.focusTextInput());
                  } else {
                    this.focusTextInput();
                  }
                }
              });
            console.log('AskView: IPC 이벤트 리스너 등록 완료');
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.resizeObserver?.disconnect();

        console.log('📱 AskView disconnectedCallback - IPC 이벤트 리스너 제거');

        document.removeEventListener('keydown', this.handleEscKey);
        // 🆕 NIVEAU 3 : Cleanup raccourcis clavier navigateur
        document.removeEventListener('keydown', this.handleBrowserKeydown);
        document.removeEventListener('workflow-selected', this.handleWorkflowSelected);

        if (this.copyTimeout) {
            clearTimeout(this.copyTimeout);
        }

        if (this.headerAnimationTimeout) {
            clearTimeout(this.headerAnimationTimeout);
        }

        if (this.streamingTimeout) {
            clearTimeout(this.streamingTimeout);
        }

        Object.values(this.lineCopyTimeouts).forEach(timeout => clearTimeout(timeout));

        if (window.api) {
            window.api.askView.removeOnAskStateUpdate(this.handleAskStateUpdate);
            window.api.askView.removeOnShowTextInput(this.handleShowTextInput);
            window.api.askView.removeOnScrollResponseUp(this.handleScroll);
            window.api.askView.removeOnScrollResponseDown(this.handleScroll);
            console.log('✅ AskView: IPC 이벤트 리스너 제거 필요');
        }
    }


    async loadLibraries() {
        try {
            if (!window.marked) {
                await this.loadScript('../../assets/marked-4.3.0.min.js');
            }

            if (!window.hljs) {
                await this.loadScript('../../assets/highlight-11.9.0.min.js');
            }

            if (!window.DOMPurify) {
                await this.loadScript('../../assets/dompurify-3.0.7.min.js');
            }

            this.marked = window.marked;
            this.hljs = window.hljs;
            this.DOMPurify = window.DOMPurify;

            if (this.marked && this.hljs) {
                this.marked.setOptions({
                    highlight: (code, lang) => {
                        if (lang && this.hljs.getLanguage(lang)) {
                            try {
                                return this.hljs.highlight(code, { language: lang }).value;
                            } catch (err) {
                                console.warn('Highlight error:', err);
                            }
                        }
                        try {
                            return this.hljs.highlightAuto(code).value;
                        } catch (err) {
                            console.warn('Auto highlight error:', err);
                        }
                        return code;
                    },
                    breaks: true,
                    gfm: true,
                    pedantic: false,
                    smartypants: false,
                    xhtml: false,
                });

                this.isLibrariesLoaded = true;
                this.renderContent();
                console.log('Markdown libraries loaded successfully in AskView');
            }

            if (this.DOMPurify) {
                this.isDOMPurifyLoaded = true;
                console.log('DOMPurify loaded successfully in AskView');
            }
        } catch (error) {
            console.error('Failed to load libraries in AskView:', error);
        }
    }

    handleCloseAskWindow() {
        // this.clearResponseContent();
        window.api.askView.closeAskWindow();
    }

    handleMinimizeAskWindow() {
        // Minimiser la fenêtre Ask sans effacer le contenu
        window.api.askView.minimizeAskWindow();
    }

    handleShowListenWindow() {
        // Afficher la fenêtre Listen (conversation)
        window.api.askView.showListenWindow();
    }

    handleCloseIfNoContent() {
        if (!this.currentResponse && !this.isLoading && !this.isStreaming) {
            this.handleCloseAskWindow();
        }
    }

    handleEscKey(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            this.handleCloseIfNoContent();
        }
    }

    clearResponseContent() {
        this.currentResponse = '';
        this.currentQuestion = '';
        this.isLoading = false;
        this.isStreaming = false;
        this.headerText = 'AI Response';
        this.showTextInput = true;
        this.lastProcessedLength = 0;
        this.smdParser = null;
        this.smdContainer = null;
    }

    handleInputFocus() {
        this.isInputFocused = true;
    }

    focusTextInput() {
        // AMÉLIORATION : Retry mechanism pour focus
        const attemptFocus = (retries = 3) => {
            requestAnimationFrame(() => {
                const textInput = this.shadowRoot?.getElementById('textInput');
                if (textInput) {
                    textInput.focus();
                    console.log('[AskView] Text input focused successfully');
                } else if (retries > 0) {
                    console.warn(`[AskView] Input not found, retrying... (${retries} attempts left)`);
                    setTimeout(() => attemptFocus(retries - 1), 50);
                } else {
                    console.error('[AskView] Failed to find text input after multiple attempts');
                    console.error('[AskView] showTextInput state:', this.showTextInput);
                    console.error('[AskView] shadowRoot exists:', !!this.shadowRoot);
                }
            });
        };

        attemptFocus();
    }


    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    parseMarkdown(text) {
        if (!text) return '';

        if (!this.isLibrariesLoaded || !this.marked) {
            return text;
        }

        try {
            return this.marked(text);
        } catch (error) {
            console.error('Markdown parsing error in AskView:', error);
            return text;
        }
    }

    fixIncompleteCodeBlocks(text) {
        if (!text) return text;

        const codeBlockMarkers = text.match(/```/g) || [];
        const markerCount = codeBlockMarkers.length;

        if (markerCount % 2 === 1) {
            return text + '\n```';
        }

        return text;
    }

    handleScroll(direction) {
        const scrollableElement = this.shadowRoot.querySelector('#responseContainer');
        if (scrollableElement) {
            const scrollAmount = 100; // 한 번에 스크롤할 양 (px)
            if (direction === 'up') {
                scrollableElement.scrollTop -= scrollAmount;
            } else {
                scrollableElement.scrollTop += scrollAmount;
            }
        }
    }


    renderContent() {
        const responseContainer = this.shadowRoot.getElementById('responseContainer');
        if (!responseContainer) return;
    
        // Check loading state
        if (this.isLoading) {
            responseContainer.innerHTML = `
              <div class="loading-dots">
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
              </div>`;
            this.resetStreamingParser();
            return;
        }
        
        // If there is no response, show empty state
        if (!this.currentResponse) {
            responseContainer.innerHTML = `<div class="empty-state">...</div>`;
            this.resetStreamingParser();
            return;
        }
        
        // Set streaming markdown parser
        this.renderStreamingMarkdown(responseContainer);

        // After updating content, recalculate window height
        this.adjustWindowHeightThrottled();
    }

    resetStreamingParser() {
        this.smdParser = null;
        this.smdContainer = null;
        this.lastProcessedLength = 0;
    }

    setupLinkInterception(responseContainer) {
        // Éviter d'ajouter plusieurs listeners sur le même container
        if (responseContainer.hasAttribute('data-link-listener')) {
            return;
        }
        responseContainer.setAttribute('data-link-listener', 'true');

        // Event delegation : intercepter tous les clics sur les liens <a>
        responseContainer.addEventListener('click', (event) => {
            const link = event.target.closest('a');

            if (link && link.href) {
                // Vérifier que c'est un lien externe (http/https)
                if (link.href.startsWith('http://') || link.href.startsWith('https://')) {
                    event.preventDefault(); // Empêcher navigation normale
                    console.log('[AskView] Link clicked, opening in browser mode:', link.href);
                    this.handleOpenUrl(link.href); // Ouvrir dans le navigateur intégré
                }
            }
        });
    }

    renderStreamingMarkdown(responseContainer) {
        try {
            // 파서가 없거나 컨테이너가 변경되었으면 새로 생성
            if (!this.smdParser || this.smdContainer !== responseContainer) {
                this.smdContainer = responseContainer;
                this.smdContainer.innerHTML = '';

                // smd.js의 default_renderer 사용
                const renderer = default_renderer(this.smdContainer);
                this.smdParser = parser(renderer);
                this.lastProcessedLength = 0;

                // Ajouter l'interception des clics sur les liens
                this.setupLinkInterception(responseContainer);
            }

            // 새로운 텍스트만 처리 (스트리밍 최적화)
            const currentText = this.currentResponse;
            const newText = currentText.slice(this.lastProcessedLength);

            if (newText.length > 0) {
                // 새로운 텍스트 청크를 파서에 전달
                parser_write(this.smdParser, newText);
                this.lastProcessedLength = currentText.length;
            }

            // 스트리밍이 완료되면 파서 종료
            if (!this.isStreaming && !this.isLoading) {
                parser_end(this.smdParser);
            }

            // 코드 하이라이팅 적용
            if (this.hljs) {
                responseContainer.querySelectorAll('pre code').forEach(block => {
                    if (!block.hasAttribute('data-highlighted')) {
                        this.hljs.highlightElement(block);
                        block.setAttribute('data-highlighted', 'true');
                    }
                });
            }

            // 스크롤을 맨 아래로
            responseContainer.scrollTop = responseContainer.scrollHeight;

        } catch (error) {
            console.error('Error rendering streaming markdown:', error);
            // 에러 발생 시 기본 텍스트 렌더링으로 폴백
            this.renderFallbackContent(responseContainer);
        }
    }

    renderFallbackContent(responseContainer) {
        const textToRender = this.currentResponse || '';
        
        if (this.isLibrariesLoaded && this.marked && this.DOMPurify) {
            try {
                // 마크다운 파싱
                const parsedHtml = this.marked.parse(textToRender);

                // DOMPurify로 정제
                const cleanHtml = this.DOMPurify.sanitize(parsedHtml, {
                    ALLOWED_TAGS: [
                        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'b', 'em', 'i',
                        'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img', 'table', 'thead',
                        'tbody', 'tr', 'th', 'td', 'hr', 'sup', 'sub', 'del', 'ins',
                    ],
                    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel'],
                });

                responseContainer.innerHTML = cleanHtml;

                // Ajouter l'interception des clics sur les liens
                this.setupLinkInterception(responseContainer);

                // 코드 하이라이팅 적용
                if (this.hljs) {
                    responseContainer.querySelectorAll('pre code').forEach(block => {
                        this.hljs.highlightElement(block);
                    });
                }
            } catch (error) {
                console.error('Error in fallback rendering:', error);
                responseContainer.textContent = textToRender;
            }
        } else {
            // 라이브러리가 로드되지 않았을 때 기본 렌더링
            const basicHtml = textToRender
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\n\n/g, '</p><p>')
                .replace(/\n/g, '<br>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`([^`]+)`/g, '<code>$1</code>');

            responseContainer.innerHTML = `<p>${basicHtml}</p>`;

            // Ajouter l'interception des clics sur les liens
            this.setupLinkInterception(responseContainer);
        }
    }


    requestWindowResize(targetHeight) {
        if (window.api) {
            window.api.askView.adjustWindowHeight(targetHeight);
        }
    }

    animateHeaderText(text) {
        this.headerAnimating = true;
        this.requestUpdate();

        setTimeout(() => {
            this.headerText = text;
            this.headerAnimating = false;
            this.requestUpdate();
        }, 150);
    }

    startHeaderAnimation() {
            this.animateHeaderText('analyse de l\'écran...');

        if (this.headerAnimationTimeout) {
            clearTimeout(this.headerAnimationTimeout);
        }

        this.headerAnimationTimeout = setTimeout(() => {
            this.animateHeaderText('réflexion...');
        }, 1500);
    }

    renderMarkdown(content) {
        if (!content) return '';

        if (this.isLibrariesLoaded && this.marked) {
            return this.parseMarkdown(content);
        }

        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>');
    }

    fixIncompleteMarkdown(text) {
        if (!text) return text;

        // 불완전한 볼드체 처리
        const boldCount = (text.match(/\*\*/g) || []).length;
        if (boldCount % 2 === 1) {
            text += '**';
        }

        // 불완전한 이탤릭체 처리
        const italicCount = (text.match(/(?<!\*)\*(?!\*)/g) || []).length;
        if (italicCount % 2 === 1) {
            text += '*';
        }

        // 불완전한 인라인 코드 처리
        const inlineCodeCount = (text.match(/`/g) || []).length;
        if (inlineCodeCount % 2 === 1) {
            text += '`';
        }

        // 불완전한 링크 처리
        const openBrackets = (text.match(/\[/g) || []).length;
        const closeBrackets = (text.match(/\]/g) || []).length;
        if (openBrackets > closeBrackets) {
            text += ']';
        }

        const openParens = (text.match(/\]\(/g) || []).length;
        const closeParens = (text.match(/\)\s*$/g) || []).length;
        if (openParens > closeParens && text.endsWith('(')) {
            text += ')';
        }

        return text;
    }


    async handleCopy() {
        if (this.copyState === 'copied') return;

        let responseToCopy = this.currentResponse;

        if (this.isDOMPurifyLoaded && this.DOMPurify) {
            const testHtml = this.renderMarkdown(responseToCopy);
            const sanitized = this.DOMPurify.sanitize(testHtml);

            if (this.DOMPurify.removed && this.DOMPurify.removed.length > 0) {
                console.warn('Unsafe content detected, copy blocked');
                return;
            }
        }

        const textToCopy = `Question : ${this.currentQuestion}\n\nRéponse : ${responseToCopy}`;

        try {
            await navigator.clipboard.writeText(textToCopy);
            console.log('Content copied to clipboard');

            this.copyState = 'copied';
            this.requestUpdate();

            if (this.copyTimeout) {
                clearTimeout(this.copyTimeout);
            }

            this.copyTimeout = setTimeout(() => {
                this.copyState = 'idle';
                this.requestUpdate();
            }, 1500);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }

    async handleLineCopy(lineIndex) {
        const originalLines = this.currentResponse.split('\n');
        const lineToCopy = originalLines[lineIndex];

        if (!lineToCopy) return;

        try {
            await navigator.clipboard.writeText(lineToCopy);
            console.log('Line copied to clipboard');

            // '복사됨' 상태로 UI 즉시 업데이트
            this.lineCopyState = { ...this.lineCopyState, [lineIndex]: true };
            this.requestUpdate(); // LitElement에 UI 업데이트 요청

            // 기존 타임아웃이 있다면 초기화
            if (this.lineCopyTimeouts && this.lineCopyTimeouts[lineIndex]) {
                clearTimeout(this.lineCopyTimeouts[lineIndex]);
            }

            // ✨ 수정된 타임아웃: 1.5초 후 '복사됨' 상태 해제
            this.lineCopyTimeouts[lineIndex] = setTimeout(() => {
                const updatedState = { ...this.lineCopyState };
                delete updatedState[lineIndex];
                this.lineCopyState = updatedState;
                this.requestUpdate(); // UI 업데이트 요청
            }, 1500);
        } catch (err) {
            console.error('Failed to copy line:', err);
        }
    }

    async handleSendText(e, overridingText = '') {
        const textInput = this.shadowRoot?.getElementById('textInput');
        const text = (overridingText || textInput?.value || '').trim();
        // if (!text) return;

        textInput.value = '';

        // Phase WOW 1 - Jour 4: Analyze for profile suggestions
        if (window.api && window.api.profile && text && text.length >= 10) {
            try {
                // Get current profile
                const currentProfileResult = await window.api.profile.getCurrentProfile();
                const currentProfile = currentProfileResult?.profile?.active_profile || 'lucide_assistant';

                // Analyze for suggestion
                const suggestionResult = await window.api.profile.analyzeSuggestion(text, currentProfile);

                if (suggestionResult?.success && suggestionResult.suggestion) {
                    // Show suggestion banner
                    const banner = document.querySelector('profile-suggestion-banner');
                    if (banner) {
                        banner.show(suggestionResult.suggestion);
                    }
                }
            } catch (error) {
                console.error('[AskView] Error analyzing profile suggestion:', error);
                // Continue with message sending even if suggestion fails
            }
        }

        if (window.api) {
            window.api.askView.sendMessage(text).catch(error => {
                console.error('Error sending text:', error);
            });
        }
    }

    handleTextKeydown(e) {
        // Fix for IME composition issue: Ignore Enter key presses while composing.
        if (e.isComposing) {
            return;
        }

        const isPlainEnter = e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey;
        const isModifierEnter = e.key === 'Enter' && (e.metaKey || e.ctrlKey);

        if (isPlainEnter || isModifierEnter) {
            e.preventDefault();
            this.handleSendText();
        }
    }

    updated(changedProperties) {
        super.updated(changedProperties);

        // 🔧 CORRECTION BUG HAUTEUR BROWSER : Gérer ResizeObserver selon le mode
        if (changedProperties.has('browserMode')) {
            if (this.browserMode) {
                // En mode browser : déconnecter ResizeObserver pour éviter redimensionnement à 700px
                console.log('[AskView] Browser mode ON - Disconnecting ResizeObserver');
                if (this.resizeObserver) {
                    this.resizeObserver.disconnect();
                }

                // 🆕 NIVEAU 1 : Setup webview listeners quand on entre en mode browser
                // Attendre que le webview soit rendu dans le DOM
                this.updateComplete.then(() => {
                    const webview = this.shadowRoot?.querySelector('webview');
                    if (webview) {
                        // Attendre que le webview soit prêt
                        if (webview.getWebContentsId) {
                            this.setupWebviewListeners();
                        } else {
                            // Si pas encore prêt, attendre l'événement dom-ready
                            const readyHandler = () => {
                                this.setupWebviewListeners();
                                webview.removeEventListener('dom-ready', readyHandler);
                            };
                            webview.addEventListener('dom-ready', readyHandler);
                        }
                    }
                });
            } else {
                // En mode normal : reconnecter ResizeObserver pour ajustement dynamique
                console.log('[AskView] Browser mode OFF - Reconnecting ResizeObserver');
                if (this.resizeObserver) {
                    const container = this.shadowRoot?.querySelector('.ask-container');
                    if (container) {
                        this.resizeObserver.observe(container);
                    }
                }

                // 🆕 NIVEAU 1 : Cleanup webview listeners quand on sort du mode browser
                this.cleanupWebviewListeners();
            }
        }

        // ✨ isLoading 또는 currentResponse가 변경될 때마다 뷰를 다시 그립니다.
        if (changedProperties.has('isLoading') || changedProperties.has('currentResponse')) {
            this.renderContent();
        }

        if (changedProperties.has('showTextInput') || changedProperties.has('isLoading') || changedProperties.has('currentResponse')) {
            this.adjustWindowHeightThrottled();
        }

        if (changedProperties.has('showTextInput') && this.showTextInput) {
            this.focusTextInput();
        }
    }

    firstUpdated() {
        setTimeout(() => this.adjustWindowHeight(), 200);
    }


    getTruncatedQuestion(question, maxLength = 30) {
        if (!question) return '';
        if (question.length <= maxLength) return question;
        return question.substring(0, maxLength) + '...';
    }

    // Fonctions pour le mode navigateur
    async handleOpenUrl(url) {
        console.log('[AskView] Opening URL in browser mode:', url);
        this.currentUrl = url;
        this.urlInputValue = url; // Synchroniser l'input avec l'URL actuelle

        // Ajouter à l'historique si ce n'est pas un retour arrière
        if (this.browserHistoryIndex === -1 || url !== this.browserHistory[this.browserHistoryIndex]) {
            // Supprimer tout l'historique après la position actuelle
            this.browserHistory = this.browserHistory.slice(0, this.browserHistoryIndex + 1);
            // Ajouter la nouvelle URL
            this.browserHistory.push(url);
            this.browserHistoryIndex = this.browserHistory.length - 1;
        }

        // CORRECTION BUG #1b : Redimensionner la fenêtre AVANT d'activer le mode navigateur
        if (window.api && window.api.askView) {
            try {
                await window.api.askView.setBrowserMode(true);
                console.log('[AskView] Window resized to browser mode successfully');
            } catch (err) {
                console.error('[AskView] Failed to set browser mode:', err);
            }
        }

        // Activer le mode navigateur APRÈS le redimensionnement
        this.browserMode = true;
        this.requestUpdate();
    }

    handleCloseBrowser() {
        console.log('[AskView] ==========================================');
        console.log('[AskView] handleCloseBrowser() called');
        console.log('[AskView] browserMode before:', this.browserMode);
        console.log('[AskView] currentUrl before:', this.currentUrl);
        console.log('[AskView] showTextInput before:', this.showTextInput);

        this.browserMode = false;
        this.currentUrl = '';
        this.showTextInput = true; // CORRECTION BUG #2b : Réactiver l'input

        console.log('[AskView] browserMode after:', this.browserMode);
        console.log('[AskView] showTextInput after:', this.showTextInput);
        console.log('[AskView] Calling setBrowserMode(false)...');

        // Restaurer la taille normale de la fenêtre
        if (window.api && window.api.askView) {
            window.api.askView.setBrowserMode(false)
                .then(() => {
                    console.log('[AskView] setBrowserMode(false) succeeded');
                })
                .catch(err => {
                    console.error('[AskView] setBrowserMode(false) FAILED:', err);
                });
        } else {
            console.error('[AskView] window.api or window.api.askView is undefined!');
        }

        console.log('[AskView] Calling requestUpdate()...');
        this.requestUpdate();

        // Focus l'input après la mise à jour du composant
        this.updateComplete.then(() => {
            console.log('[AskView] Component updated, focusing input...');
            this.focusTextInput();
        });

        console.log('[AskView] ==========================================');
    }

    handleBrowserBack() {
        if (this.browserHistoryIndex > 0) {
            this.browserHistoryIndex--;
            this.currentUrl = this.browserHistory[this.browserHistoryIndex];
            this.urlInputValue = this.currentUrl; // Synchroniser l'input
            console.log('[AskView] Going back to:', this.currentUrl);
            this.requestUpdate();
        } else {
            // Si on est au début de l'historique, retourner à la conversation
            console.log('[AskView] At start of history, returning to conversation');
            this.handleCloseBrowser();
        }
    }

    handleBrowserForward() {
        if (this.browserHistoryIndex < this.browserHistory.length - 1) {
            this.browserHistoryIndex++;
            this.currentUrl = this.browserHistory[this.browserHistoryIndex];
            this.urlInputValue = this.currentUrl; // Synchroniser l'input
            console.log('[AskView] Going forward to:', this.currentUrl);
            this.requestUpdate();
        }
    }

    // Valider et formater l'URL saisie par l'utilisateur
    validateAndFormatUrl(url) {
        if (!url || url.trim() === '') {
            return null;
        }

        let formattedUrl = url.trim();

        // Si l'URL ne commence pas par http:// ou https://, ajouter https://
        if (!formattedUrl.match(/^https?:\/\//i)) {
            formattedUrl = 'https://' + formattedUrl;
        }

        // Vérifier que l'URL est valide
        try {
            new URL(formattedUrl);
            return formattedUrl;
        } catch (error) {
            console.error('[AskView] Invalid URL:', formattedUrl, error);
            return null;
        }
    }

    // Gérer les changements dans l'input d'URL
    handleUrlInput(e) {
        this.urlInputValue = e.target.value;
    }

    // Gérer la touche Enter pour naviguer vers l'URL
    handleUrlKeydown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const url = this.validateAndFormatUrl(this.urlInputValue);

            if (url) {
                console.log('[AskView] Navigating to URL from input:', url);
                this.handleOpenUrl(url);
            } else {
                console.warn('[AskView] Invalid URL entered:', this.urlInputValue);
                // Optionnel : afficher un message d'erreur à l'utilisateur
                alert('URL invalide. Veuillez entrer une URL valide (ex: google.com ou https://google.com)');
            }
        }
    }

    // 🆕 NIVEAU 2 : Recharger la page
    handleBrowserRefresh() {
        const webview = this.shadowRoot?.querySelector('webview');
        if (webview) {
            console.log('[AskView] Refreshing webview');
            webview.reload();
        }
    }

    // 🆕 NIVEAU 2 : Arrêter le chargement
    handleBrowserStop() {
        const webview = this.shadowRoot?.querySelector('webview');
        if (webview) {
            console.log('[AskView] Stopping webview loading');
            webview.stop();
            this.webviewLoading = false;
            this.requestUpdate();
        }
    }

    // ═══════════════════════════════════════════════════════════
    // 🆕 NIVEAU 3 : HANDLERS POUR FONCTIONNALITÉS AVANCÉES
    // ═══════════════════════════════════════════════════════════

    // 🔧 DEVTOOLS
    handleToggleDevTools() {
        const webview = this.shadowRoot?.querySelector('webview');
        if (webview) {
            if (this.devToolsOpen) {
                console.log('[AskView] Closing DevTools');
                webview.closeDevTools();
                this.devToolsOpen = false;
            } else {
                console.log('[AskView] Opening DevTools');
                webview.openDevTools();
                this.devToolsOpen = true;
            }
            this.requestUpdate();
        }
    }

    // 🔍 ZOOM
    handleZoomIn() {
        const webview = this.shadowRoot?.querySelector('webview');
        if (webview) {
            this.zoomLevel = Math.min(300, this.zoomLevel + 10);
            const zoomFactor = this.zoomLevel / 100;
            webview.setZoomFactor(zoomFactor);
            console.log('[AskView] Zoom in to', this.zoomLevel + '%');
            this.requestUpdate();
        }
    }

    handleZoomOut() {
        const webview = this.shadowRoot?.querySelector('webview');
        if (webview) {
            this.zoomLevel = Math.max(25, this.zoomLevel - 10);
            const zoomFactor = this.zoomLevel / 100;
            webview.setZoomFactor(zoomFactor);
            console.log('[AskView] Zoom out to', this.zoomLevel + '%');
            this.requestUpdate();
        }
    }

    handleZoomReset() {
        const webview = this.shadowRoot?.querySelector('webview');
        if (webview) {
            this.zoomLevel = 100;
            webview.setZoomFactor(1.0);
            console.log('[AskView] Zoom reset to 100%');
            this.requestUpdate();
        }
    }

    // 🔎 FIND IN PAGE
    handleOpenFindInPage() {
        console.log('[AskView] Opening Find in Page');
        this.findInPageOpen = true;
        this.findQuery = '';
        this.findResults = { activeMatchOrdinal: 0, matches: 0 };
        this.requestUpdate();

        // Focus le champ de recherche après render
        this.updateComplete.then(() => {
            const findInput = this.shadowRoot?.querySelector('.find-input');
            if (findInput) {
                findInput.focus();
            }
        });
    }

    handleCloseFindInPage() {
        console.log('[AskView] Closing Find in Page');
        const webview = this.shadowRoot?.querySelector('webview');
        if (webview) {
            webview.stopFindInPage('clearSelection');
        }
        this.findInPageOpen = false;
        this.findQuery = '';
        this.findResults = { activeMatchOrdinal: 0, matches: 0 };
        this.requestUpdate();
    }

    handleFindQueryChange(e) {
        this.findQuery = e.target.value;
        const webview = this.shadowRoot?.querySelector('webview');

        if (webview && this.findQuery) {
            // Lancer la recherche
            this.findRequestId = webview.findInPage(this.findQuery, {
                forward: true,
                findNext: false
            });
            console.log('[AskView] Finding:', this.findQuery);
        } else if (webview) {
            // Si vide, arrêter la recherche
            webview.stopFindInPage('clearSelection');
            this.findResults = { activeMatchOrdinal: 0, matches: 0 };
        }
        this.requestUpdate();
    }

    handleFindNext() {
        const webview = this.shadowRoot?.querySelector('webview');
        if (webview && this.findQuery) {
            this.findRequestId = webview.findInPage(this.findQuery, {
                forward: true,
                findNext: true
            });
            console.log('[AskView] Find next');
        }
    }

    handleFindPrevious() {
        const webview = this.shadowRoot?.querySelector('webview');
        if (webview && this.findQuery) {
            this.findRequestId = webview.findInPage(this.findQuery, {
                forward: false,
                findNext: true
            });
            console.log('[AskView] Find previous');
        }
    }

    // 📥 DOWNLOAD MANAGER
    handleDownloadAccept() {
        if (this.downloadInProgress && this.downloadInProgress.callback) {
            console.log('[AskView] Download accepted:', this.downloadInProgress.filename);
            this.downloadInProgress.callback(true);
            // On garde downloadInProgress pour montrer la progression
        }
    }

    handleDownloadCancel() {
        if (this.downloadInProgress && this.downloadInProgress.callback) {
            console.log('[AskView] Download cancelled');
            this.downloadInProgress.callback(false);
            this.downloadInProgress = null;
            this.requestUpdate();
        }
    }

    handleDownloadComplete() {
        console.log('[AskView] Download complete');
        // Afficher notification de succès pendant 3 secondes
        if (this.downloadInProgress) {
            this.downloadInProgress.status = 'completed';
            this.requestUpdate();
            setTimeout(() => {
                this.downloadInProgress = null;
                this.requestUpdate();
            }, 3000);
        }
    }

    handleDownloadError(errorMessage) {
        console.error('[AskView] Download error:', errorMessage);
        if (this.downloadInProgress) {
            this.downloadInProgress.status = 'error';
            this.downloadInProgress.error = errorMessage;
            this.requestUpdate();
        }
    }

    // ⌨️ RACCOURCIS CLAVIER pour le mode navigateur
    handleBrowserKeydown(e) {
        // Seulement si on est en mode navigateur
        if (!this.browserMode) return;

        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const cmdKey = isMac ? e.metaKey : e.ctrlKey;

        // Cmd+F : Find in Page
        if (cmdKey && e.key === 'f') {
            e.preventDefault();
            if (!this.findInPageOpen) {
                this.handleOpenFindInPage();
            }
            return;
        }

        // Escape : Fermer Find in Page
        if (e.key === 'Escape' && this.findInPageOpen) {
            e.preventDefault();
            this.handleCloseFindInPage();
            return;
        }

        // Cmd+Option+I : Toggle DevTools
        if (cmdKey && e.altKey && e.key === 'i') {
            e.preventDefault();
            this.handleToggleDevTools();
            return;
        }

        // Cmd+Plus ou Cmd+= : Zoom In
        if (cmdKey && (e.key === '+' || e.key === '=')) {
            e.preventDefault();
            this.handleZoomIn();
            return;
        }

        // Cmd+Minus : Zoom Out
        if (cmdKey && (e.key === '-' || e.key === '_')) {
            e.preventDefault();
            this.handleZoomOut();
            return;
        }

        // Cmd+0 : Reset Zoom
        if (cmdKey && e.key === '0') {
            e.preventDefault();
            this.handleZoomReset();
            return;
        }

        // Enter dans Find input : Find Next
        if (e.key === 'Enter' && this.findInPageOpen) {
            e.preventDefault();
            if (e.shiftKey) {
                this.handleFindPrevious();
            } else {
                this.handleFindNext();
            }
            return;
        }
    }

    // ═══════════════════════════════════════════════════════════
    // FIN HANDLERS NIVEAU 3
    // ═══════════════════════════════════════════════════════════

    // 🆕 NIVEAU 1 : Ajouter à l'historique (utilitaire)
    addToHistory(url) {
        if (this.browserHistoryIndex === -1 || url !== this.browserHistory[this.browserHistoryIndex]) {
            // Supprimer tout l'historique après la position actuelle
            this.browserHistory = this.browserHistory.slice(0, this.browserHistoryIndex + 1);
            // Ajouter la nouvelle URL
            this.browserHistory.push(url);
            this.browserHistoryIndex = this.browserHistory.length - 1;
            console.log('[AskView] URL added to history:', url);
        }
    }

    // 🆕 NIVEAU 1 : Setup event listeners sur le webview
    setupWebviewListeners() {
        const webview = this.shadowRoot?.querySelector('webview');
        if (!webview) {
            console.warn('[AskView] Webview not found for listener setup');
            return;
        }

        console.log('[AskView] Setting up webview event listeners');

        // Nettoyer les anciens listeners si ils existent
        this.cleanupWebviewListeners();

        // NIVEAU 1 : Synchronisation URL - Navigation principale
        const didNavigateHandler = (e) => {
            console.log('[AskView] did-navigate:', e.url);
            this.currentUrl = e.url;
            this.urlInputValue = e.url;
            this.browserError = null; // Réinitialiser l'erreur
            this.addToHistory(e.url);
            this.requestUpdate();
        };
        webview.addEventListener('did-navigate', didNavigateHandler);
        this.webviewListeners.push({ event: 'did-navigate', handler: didNavigateHandler });

        // NIVEAU 1 : Navigation dans la page (anchors #)
        const didNavigateInPageHandler = (e) => {
            if (e.isMainFrame) {
                console.log('[AskView] did-navigate-in-page:', e.url);
                this.currentUrl = e.url;
                this.urlInputValue = e.url;
                this.requestUpdate();
            }
        };
        webview.addEventListener('did-navigate-in-page', didNavigateInPageHandler);
        this.webviewListeners.push({ event: 'did-navigate-in-page', handler: didNavigateInPageHandler });

        // NIVEAU 1 : Début du chargement
        const didStartLoadingHandler = () => {
            console.log('[AskView] did-start-loading');
            this.webviewLoading = true;
            this.browserError = null;
            this.requestUpdate();
        };
        webview.addEventListener('did-start-loading', didStartLoadingHandler);
        this.webviewListeners.push({ event: 'did-start-loading', handler: didStartLoadingHandler });

        // NIVEAU 1 : Fin du chargement
        const didStopLoadingHandler = () => {
            console.log('[AskView] did-stop-loading');
            this.webviewLoading = false;
            this.requestUpdate();
        };
        webview.addEventListener('did-stop-loading', didStopLoadingHandler);
        this.webviewListeners.push({ event: 'did-stop-loading', handler: didStopLoadingHandler });

        // NIVEAU 1 : Gestion des erreurs
        const didFailLoadHandler = (e) => {
            // Ignorer les erreurs -3 (abort) qui sont normales lors d'un stop()
            if (e.isMainFrame && e.errorCode !== -3) {
                console.error('[AskView] did-fail-load:', e.errorCode, e.errorDescription);
                this.browserError = {
                    code: e.errorCode,
                    description: e.errorDescription,
                    url: e.validatedURL
                };
                this.webviewLoading = false;
                this.requestUpdate();
            }
        };
        webview.addEventListener('did-fail-load', didFailLoadHandler);
        this.webviewListeners.push({ event: 'did-fail-load', handler: didFailLoadHandler });

        // NIVEAU 2 : Titre de la page
        const pageTitleUpdatedHandler = (e) => {
            console.log('[AskView] page-title-updated:', e.title);
            this.pageTitle = e.title;
            this.requestUpdate();
        };
        webview.addEventListener('page-title-updated', pageTitleUpdatedHandler);
        this.webviewListeners.push({ event: 'page-title-updated', handler: pageTitleUpdatedHandler });

        // 🆕 NIVEAU 3 : Résultats de recherche Find in Page
        const foundInPageHandler = (e) => {
            if (e.result && e.result.requestId === this.findRequestId) {
                console.log('[AskView] found-in-page:', e.result);
                this.findResults = {
                    activeMatchOrdinal: e.result.activeMatchOrdinal,
                    matches: e.result.matches
                };
                this.requestUpdate();
            }
        };
        webview.addEventListener('found-in-page', foundInPageHandler);
        this.webviewListeners.push({ event: 'found-in-page', handler: foundInPageHandler });

        // 🆕 NIVEAU 3 : Favicon de la page
        const pageFaviconUpdatedHandler = (e) => {
            console.log('[AskView] page-favicon-updated:', e.favicons);
            if (e.favicons && e.favicons.length > 0) {
                this.currentFavicon = e.favicons[0];
            } else {
                this.currentFavicon = '';
            }
            this.requestUpdate();
        };
        webview.addEventListener('page-favicon-updated', pageFaviconUpdatedHandler);
        this.webviewListeners.push({ event: 'page-favicon-updated', handler: pageFaviconUpdatedHandler });

        // 🆕 NIVEAU 3 : Sécurité (HTTPS vs HTTP)
        // Déterminer si la page est sécurisée basé sur l'URL
        const didNavigateSecurityHandler = (e) => {
            this.isSecure = e.url.startsWith('https://');
            this.requestUpdate();
        };
        webview.addEventListener('did-navigate', didNavigateSecurityHandler);
        this.webviewListeners.push({ event: 'did-navigate', handler: didNavigateSecurityHandler });

        console.log('[AskView] Webview listeners setup complete (Niveau 1 + 2 + 3)');
    }

    // 🆕 NIVEAU 1 : Nettoyer les event listeners
    cleanupWebviewListeners() {
        const webview = this.shadowRoot?.querySelector('webview');
        if (webview && this.webviewListeners.length > 0) {
            console.log('[AskView] Cleaning up webview listeners');
            this.webviewListeners.forEach(({ event, handler }) => {
                webview.removeEventListener(event, handler);
            });
            this.webviewListeners = [];
        }
    }


    render() {
        // Si on est en mode navigateur, afficher l'interface web
        if (this.browserMode) {
            const canGoBack = this.browserHistoryIndex > 0;
            const canGoForward = this.browserHistoryIndex < this.browserHistory.length - 1;

            return html`
                <div class="ask-container browser-mode">
                    <!-- Barre de navigation style Safari avec contrôles Niveau 3 -->
                    <div class="browser-navigation-bar">
                        <button class="nav-button" ?disabled=${!canGoBack} @click=${this.handleBrowserBack} title="Retour">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M19 12H5M12 19l-7-7 7-7"/>
                            </svg>
                        </button>
                        <button class="nav-button" ?disabled=${!canGoForward} @click=${this.handleBrowserForward} title="Avancer">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                        </button>
                        <!-- 🆕 NIVEAU 2 : Bouton Refresh / Stop (conditionnel) -->
                        ${this.webviewLoading
                            ? html`
                                <button class="nav-button" @click=${this.handleBrowserStop} title="Arrêter">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <rect x="6" y="6" width="12" height="12" rx="1"/>
                                    </svg>
                                </button>
                            `
                            : html`
                                <button class="nav-button" @click=${this.handleBrowserRefresh} title="Recharger">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M23 4v6h-6M1 20v-6h6"/>
                                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                                    </svg>
                                </button>
                            `
                        }

                        <!-- 🆕 NIVEAU 3 : Container URL avec Favicon et Security Indicator -->
                        <div class="url-input-with-icons">
                            <!-- 🆕 NIVEAU 3 : Favicon -->
                            <div class="favicon-container">
                                ${this.currentFavicon
                                    ? html`<img src="${this.currentFavicon}" class="favicon" />`
                                    : html`
                                        <div class="favicon-placeholder">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <circle cx="12" cy="12" r="10"/>
                                            </svg>
                                        </div>
                                    `
                                }
                            </div>

                            <input
                                type="text"
                                class="url-input"
                                .value=${this.urlInputValue || this.currentUrl}
                                @input=${this.handleUrlInput}
                                @keydown=${this.handleUrlKeydown}
                                placeholder="Entrez une URL..."
                                title="Appuyez sur Entrée pour naviguer"
                            />

                            <!-- 🆕 NIVEAU 3 : Security Indicator (HTTPS) -->
                            ${this.currentUrl ? html`
                                <div class="security-indicator ${this.isSecure ? 'secure' : 'insecure'}" title="${this.isSecure ? 'Connexion sécurisée' : 'Connexion non sécurisée'}">
                                    ${this.isSecure
                                        ? html`
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                                            </svg>
                                        `
                                        : html`
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                                <line x1="12" y1="9" x2="12" y2="13"/>
                                                <line x1="12" y1="17" x2="12.01" y2="17"/>
                                            </svg>
                                        `
                                    }
                                </div>
                            ` : ''}
                        </div>

                        <!-- 🆕 NIVEAU 3 : Contrôles Zoom -->
                        <div class="zoom-controls">
                            <button class="nav-button" @click=${this.handleZoomOut} title="Zoom arrière (Cmd -)">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="5" y1="12" x2="19" y2="12"/>
                                </svg>
                            </button>
                            <div class="zoom-level" @click=${this.handleZoomReset} title="Réinitialiser zoom (Cmd 0)">
                                ${this.zoomLevel}%
                            </div>
                            <button class="nav-button" @click=${this.handleZoomIn} title="Zoom avant (Cmd +)">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="12" y1="5" x2="12" y2="19"/>
                                    <line x1="5" y1="12" x2="19" y2="12"/>
                                </svg>
                            </button>
                        </div>

                        <!-- 🆕 NIVEAU 3 : Bouton DevTools -->
                        <button
                            class="nav-button devtools-button ${this.devToolsOpen ? 'active' : ''}"
                            @click=${this.handleToggleDevTools}
                            title="Outils de développement (Cmd+Opt+I)"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="16 18 22 12 16 6"/>
                                <polyline points="8 6 2 12 8 18"/>
                            </svg>
                        </button>

                        <button class="nav-button close-browser-btn" @click=${this.handleCloseBrowser} title="Revenir à la conversation">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    <!-- Contenu web (webview) -->
                    <!-- 🆕 NIVEAU 2 : Ajout partition pour persistance session -->
                    <webview
                        src="${this.currentUrl}"
                        class="browser-webview"
                        partition="persist:lucide-browser"
                        allowpopups
                    ></webview>

                    <!-- 🆕 NIVEAU 1 : Loading indicator -->
                    ${this.webviewLoading && !this.browserError ? html`
                        <div class="loading-indicator">
                            <div class="loading-spinner"></div>
                            <div class="loading-text">Chargement de la page...</div>
                        </div>
                    ` : ''}

                    <!-- 🆕 NIVEAU 1 : Error display -->
                    ${this.browserError ? html`
                        <div class="browser-error">
                            <div class="error-icon">
                                <svg viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                            </div>
                            <div class="error-title">Impossible de charger la page</div>
                            <div class="error-message">${this.browserError.description || 'Une erreur est survenue lors du chargement de la page.'}</div>
                            <div class="error-code">Code d'erreur: ${this.browserError.code}</div>
                            <button class="error-retry-btn" @click=${this.handleBrowserRefresh}>Réessayer</button>
                        </div>
                    ` : ''}

                    <!-- 🆕 NIVEAU 3 : Find in Page Bar -->
                    ${this.findInPageOpen ? html`
                        <div class="find-bar">
                            <input
                                type="text"
                                class="find-input"
                                .value=${this.findQuery}
                                @input=${this.handleFindQueryChange}
                                placeholder="Rechercher dans la page..."
                            />
                            <div class="find-results">
                                ${this.findResults.matches > 0
                                    ? `${this.findResults.activeMatchOrdinal}/${this.findResults.matches}`
                                    : '0/0'
                                }
                            </div>
                            <button class="find-nav-button" @click=${this.handleFindPrevious} title="Précédent">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="15 18 9 12 15 6"/>
                                </svg>
                            </button>
                            <button class="find-nav-button" @click=${this.handleFindNext} title="Suivant">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="9 18 15 12 9 6"/>
                                </svg>
                            </button>
                            <button class="find-close-button" @click=${this.handleCloseFindInPage} title="Fermer">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        </div>
                    ` : ''}

                    <!-- 🆕 NIVEAU 3 : Download Popup -->
                    ${this.downloadInProgress ? html`
                        <div class="download-popup">
                            <div class="download-header">
                                <div class="download-icon">
                                    <svg viewBox="0 0 24 24" fill="none">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                        <polyline points="7 10 12 15 17 10"/>
                                        <line x1="12" y1="15" x2="12" y2="3"/>
                                    </svg>
                                </div>
                                <div class="download-info">
                                    <div class="download-filename">${this.downloadInProgress.filename}</div>
                                    <div class="download-size">${this.downloadInProgress.size || 'Taille inconnue'}</div>
                                </div>
                            </div>

                            ${this.downloadInProgress.status === 'pending' ? html`
                                <div class="download-actions">
                                    <button class="download-btn secondary" @click=${this.handleDownloadCancel}>Annuler</button>
                                    <button class="download-btn primary" @click=${this.handleDownloadAccept}>Télécharger</button>
                                </div>
                            ` : ''}

                            ${this.downloadInProgress.status === 'downloading' ? html`
                                <div class="download-progress">
                                    <div class="download-progress-bar" style="width: ${this.downloadInProgress.progress || 0}%"></div>
                                </div>
                            ` : ''}

                            ${this.downloadInProgress.status === 'completed' ? html`
                                <div class="download-status success">
                                    ✓ Téléchargement terminé
                                </div>
                            ` : ''}

                            ${this.downloadInProgress.status === 'error' ? html`
                                <div class="download-status error">
                                    ✗ ${this.downloadInProgress.error || 'Erreur de téléchargement'}
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            `;
        }

        const hasResponse = this.isLoading || this.currentResponse || this.isStreaming;
        const headerText = this.isLoading ? 'Réflexion...' : 'Réponse IA';

        return html`
            <div class="ask-container">
                <!-- Response Header -->
                <div class="response-header ${!hasResponse ? 'hidden' : ''}">
                    <div class="header-left">
                        <div class="response-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                                <path d="M8 12l2 2 4-4" />
                            </svg>
                        </div>
                        <span class="response-label">${headerText}</span>
                    </div>
                    <div class="header-right">
                        <span class="question-text">${this.getTruncatedQuestion(this.currentQuestion)}</span>
                        <div class="header-controls">
                            <button class="copy-button ${this.copyState === 'copied' ? 'copied' : ''}" @click=${this.handleCopy}>
                                <svg class="copy-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                                </svg>
                                <svg
                                    class="check-icon"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2.5"
                                >
                                    <path d="M20 6L9 17l-5-5" />
                                </svg>
                            </button>
                            <button class="close-button" @click=${this.handleShowListenWindow} title="Retour à la conversation">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                                </svg>
                            </button>
                            <button class="close-button" @click=${this.handleMinimizeAskWindow} title="Masquer">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                            </button>
                            <button class="close-button" @click=${this.handleCloseAskWindow} title="Fermer">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Response Container -->
                <div class="response-container ${!hasResponse ? 'hidden' : ''}" id="responseContainer">
                    <!-- Content is dynamically generated in updateResponseContent() -->
                </div>

                <!-- Quick Actions Panel (Phase 3: Workflows) - DÉSACTIVÉ -->
                <!-- ${!hasResponse ? html`<quick-actions-panel></quick-actions-panel>` : ''} -->

                <!-- Text Input Container -->
                <div class="text-input-container ${!hasResponse ? 'no-response' : ''} ${!this.showTextInput ? 'hidden' : ''}">
                    <input
                        type="text"
                        id="textInput"
                        placeholder="Posez une question sur votre écran ou audio"
                        @keydown=${this.handleTextKeydown}
                        @focus=${this.handleInputFocus}
                    />
                    <button
                        class="submit-btn"
                        @click=${this.handleSendText}
                    >
                        <span class="btn-label">Envoyer</span>
                        <span class="btn-icon">
                            ↵
                        </span>
                    </button>
                </div>
            </div>
        `;
    }

    // Dynamically resize the BrowserWindow to fit current content
    adjustWindowHeight() {
        // 🔧 CORRECTION BUG HAUTEUR BROWSER : Ignorer en mode browser (double protection)
        if (!window.api || this.browserMode) {
            if (this.browserMode) {
                console.log('[AskView] adjustWindowHeight ignored - browser mode active');
            }
            return;
        }

        this.updateComplete.then(() => {
            const headerEl = this.shadowRoot.querySelector('.response-header');
            const responseEl = this.shadowRoot.querySelector('.response-container');
            const inputEl = this.shadowRoot.querySelector('.text-input-container');

            if (!headerEl || !responseEl) return;

            const headerHeight = headerEl.classList.contains('hidden') ? 0 : headerEl.offsetHeight;
            const responseHeight = responseEl.scrollHeight;
            const inputHeight = (inputEl && !inputEl.classList.contains('hidden')) ? inputEl.offsetHeight : 0;

            const idealHeight = headerHeight + responseHeight + inputHeight;

            const targetHeight = Math.min(700, idealHeight);

            window.api.askView.adjustWindowHeight("ask", targetHeight);

        }).catch(err => console.error('AskView adjustWindowHeight error:', err));
    }

    // Throttled wrapper to avoid excessive IPC spam (executes at most once per animation frame)
    adjustWindowHeightThrottled() {
        if (this.isThrottled) return;

        this.isThrottled = true;
        requestAnimationFrame(() => {
            this.adjustWindowHeight();
            this.isThrottled = false;
        });
    }
}

customElements.define('ask-view', AskView);
