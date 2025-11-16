/**
 * Token Estimation Utilities
 *
 * Common functions for estimating token counts in text.
 */

/**
 * Estimate token count for text
 * Uses a rough heuristic: ~4 characters per token (GPT models)
 *
 * @param {string} text - Text to estimate
 * @returns {number} Estimated token count
 */
function estimateTokens(text) {
    if (!text || typeof text !== 'string') {
        return 0;
    }
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
}

/**
 * Estimate token count for multiple texts
 *
 * @param {Array<string>} texts - Array of texts
 * @returns {number} Total estimated token count
 */
function estimateTokensForArray(texts) {
    if (!Array.isArray(texts)) {
        return 0;
    }
    return texts.reduce((sum, text) => sum + estimateTokens(text), 0);
}

/**
 * Check if text exceeds token limit
 *
 * @param {string} text - Text to check
 * @param {number} limit - Token limit
 * @returns {boolean} True if text exceeds limit
 */
function exceedsTokenLimit(text, limit) {
    return estimateTokens(text) > limit;
}

/**
 * Truncate text to fit within token limit
 *
 * @param {string} text - Text to truncate
 * @param {number} limit - Token limit
 * @returns {string} Truncated text
 */
function truncateToTokenLimit(text, limit) {
    const estimatedTokens = estimateTokens(text);

    if (estimatedTokens <= limit) {
        return text;
    }

    // Approximate character count for limit
    const targetChars = limit * 4;
    return text.substring(0, targetChars) + '...';
}

module.exports = {
    estimateTokens,
    estimateTokensForArray,
    exceedsTokenLimit,
    truncateToTokenLimit
};
