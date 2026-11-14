"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractDomain = extractDomain;
exports.getDomainAuthorityTier = getDomainAuthorityTier;
exports.computeAuthorityScore = computeAuthorityScore;
/**
 * Deterministic domain authority lookup.
 * No AI involved — fast, predictable, and testable.
 */
const HIGH_AUTHORITY_DOMAINS = new Set([
    // Official docs / language sites
    'react.dev', 'nodejs.org', 'docs.python.org', 'developer.mozilla.org',
    'docs.microsoft.com', 'learn.microsoft.com', 'docs.aws.amazon.com',
    'cloud.google.com', 'docs.github.com', 'kotlinlang.org', 'rust-lang.org',
    // Government & academic
    '.gov', '.edu', '.ac.uk', '.ac.in',
    // Major news / health / science
    'reuters.com', 'bbc.com', 'bbc.co.uk', 'apnews.com', 'nature.com',
    'who.int', 'cdc.gov', 'nih.gov', 'sciencedirect.com', 'pubmed.ncbi.nlm.nih.gov',
    // Tech organisations
    'openai.com', 'anthropic.com', 'deepmind.com', 'arxiv.org',
    'ieee.org', 'acm.org',
    // Financial data
    'sec.gov', 'federalreserve.gov',
]);
const MEDIUM_AUTHORITY_DOMAINS = new Set([
    'medium.com', 'dev.to', 'stackoverflow.com', 'github.com', 'gitlab.com',
    'techcrunch.com', 'theverge.com', 'wired.com', 'arstechnica.com',
    'hackernews.com', 'ycombinator.com', 'towardsdatascience.com',
    'analyticsvidhya.com', 'kaggle.com', 'huggingface.co',
    'zdnet.com', 'venturebeat.com', 'infoq.com',
]);
const LOW_AUTHORITY_DOMAINS = new Set([
    'reddit.com', 'quora.com', 'yahoo.com', 'answers.com',
    'wikianswers.com', 'ehow.com',
]);
/**
 * Extract the apex domain from a URL string.
 * e.g. "https://docs.react.dev/..." → "react.dev"
 */
function extractDomain(url) {
    try {
        const candidate = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
        const hostname = new URL(candidate).hostname.replace(/^www\./, '');
        if (!hostname.includes('.')) {
            return '';
        }
        const parts = hostname.split('.');
        if (parts.length > 2) {
            const secondToLast = parts[parts.length - 2];
            const twoPartTlds = ['co', 'gov', 'edu', 'ac', 'org', 'net', 'com', 'europa'];
            if (twoPartTlds.includes(secondToLast) && parts.length > 3) {
                return parts.slice(-3).join('.');
            }
            return parts.slice(-2).join('.');
        }
        return hostname;
    }
    catch {
        return '';
    }
}
/**
 * Determine the authority tier for a given URL.
 */
function getDomainAuthorityTier(url) {
    const domain = extractDomain(url);
    if (!domain)
        return 'UNKNOWN';
    // Check exact match first
    if (HIGH_AUTHORITY_DOMAINS.has(domain))
        return 'HIGH';
    if (MEDIUM_AUTHORITY_DOMAINS.has(domain))
        return 'MEDIUM';
    if (LOW_AUTHORITY_DOMAINS.has(domain))
        return 'LOW';
    // Check TLD suffixes for .gov and .edu
    if (HIGH_AUTHORITY_DOMAINS.has('.' + domain.split('.').slice(-2).join('.').split('.')[0])) {
        return 'HIGH';
    }
    if (domain.endsWith('.gov') ||
        domain.endsWith('.edu') ||
        domain.endsWith('.ac.uk') ||
        domain.endsWith('europa.eu') ||
        domain === 'who.int') {
        return 'HIGH';
    }
    return 'UNKNOWN';
}
/**
 * Compute a numeric authority score 0–1 combining tier + Tavily relevance score.
 */
function computeAuthorityScore(url, tavilyScore) {
    const tier = getDomainAuthorityTier(url);
    const tierScores = {
        HIGH: 1.0,
        MEDIUM: 0.7,
        LOW: 0.4,
        UNKNOWN: 0.2,
    };
    const tierScore = tierScores[tier];
    // 60% domain tier + 40% Tavily relevance score
    const combined = tierScore * 0.6 + tavilyScore * 0.4;
    return { tier, score: parseFloat(combined.toFixed(3)) };
}
//# sourceMappingURL=domainAuthority.js.map