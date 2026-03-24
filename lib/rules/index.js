"use strict";

const fs = require("node:fs");
const path = require("node:path");

const rulesDirectory = path.resolve(__dirname);
const ruleCache = Object.create(null);
let loaded = false;

function loadAllRules() {
    if (loaded) {
        return;
    }
    loaded = true;
    const entries = fs.readdirSync(rulesDirectory);
    for (const entry of entries) {
        if (!entry.endsWith(".js") || entry === "index.js" || entry === "scope-analyze.js") {
            continue;
        }
        const ruleName = entry.slice(0, -3);
        if (!ruleCache[ruleName]) {
            Object.defineProperty(ruleCache, ruleName, {
                configurable: true,
                enumerable: true,
                get() {
                    const mod = require(path.join(rulesDirectory, entry));
                    Object.defineProperty(ruleCache, ruleName, {
                        configurable: true,
                        enumerable: true,
                        value: mod,
                        writable: false
                    });
                    return mod;
                }
            });
        }
    }
}

loadAllRules();

module.exports = ruleCache;
