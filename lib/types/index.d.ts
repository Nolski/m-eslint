import { ESLint } from "./eslint";
import { Linter } from "./linter";
import { SourceCode } from "./source-code";
import { RuleTester } from "./rule-tester";
import { Rule } from "./rule";

export { ESLint, Linter, SourceCode, RuleTester, Rule };

export function loadESLint(options?: { useFlatConfig?: boolean }): Promise<typeof ESLint>;

export type {
    ESLintOptions,
    Fix,
    Formatter,
    LintMessage,
    LintResult,
    LintTextOptions,
    Plugin,
    Position,
    Processor,
    Severity,
    SourceLocation,
    Suggestion
} from "./common";

export type {
    ReportDescriptor,
    RuleContext,
    RuleFixer,
    RuleListener,
    RuleMeta,
    RuleModule
} from "./rule";

export type {
    LinterOptions,
    VerifyAndFixResult,
    VerifyOptions
} from "./linter";

export type { SourceCodeConstructorOptions, TokenStoreOptions } from "./source-code";

export type {
    RuleTesterTest,
    RuleTesterTestCaseInvalid,
    RuleTesterTestCaseValid
} from "./rule-tester";
