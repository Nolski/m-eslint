"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        deprecated: {
            message: "This rule is deprecated; avoid deprecated Buffer APIs in application code."
        },
        docs: {
            description: "Deprecated rule (no-buffer-constructor)."
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
