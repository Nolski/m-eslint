"use strict";

const readonly = "readonly";
const writable = "writable";

/**
 * @param {Record<string, string>} props
 * @returns {Record<string, "readonly"|"writable">}
 */
function freezeGlobals(props) {
    const out = Object.create(null);

    for (const key of Object.keys(props)) {
        out[key] = props[key];
    }

    return out;
}

const es5 = freezeGlobals({
    Array: readonly,
    Boolean: readonly,
    Date: readonly,
    decodeURI: readonly,
    decodeURIComponent: readonly,
    encodeURI: readonly,
    encodeURIComponent: readonly,
    Error: readonly,
    escape: readonly,
    eval: readonly,
    EvalError: readonly,
    Function: readonly,
    Infinity: readonly,
    isFinite: readonly,
    isNaN: readonly,
    JSON: readonly,
    Math: readonly,
    NaN: readonly,
    Number: readonly,
    Object: readonly,
    parseFloat: readonly,
    parseInt: readonly,
    RangeError: readonly,
    ReferenceError: readonly,
    RegExp: readonly,
    String: readonly,
    SyntaxError: readonly,
    TypeError: readonly,
    undefined: readonly,
    unescape: readonly,
    URIError: readonly
});

const es2015 = freezeGlobals({
    ...es5,
    ArrayBuffer: readonly,
    DataView: readonly,
    Float32Array: readonly,
    Float64Array: readonly,
    Int16Array: readonly,
    Int32Array: readonly,
    Int8Array: readonly,
    Intl: readonly,
    Map: readonly,
    Promise: readonly,
    Proxy: readonly,
    Reflect: readonly,
    Set: readonly,
    Symbol: readonly,
    Uint16Array: readonly,
    Uint32Array: readonly,
    Uint8Array: readonly,
    Uint8ClampedArray: readonly,
    WeakMap: readonly,
    WeakSet: readonly
});

const es2017 = freezeGlobals({
    ...es2015,
    Atomics: readonly,
    SharedArrayBuffer: readonly
});

const es2020 = freezeGlobals({
    ...es2017,
    BigInt: readonly,
    globalThis: readonly
});

const es2021 = freezeGlobals({
    ...es2020,
    AggregateError: readonly,
    FinalizationRegistry: readonly,
    WeakRef: readonly
});

const browser = freezeGlobals({
    ...es2021,
    AbortController: readonly,
    AbortSignal: readonly,
    Blob: readonly,
    CSS: readonly,
    CustomEvent: readonly,
    DOMException: readonly,
    Event: readonly,
    EventTarget: readonly,
    File: readonly,
    FileReader: readonly,
    FormData: readonly,
    Headers: readonly,
    History: readonly,
    Image: readonly,
    Location: readonly,
    MutationObserver: readonly,
    Navigator: readonly,
    Node: readonly,
    NodeFilter: readonly,
    Performance: readonly,
    Request: readonly,
    Response: readonly,
    ServiceWorker: readonly,
    TextDecoder: readonly,
    TextEncoder: readonly,
    URL: readonly,
    URLSearchParams: readonly,
    WebSocket: readonly,
    Worker: readonly,
    XMLHttpRequest: readonly,
    clearInterval: readonly,
    clearTimeout: readonly,
    console: readonly,
    document: readonly,
    fetch: readonly,
    history: readonly,
    localStorage: readonly,
    location: readonly,
    navigator: readonly,
    queueMicrotask: readonly,
    sessionStorage: readonly,
    setInterval: readonly,
    setTimeout: readonly,
    window: readonly
});

const node = freezeGlobals({
    ...es2021,
    Buffer: readonly,
    GLOBAL: readonly,
    TextDecoder: readonly,
    TextEncoder: readonly,
    URL: readonly,
    URLSearchParams: readonly,
    clearImmediate: readonly,
    clearInterval: readonly,
    clearTimeout: readonly,
    console: readonly,
    global: readonly,
    globalThis: readonly,
    process: readonly,
    queueMicrotask: readonly,
    setImmediate: readonly,
    setInterval: readonly,
    setTimeout: readonly
});

const commonjs = freezeGlobals({
    __dirname: readonly,
    __filename: readonly,
    exports: writable,
    module: writable,
    require: readonly
});

module.exports = {
    es5,
    es2015,
    es2017,
    es2020,
    es2021,
    browser,
    node,
    commonjs
};
