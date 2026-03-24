# ESLint Native Performance Module

Rust-based native N-API addon that accelerates performance-critical internals of the ESLint implementation.

## What's Accelerated

This module provides Rust implementations for the following performance-critical functions identified in `performance-audit.md`:

| Function | Finding | Severity | Description |
|----------|---------|----------|-------------|
| `computeLineDepths(text)` | #2 | CRITICAL | O(n) single-pass paren/bracket/brace depth computation per line, replacing the O(n²) `parenDepthBefore()` in the indent rule |
| `globMatchPattern(path, pattern)` | #6 | HIGH | Fast glob pattern matching replacing minimatch in config file matching |
| `batchGlobMatch(path, patterns)` | #6 | HIGH | Batch glob matching for multiple patterns against a single path |
| `getMatchingConfigIndices(path, filePatterns, ignorePatterns, isGlobalIgnores)` | #6 | HIGH | Batch config-to-file matching with pre-compiled patterns, replacing per-file minimatch calls |

## Prerequisites

- **Rust toolchain**: Install via [rustup](https://rustup.rs/) (stable channel, 1.70+)
- **Node.js**: ^20.19.0 || ^22.13.0 || >=24

## Building

From the repository root:

```bash
npm run build:native
```

Or manually:

```bash
cd native
cargo build --release
# Copy the built library to a .node file
cp target/release/libeslint_native.so eslint-native.linux-x64-gnu.node  # Linux x64
cp target/release/libeslint_native.dylib eslint-native.darwin-arm64.node  # macOS ARM
```

## Architecture

- `src/lib.rs` — Rust implementation with napi-rs bindings
- `Cargo.toml` — Rust dependencies (napi-rs, glob-match)
- `build.rs` — napi-rs build configuration
- `*.node` — Compiled platform-specific native addon (git-tracked for CI convenience)

The JavaScript binding layer at `lib/native-binding.js` automatically loads the native addon for the current platform and falls back to pure JavaScript implementations if the native addon is unavailable.

## Fallback Behavior

If the native module cannot be loaded (missing binary, unsupported platform, etc.), all functions gracefully fall back to equivalent JavaScript implementations. The package remains fully functional without Rust — native code is purely a performance optimization.

## Running Tests

Rust unit tests:

```bash
cd native
cargo test
```

JavaScript integration tests (from repo root):

```bash
npm test
```
