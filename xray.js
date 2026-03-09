/**
 * ── Dependency X-Ray Generator ──
 * 
 * Reads dependency-graph.json (from dpdm) and auto-injects the rawTree 
 * into dependency-graph-interactive.html so you never edit it manually.
 * 
 * Usage:
 *   1. npx dpdm ./UI/src/main.tsx ./"Query Service"/index.js ./"Alert Service"/index.js -o dependency-graph.json --transform json
 *   2. node xray.js
 *   3. Open dependency-graph-interactive.html
 */

const fs = require('fs');
const path = require('path');

const JSON_FILE = path.join(__dirname, 'dependency-graph.json');
const HTML_FILE = path.join(__dirname, 'dependency-graph-interactive.html');

// ── Read & parse dpdm output ──
if (!fs.existsSync(JSON_FILE)) {
    console.error('❌ dependency-graph.json not found. Run this first:');
    console.error('   npx dpdm ./UI/src/main.tsx ./"Query Service"/index.js ./"Alert Service"/index.js -o dependency-graph.json --transform json');
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
const tree = data.tree || {};

// ── Build clean rawTree (only YOUR code files, skip node_modules) ──
const rawTree = {};

Object.entries(tree).forEach(([file, deps]) => {
    // Skip node_modules files
    if (file.includes('node_modules')) return;

    const targets = [];
    if (Array.isArray(deps)) {
        deps.forEach(dep => {
            if (dep.id && !dep.id.includes('node_modules')) {
                targets.push(dep.id.replace(/\\\\/g, '/').replace(/\\/g, '/'));
            }
        });
    }

    rawTree[file.replace(/\\\\/g, '/').replace(/\\/g, '/')] = targets;
});

console.log(`✅ Found ${Object.keys(rawTree).length} code files (node_modules excluded)`);

// ── Inject into HTML ──
if (!fs.existsSync(HTML_FILE)) {
    console.error('❌ dependency-graph-interactive.html not found in project root.');
    process.exit(1);
}

let html = fs.readFileSync(HTML_FILE, 'utf8');

// Replace the rawTree object between the markers
const rawTreeStr = JSON.stringify(rawTree, null, 12);
const regex = /const rawTree = \{[\s\S]*?\};/;

if (!regex.test(html)) {
    console.error('❌ Could not find rawTree placeholder in HTML file.');
    process.exit(1);
}

html = html.replace(regex, `const rawTree = ${rawTreeStr};`);
fs.writeFileSync(HTML_FILE, html, 'utf8');

console.log('✅ dependency-graph-interactive.html updated!');
console.log('🚀 Open it in your browser to view the graph.');
