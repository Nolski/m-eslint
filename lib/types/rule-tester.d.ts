import type { RuleModule } from "./rule";

export interface RuleTesterTestCaseValid {
    code: string;
    [key: string]: unknown;
}

export interface RuleTesterTestCaseInvalid {
    code: string;
    errors?: unknown[] | number;
    output?: string | null;
    [key: string]: unknown;
}

export interface RuleTesterTest {
    valid: Array<string | RuleTesterTestCaseValid>;
    invalid: RuleTesterTestCaseInvalid[];
}

export class RuleTester {
    static describe: (title: string, fn: () => void) => void;
    static it: ((title: string, fn: () => void) => void) & { only?: (title: string, fn: () => void) => void };
    static itOnly: (title: string, fn: () => void) => void;
    static setDefaultConfig(config: unknown | unknown[]): void;
    static getDefaultConfig(): unknown | unknown[];
    static resetDefaultConfig(): void;

    defaultConfig: unknown | unknown[];

    constructor(config?: unknown | unknown[]);

    run(ruleName: string, rule: RuleModule, test: RuleTesterTest): void;
}
