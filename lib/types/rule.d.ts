import type { Fix, LintMessage, Suggestion } from "./common";

export interface RuleFixer {
    insertTextBefore(nodeOrToken: { range: [number, number] }, text: string): Fix;
    insertTextAfter(nodeOrToken: { range: [number, number] }, text: string): Fix;
    insertTextBeforeRange(range: [number, number], text: string): Fix;
    insertTextAfterRange(range: [number, number], text: string): Fix;
    remove(nodeOrToken: { range: [number, number] }): Fix;
    removeRange(range: [number, number]): Fix;
    replaceText(nodeOrToken: { range: [number, number] }, text: string): Fix;
    replaceTextRange(range: [number, number], text: string): Fix;
}

export interface ReportDescriptor {
    node?: unknown;
    loc?: unknown;
    message?: string;
    messageId?: string;
    data?: Record<string, unknown>;
    fix?: Fix | ((fixer: RuleFixer) => Fix | Fix[] | Iterable<Fix> | null | undefined);
    suggest?: ReadonlyArray<{
        desc: string;
        fix: (fixer: RuleFixer) => Fix | null | undefined;
    }>;
}

export interface RuleContext {
    id: string;
    options: unknown[];
    sourceCode: import("./source-code").SourceCode;
    cwd: string;
    filename: string;
    physicalFilename: string;
    languageOptions: Record<string, unknown>;
    settings: Record<string, unknown>;
    report(descriptor: ReportDescriptor): void;
}

export type RuleListener = Record<string, ((node: unknown) => void) | undefined>;

export interface RuleMeta {
    type?: "problem" | "suggestion" | "layout";
    docs?: {
        description?: string;
        url?: string;
        recommended?: boolean | string;
        [key: string]: unknown;
    };
    fixable?: "code" | "whitespace" | string;
    hasSuggestions?: boolean;
    schema?: unknown[] | false | null;
    defaultOptions?: unknown[];
    messages?: Record<string, string>;
    deprecated?: boolean;
    replacedBy?: string[];
    [key: string]: unknown;
}

export interface RuleModule {
    meta?: RuleMeta;
    create(context: RuleContext): RuleListener;
}

export namespace Rule {
    export type { RuleFixer, RuleContext, RuleListener, RuleMeta, RuleModule, ReportDescriptor };
}
