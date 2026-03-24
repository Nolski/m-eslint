"use strict";

module.exports = {
    meta: {
        type: "layout",
        deprecated: {
            message: "Formatting rules are deprecated. Use a dedicated formatter."
        },
        docs: {
            description: "Deprecated layout rule (lines-between-class-members)."
        },
        schema: [],
        messages: {
            noop: "Layout checks are disabled for deprecated formatting rules."
        }
    },
    create() {
        return {};
    }
};
