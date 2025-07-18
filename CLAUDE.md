# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

- `npm run build` - Build the library using Rollup (outputs to `dist/`)
- `npm test` - Run Jest tests
- `npm run lint` - Run ESLint on source files
- `npm run prepublishOnly` - Build before publishing (runs automatically)

## Architecture Overview

React Pouch is a lightweight, plugin-based state management library for React and React Native with the following key architectural patterns:

### Core Architecture

- **Factory Pattern**: `pouch()` function creates pouch instances with optional plugins
- **Observer Pattern**: Pouches maintain listener sets for state change notifications
- **Plugin System**: Three-phase lifecycle (initialize, setup, onSet) allows extensible functionality
- **Type-Safe**: Full TypeScript support with generic `Pouch<T>` interface

### Project Structure

- `src/core/` - Main pouch implementation and type definitions
- `src/plugins/` - 13 built-in plugins (analytics, computed, debounce, encrypt, history, logger, middleware, persist, rnPersist, schema, sync, throttle, validate)
- `src/index.ts` - Public API exports

### Plugin Development Pattern

Plugins implement the `PluginHooks<T>` interface with three optional methods:

- `initialize(value: T): T` - Transform initial value during pouch creation
- `setup(pouch: Pouch<T>): void` - Augment pouch with additional methods/properties
- `onSet(newValue: T, oldValue: T): T | void` - Transform values on every update

### Key Implementation Details

- Pouch interface includes `[key: string]: any` to support plugin extensions
- Plugins execute in order and can chain transformations
- React and React Native integration via built-in `use()` method on pouch instances
- Synchronous listener notifications with automatic cleanup
- Error handling delegated to individual plugins

### Development Patterns

- Core pouch (~89 lines) focuses on essential state management
- Plugin system provides unlimited extensibility without core changes
- Type safety maintained throughout plugin lifecycle
- Immutable updates with functional update support via callbacks
- Performance-focused with minimal overhead for basic usage

### Testing and Build

- Jest for testing framework
- Rollup builds multiple formats (CJS, ESM) with TypeScript declarations
- ESLint for code quality with React-specific rules
- React 16.8+ peer dependency requirement (React Native supported)
