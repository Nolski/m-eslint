"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        deprecated: {
            message: "This rule is deprecated; handle errors explicitly where needed."
        },
        docs: {
            description: "Deprecated rule (handle-callback-err)."
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
