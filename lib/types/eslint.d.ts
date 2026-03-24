import type {
    ESLintOptions,
    Formatter,
    LintResult,
    LintTextOptions
} from "./common";

export class ESLint {
    static version: string;
    static configType: "flat";
    static defaultConfig: unknown[];

    static outputFixes(results: LintResult[]): Promise<void>;
    static getErrorResults(results: LintResult[]): LintResult[];
    static fromOptionsModule(moduleUrl: string): Promise<ESLint>;

    allowInlineConfig: boolean;
    baseConfig: unknown | unknown[] | null;
    cache: boolean;
    cacheLocation: string;
    cacheStrategy: "metadata" | "content";
    concurrency: number | "off" | "auto";
    cwd: string;
    errorOnUnmatchedPattern: boolean;
    fix: boolean;
    fixTypes: string[] | null;
    flags: string[];
    globInputPaths: boolean;
    ignore: boolean;
    ignorePatterns: string[] | null;
    overrideConfig: unknown | unknown[] | null;
    overrideConfigFile: string | false | null;
    passOnNoPatterns: boolean;
    plugins: Record<string, unknown>;
    ruleFilter: (message: import("./common").LintMessage) => boolean;
    stats: boolean;
    warnIgnored: boolean;

    constructor(options?: ESLintOptions);

    hasFlag(flag: string): boolean;
    calculateConfigForFile(filePath: string): Promise<unknown>;
    findConfigFile(filePath?: string): Promise<string | null>;
    isPathIgnored(filePath: string): Promise<boolean>;
    getRulesMetaForResults(results: LintResult[]): Record<string, unknown>;
    loadFormatter(name?: string): Promise<Formatter>;
    lintText(code: string, options?: LintTextOptions): Promise<LintResult[]>;
    lintFiles(patterns: string[]): Promise<LintResult[]>;
}
