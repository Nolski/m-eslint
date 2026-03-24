"use strict";

/**
 * @returns {{
 *   startRule: (ruleId: string) => void,
 *   endRule: (ruleId: string) => void,
 *   getData: () => Record<string, number>
 * }}
 */
function createTimingData() {
    const active = new Map();
    const totalsMs = new Map();

    return {
        /**
         * @param {string} ruleId
         */
        startRule(ruleId) {
            active.set(ruleId, process.hrtime.bigint());
        },

        /**
         * @param {string} ruleId
         */
        endRule(ruleId) {
            const started = active.get(ruleId);

            if (started === undefined) {
                return;
            }
            active.delete(ruleId);

            const elapsedNs = process.hrtime.bigint() - started;
            const elapsedMs = Number(elapsedNs) / 1e6;
            const prev = totalsMs.get(ruleId) || 0;

            totalsMs.set(ruleId, prev + elapsedMs);
        },

        /**
         * @returns {Record<string, number>}
         */
        getData() {
            const result = {};

            for (const [ruleId, ms] of totalsMs) {
                result[ruleId] = ms;
            }
            return result;
        }
    };
}

module.exports = {
    createTimingData
};
