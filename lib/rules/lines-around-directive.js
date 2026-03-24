"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        deprecated: {
            message: "This rule is deprecated; rely on a formatter for directive spacing."
        },
        docs: {
            description: "Deprecated rule (lines-around-directive)."
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
