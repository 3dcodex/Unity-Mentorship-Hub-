const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '..', 'functions', 'index.js');

if (!fs.existsSync(targetFile)) {
    console.error(`[guard:functions] Target file not found: ${targetFile}`);
    process.exit(1);
}

const source = fs.readFileSync(targetFile, 'utf8');
const brokenOptionalChainPattern = /\?\s+\./g;
const brokenNullishPattern = /\?\s+\?/g;
const optionalMatches = source.match(brokenOptionalChainPattern) || [];
const nullishMatches = source.match(brokenNullishPattern) || [];

if (optionalMatches.length > 0 || nullishMatches.length > 0) {
    if (optionalMatches.length > 0) {
        console.error(`[guard:functions] Found ${optionalMatches.length} broken optional-chaining token(s) in functions/index.js ("? .").`);
    }
    if (nullishMatches.length > 0) {
        console.error(`[guard:functions] Found ${nullishMatches.length} broken nullish-coalescing token(s) in functions/index.js ("? ?").`);
    }
    console.error('[guard:functions] Deployment blocked. Fix to "?." and/or "??" and retry.');
    process.exit(1);
}

console.log('[guard:functions] Token spacing guard passed.');