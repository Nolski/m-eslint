#[macro_use]
extern crate napi_derive;

/// Compute paren/bracket/brace nesting depth at the start of each line in O(n).
///
/// Returns a Vec<i32> of length = number of lines, where result[i] is the
/// depth at the start of line i+1 (1-indexed lines, 0-indexed array).
/// This replaces the O(n²) parenDepthBefore() in the indent rule.
#[napi]
pub fn compute_line_depths(text: String) -> Vec<i32> {
    let bytes = text.as_bytes();
    let len = bytes.len();

    // First pass: count lines
    let mut line_count: usize = 1;
    let mut i = 0;
    while i < len {
        match bytes[i] {
            b'\n' => line_count += 1,
            b'\r' => {
                line_count += 1;
                if i + 1 < len && bytes[i + 1] == b'\n' {
                    i += 1;
                }
            }
            _ => {}
        }
        i += 1;
    }

    let mut depths = Vec::with_capacity(line_count);
    let mut depth: i32 = 0;
    depths.push(0); // depth at start of line 1 is always 0

    i = 0;
    while i < len {
        let c = bytes[i];
        match c {
            b'{' | b'[' | b'(' => {
                depth += 1;
            }
            b'}' | b']' | b')' => {
                if depth > 0 {
                    depth -= 1;
                }
            }
            b'\n' => {
                depths.push(depth);
            }
            b'\r' => {
                if i + 1 < len && bytes[i + 1] == b'\n' {
                    i += 1;
                }
                depths.push(depth);
            }
            _ => {}
        }
        i += 1;
    }

    depths
}

/// Fast glob pattern matching using the glob-match crate.
///
/// Tests whether `path` matches the given glob `pattern`.
/// Replaces minimatch for the hot path in FlatConfigArray.getConfigForFile().
#[napi]
pub fn glob_match_pattern(path: String, pattern: String) -> bool {
    glob_match::glob_match(&pattern, &path)
}

/// Batch glob matching: test a single path against multiple patterns.
///
/// Returns a Vec<bool> where result[i] indicates whether the path matches
/// patterns[i]. Much faster than calling minimatch N times from JS.
#[napi]
pub fn batch_glob_match(path: String, patterns: Vec<String>) -> Vec<bool> {
    patterns
        .iter()
        .map(|p| glob_match::glob_match(p, &path))
        .collect()
}

/// Compute matching config indices for a file path.
///
/// Given a file path and arrays of file-patterns and ignore-patterns for each
/// config entry, returns the indices of configs that match (files match AND
/// ignores don't exclude). This moves the hot matching loop out of JS.
///
/// - `file_path`: The normalized posix path of the file
/// - `config_file_patterns`: For each config, an array of file glob patterns (empty = matches all)
/// - `config_ignore_patterns`: For each config, an array of ignore glob patterns (empty = no ignores)
/// - `is_global_ignores`: For each config, whether it's a global-ignores-only entry
///
/// Returns the indices of matching non-global-ignore configs.
#[napi]
pub fn get_matching_config_indices(
    file_path: String,
    config_file_patterns: Vec<Vec<String>>,
    config_ignore_patterns: Vec<Vec<String>>,
    is_global_ignores: Vec<bool>,
) -> Vec<u32> {
    let n = config_file_patterns.len();
    let mut result = Vec::new();

    for i in 0..n {
        if is_global_ignores[i] {
            continue;
        }

        // Check files match (empty = matches all)
        let files = &config_file_patterns[i];
        if !files.is_empty() {
            let any_match = files.iter().any(|p| glob_match::glob_match(p, &file_path));
            if !any_match {
                continue;
            }
        }

        // Check ignores exclude
        let ignores = &config_ignore_patterns[i];
        if !ignores.is_empty() {
            let any_ignore = ignores.iter().any(|p| glob_match::glob_match(p, &file_path));
            if any_ignore {
                continue;
            }
        }

        result.push(i as u32);
    }

    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compute_line_depths_simple() {
        let text = "function foo() {\n  bar();\n}".to_string();
        let depths = compute_line_depths(text);
        assert_eq!(depths, vec![0, 1, 1]);
    }

    #[test]
    fn test_compute_line_depths_nested() {
        // if (a) {     → depth changes: ( +1 ) -1 { +1 → net depth 1
        //   if (b) {   → ( +1 ) -1 { +1 → net depth 2
        //     x;       → no change
        //   }          → } -1 → depth 1
        // }            → } -1 → depth 0
        let text = "if (a) {\n  if (b) {\n    x;\n  }\n}".to_string();
        let depths = compute_line_depths(text);
        assert_eq!(depths, vec![0, 1, 2, 2, 1]);
    }

    #[test]
    fn test_compute_line_depths_empty() {
        let depths = compute_line_depths("".to_string());
        assert_eq!(depths, vec![0]);
    }

    #[test]
    fn test_compute_line_depths_single_line() {
        let depths = compute_line_depths("hello".to_string());
        assert_eq!(depths, vec![0]);
    }

    #[test]
    fn test_compute_line_depths_crlf() {
        let text = "{\r\n  x;\r\n}".to_string();
        let depths = compute_line_depths(text);
        assert_eq!(depths, vec![0, 1, 1]);
    }

    #[test]
    fn test_glob_match_basic() {
        assert!(glob_match_pattern("src/foo.js".to_string(), "**/*.js".to_string()));
        assert!(!glob_match_pattern("src/foo.ts".to_string(), "**/*.js".to_string()));
    }

    #[test]
    fn test_batch_glob_match() {
        let results = batch_glob_match(
            "src/foo.js".to_string(),
            vec!["**/*.js".to_string(), "**/*.ts".to_string(), "src/**".to_string()],
        );
        assert_eq!(results, vec![true, false, true]);
    }

    #[test]
    fn test_get_matching_config_indices() {
        let indices = get_matching_config_indices(
            "src/foo.js".to_string(),
            vec![
                vec!["**/*.js".to_string()],
                vec!["**/*.ts".to_string()],
                vec![],
            ],
            vec![vec![], vec![], vec![]],
            vec![false, false, false],
        );
        assert_eq!(indices, vec![0, 2]);
    }
}
