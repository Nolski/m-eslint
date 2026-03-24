#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
NATIVE_DIR="$ROOT_DIR/native"

echo "Building native Rust addon..."

cd "$NATIVE_DIR"
cargo build --release

TARGET_DIR="$NATIVE_DIR/target/release"

# Detect platform and copy the appropriate library
case "$(uname -s)-$(uname -m)" in
    Linux-x86_64)
        cp "$TARGET_DIR/libeslint_native.so" "$NATIVE_DIR/eslint-native.linux-x64-gnu.node"
        echo "Built: eslint-native.linux-x64-gnu.node"
        ;;
    Linux-aarch64)
        cp "$TARGET_DIR/libeslint_native.so" "$NATIVE_DIR/eslint-native.linux-arm64-gnu.node"
        echo "Built: eslint-native.linux-arm64-gnu.node"
        ;;
    Darwin-x86_64)
        cp "$TARGET_DIR/libeslint_native.dylib" "$NATIVE_DIR/eslint-native.darwin-x64.node"
        echo "Built: eslint-native.darwin-x64.node"
        ;;
    Darwin-arm64)
        cp "$TARGET_DIR/libeslint_native.dylib" "$NATIVE_DIR/eslint-native.darwin-arm64.node"
        echo "Built: eslint-native.darwin-arm64.node"
        ;;
    *)
        echo "Warning: Unsupported platform $(uname -s)-$(uname -m)"
        echo "Copying as generic .node file..."
        if [ -f "$TARGET_DIR/libeslint_native.so" ]; then
            cp "$TARGET_DIR/libeslint_native.so" "$NATIVE_DIR/eslint-native.linux-x64-gnu.node"
        elif [ -f "$TARGET_DIR/libeslint_native.dylib" ]; then
            cp "$TARGET_DIR/libeslint_native.dylib" "$NATIVE_DIR/eslint-native.darwin-x64.node"
        fi
        ;;
esac

echo "Native build complete."
