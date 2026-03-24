# ESLint (Cleanroom Implementation)

A cleanroom implementation of the ESLint JavaScript linting tool, built entirely from behavioral specifications without referencing the original source code.

## Overview

This is a fully independent implementation of ESLint v10.x that provides:

- **CLI tool** for linting JavaScript files from the command line
- **Programmatic API** with `ESLint`, `Linter`, `SourceCode`, and `RuleTester` classes
- **~276 built-in rules** covering problem detection, code suggestions, and formatting
- **Flat configuration system** using JavaScript/TypeScript config files
- **Auto-fix capability** for rules that support automatic code transformation
- **Plugin system** for third-party rules, processors, parsers, and languages
- **Multiple formatters**: stylish (default), JSON, JSON-with-metadata, HTML
- **File caching** for incremental linting performance
- **Inline configuration** via source code comments (`eslint-disable`, `eslint-enable`, etc.)
- **TypeScript type definitions** for all public APIs

## Installation

```bash
npm install
```

## Quick Start

### CLI Usage

```bash
# Lint files
node bin/eslint.js src/

# Lint with specific rules
node bin/eslint.js --rule 'no-var:error' --rule 'eqeqeq:error' src/

# Auto-fix issues
node bin/eslint.js --fix src/

# Use JSON output
node bin/eslint.js -f json src/
```

### Programmatic API

```javascript
const { ESLint } = require("eslint");

async function lint() {
  const eslint = new ESLint({
    overrideConfig: {
      rules: { "no-var": "error", "eqeqeq": "warn" }
    }
  });

  const results = await eslint.lintText("var x = 1;");
  const formatter = await eslint.loadFormatter("stylish");
  console.log(formatter.format(results));
}

lint();
```

### Using the Linter Directly

```javascript
const { Linter } = require("eslint");

const linter = new Linter();
const messages = linter.verify("var x = 1;", [{
  rules: { "no-var": "error" }
}]);

console.log(messages);
// [{ ruleId: 'no-var', severity: 2, message: "Unexpected 'var'...", line: 1, column: 0 }]
```

## Module Exports

| Export Path | Contents |
|---|---|
| `"eslint"` | `ESLint`, `Linter`, `RuleTester`, `SourceCode`, `loadESLint` |
| `"eslint/config"` | `defineConfig`, `globalIgnores` |
| `"eslint/universal"` | `Linter` (browser-safe, no filesystem) |
| `"eslint/use-at-your-own-risk"` | `builtinRules`, `shouldUseFlatConfig` |
| `"eslint/package.json"` | Package manifest |

## Configuration

Create an `eslint.config.js` file:

```javascript
module.exports = [
  {
    files: ["**/*.js"],
    rules: {
      "no-unused-vars": "warn",
      "no-console": "error",
      "eqeqeq": "error"
    }
  }
];
```

## Testing

```bash
npm test
```

## Architecture

```
bin/           - CLI entry point
conf/          - Configuration constants (globals, ECMAScript versions)
lib/
  api.js       - Main export entry point
  cli.js       - CLI execution logic
  config-api.js - Config helpers (defineConfig, globalIgnores)
  universal.js  - Browser-safe Linter export
  config/      - Configuration system
  eslint/      - ESLint class (high-level API)
  linter/      - Linter class (core engine)
  languages/   - Language support (JavaScript)
  rules/       - ~276 built-in rules
  rule-tester/ - RuleTester class
  shared/      - Shared utilities
  cli-engine/  - Formatters
  types/       - TypeScript type definitions
messages/      - Error message templates
tests/         - Test suite
```

## Cleanroom Implementation

This implementation was created independently based on the ESLint Clean Specification Pack (CSP).
No source code, comments, test cases, or internal implementation details from the original ESLint
repository were referenced during development.

## License

MIT
