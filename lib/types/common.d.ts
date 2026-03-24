/**
 * Shared data types for the cleanroom ESLint API.
 */

export type Severity = 0 | 1 | 2;

export interface Position {
    line: number;
    column: number;
}

export interface SourceLocation {
    start: Position;
    end: Position;
}

export interface Fix {
    range: [number, number];
    text: string;
}

export interface Suggestion {
    desc: string;
    fix: Fix;
}

export interface LintMessage {
    ruleId: string | null;
    severity: Severity;
    message: string;
    line: number;
    column: number;
    endLine?: number;
    endColumn?: number;
    fatal?: boolean;
    fix?: Fix;
    suggestions?: Suggestion[];
    messageId?: string;
    nodeType?: string;
}

export interface LintResult {
    filePath: string;
    messages: LintMessage[];
    errorCount: number;
    warningCount: number;
    fixableErrorCount: number;
    fixableWarningCount: number;
    output?: string;
    suppressedMessages?: LintMessage[];
    stats?: { times?: Record<string, number> };
}

export interface Plugin {
    meta?: Record<string, unknown>;
    rules?: Record<string, unknown>;
    processors?: Record<string, Processor>;
    configs?: Record<string, unknown>;
}

export interface Processor {
    preprocess?(text: string, filename: string): string | string[];
    postprocess?(messages: LintMessage[][]): LintMessage[];
    supportsAutofix?: boolean;
}

export interface ESLintOptions {
    allowInlineConfig?: boolean;
    baseConfig?: unknown | unknown[] | null;
    cache?: boolean;
    cacheLocation?: string;
    cacheStrategy?: "metadata" | "content";
    concurrency?: number | "off" | "auto";
    cwd?: string;
    errorOnUnmatchedPattern?: boolean;
    fix?: boolean;
    fixTypes?: string[] | null;
    flags?: string[];
    globInputPaths?: boolean;
    ignore?: boolean;
    ignorePatterns?: string[] | null;
    overrideConfig?: unknown | unknown[] | null;
    overrideConfigFile?: string | false | null;
    passOnNoPatterns?: boolean;
    plugins?: Record<string, Plugin>;
    ruleFilter?: (message: LintMessage) => boolean;
    stats?: boolean;
    warnIgnored?: boolean;
}

export interface LintTextOptions {
    filePath?: string;
    warnIgnored?: boolean;
}

export interface Formatter {
    format(results: LintResult[], data?: Record<string, unknown>): string | Promise<string>;
}
