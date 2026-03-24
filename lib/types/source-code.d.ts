export interface SourceCodeConstructorOptions {
    text: string;
    ast: unknown;
    hasBOM?: boolean;
    parserServices?: Record<string, unknown>;
    scopeManager?: unknown;
    visitorKeys?: Record<string, readonly string[]>;
}

export interface TokenStoreOptions {
    includeComments?: boolean;
    filter?: (token: unknown) => boolean;
}

export class SourceCode {
    text: string;
    ast: unknown;
    hasBOM: boolean;
    parserServices: Record<string, unknown>;
    scopeManager: unknown;
    visitorKeys: Record<string, readonly string[]> | null;
    lines: string[];
    tokens: unknown[];
    comments: unknown[];
    tokenStore: unknown;

    constructor(textOrConfig: string | SourceCodeConstructorOptions, ast?: unknown);

    static splitLines(text: string): string[];

    getText(node?: unknown, beforeCount?: number, afterCount?: number): string;
    getLines(): string[];
    getLoc(nodeOrToken: { range?: [number, number]; loc?: unknown }): unknown;
    getRange(nodeOrToken: { range?: [number, number] }): [number, number] | null;
    getLocFromIndex(index: number): { line: number; column: number };
    getIndexFromLoc(loc: { line: number; column: number }): number;

    getFirstToken(node: unknown, options?: TokenStoreOptions): unknown;
    getLastToken(node: unknown, options?: TokenStoreOptions): unknown;
    getTokenBefore(nodeOrToken: unknown, options?: TokenStoreOptions): unknown;
    getTokenAfter(nodeOrToken: unknown, options?: TokenStoreOptions): unknown;
    getTokensBetween(left: unknown, right: unknown, options?: TokenStoreOptions): unknown[];
    getTokens(node: unknown, options?: TokenStoreOptions): unknown[];
    getTokenByRangeStart(offset: number, options?: TokenStoreOptions): unknown;
    getFirstTokenBetween(left: unknown, right: unknown, options?: TokenStoreOptions): unknown;
    getLastTokenBetween(left: unknown, right: unknown, options?: TokenStoreOptions): unknown;

    getAllComments(): unknown[];
    getCommentsBefore(nodeOrToken: { range?: [number, number] }): unknown[];
    getCommentsAfter(nodeOrToken: { range?: [number, number] }): unknown[];
    getCommentsInside(node: { range?: [number, number] }): unknown[];
    commentsExistBetween(left: { range?: [number, number] }, right: { range?: [number, number] }): boolean;

    getAncestors(node: unknown): unknown[];
    getDeclaredVariables(node: unknown): unknown[];
    getNodeByRangeIndex(index: number): unknown;
    getScope(node: unknown): unknown;
    isGlobalReference(node: unknown): boolean;
    markVariableAsUsed(name: string, refNode: unknown): boolean;
    isSpaceBetween(first: unknown, second: unknown): boolean;

    traverse(
        root?: unknown
    ): IterableIterator<{ node: unknown; parent: unknown | null; phase: number }>;
}
