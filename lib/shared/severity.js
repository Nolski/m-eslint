"use strict";

const SEVERITY_OFF = 0;
const SEVERITY_WARN = 1;
const SEVERITY_ERROR = 2;

/**
 * @param {unknown} val
 * @returns {boolean}
 */
function isSeverity(val) {
    return val === SEVERITY_OFF || val === SEVERITY_WARN || val === SEVERITY_ERROR;
}

/**
 * @param {unknown} input
 * @returns {0|1|2}
 */
function normalizeSeverity(input) {
    if (typeof input === "number" && isSeverity(input)) {
        return input;
    }
    if (typeof input === "string") {
        switch (input) {
            case "off":
                return SEVERITY_OFF;
            case "warn":
                return SEVERITY_WARN;
            case "error":
                return SEVERITY_ERROR;
            default:
                break;
        }
    }
    return SEVERITY_OFF;
}

module.exports = {
    SEVERITY_OFF,
    SEVERITY_WARN,
    SEVERITY_ERROR,
    isSeverity,
    normalizeSeverity
};
