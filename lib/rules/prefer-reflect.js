"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        deprecated: {
            message: "This rule is deprecated; prefer direct Reflect usage where it clarifies intent."
        },
        docs: {
            description: "Deprecated rule (prefer-reflect)."
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
