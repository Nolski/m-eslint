"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        deprecated: {
            message: "This rule is deprecated; exit only from controlled bootstrap code."
        },
        docs: {
            description: "Deprecated rule (no-process-exit)."
        },
        schema: [],
        messages: {
            noop: "This deprecated rule does not report issues."
        }
    },
    create() {
        return {};
    }
};
