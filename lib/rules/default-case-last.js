"use strict";

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Enforce `default` clauses in switch statements to appear last."
        },
        schema: [],
        messages: {
            notLast: "`default` should be the final switch clause."
        }
    },
    create(context) {
        return {
            SwitchStatement(node) {
                let seenDefault = false;

                for (const clause of node.cases) {
                    if (clause.test === null) {
                        seenDefault = true;
                    } else if (seenDefault) {
                        context.report({ node: clause, messageId: "notLast" });
                        return;
                    }
                }
            }
        };
    }
};
