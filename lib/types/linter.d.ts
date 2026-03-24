import type { LintMessage } from "./common";
import type { SourceCode } from "./source-code";

export interface LinterOptions {
    cwd?: string;
    configType?: string;
    flags?: Record<string, boolean> | Set<string>;
}

export interface VerifyOptions {
    filename?: string;
    physicalFilename?: string;
}

export interface VerifyAndFixResult {
    fixed: boolean;
    messages: LintMessage[];
    output: string;
}

export class Linter {
    static version: string;

    cwd: string;
    configType: string;
    flags: Record<string, boolean> | Set<string>;

    constructor(options?: LinterOptions);

    hasFlag(flag: string): boolean;

    verify(
        textOrSourceCode: string | SourceCode,
        config: unknown | unknown[],
        filenameOrOptions?: string | VerifyOptions
    ): LintMessage[];

    verifyAndFix(
        text: string,
        config: unknown | unknown[],
        options?: VerifyOptions
    ): VerifyAndFixResult;

    getSourceCode(): SourceCode | null;
    getTimes(): Record<string, number> | null;
    getFixPassCount(): number;
    getSuppressedMessages(): LintMessage[];
}
