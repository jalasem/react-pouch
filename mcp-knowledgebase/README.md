# React Pouch MCP Knowledgebase

This is a comprehensive Model Context Protocol (MCP) knowledgebase for React Pouch - a lightweight, plugin-based state management library for React and React Native.

## Structure

```
mcp-knowledgebase/
├── mcp.json                    # Main MCP configuration
├── README.md                   # This file
├── api/                        # Core API documentation
│   └── core-api.md            # Main API reference
├── plugins/                    # Plugin documentation
│   ├── analytics.md           # Google Analytics integration
│   ├── computed.md            # Derived state values
│   ├── debounce.md            # Debounced updates
│   ├── encrypt.md             # State encryption
│   ├── history.md             # Undo/redo functionality
│   ├── logger.md              # Debug logging
│   ├── middleware.md          # Custom middleware
│   ├── persist.md             # Browser storage persistence
│   ├── rnPersist.md           # React Native AsyncStorage
│   ├── schema.md              # Runtime type validation
│   ├── sync.md                # Server synchronization
│   ├── throttle.md            # Throttled updates
│   └── validate.md            # Custom validation
├── examples/                   # Usage examples and patterns
│   ├── getting-started.md     # Basic usage guide
│   ├── advanced-patterns.md   # Complex implementations
│   └── common-use-cases.md    # Real-world examples
└── types/                      # TypeScript reference
    └── typescript-reference.md # Complete type definitions
```

## Quick Reference

### Core Concepts

- **Pouches**: Lightweight state containers with observer pattern
- **Plugins**: Extensible functionality through three-phase lifecycle
- **Factory Pattern**: `pouch()` function creates instances with optional plugins
- **Type Safety**: Full TypeScript support with generic `Pouch<T>` interface

### Basic Usage

```typescript
import { pouch } from 'react-pouch';

// Simple state
const counter = pouch(0);

// With plugins
const user = pouch({ name: '', email: '' }, [
  validate(user => { /* validation logic */ }),
  persist('user-data'),
  logger()
]);

// In React components
function Counter() {
  const count = counter.use();
  return (
    <div>
      <span>{count}</span>
      <button onClick={() => counter.set(count + 1)}>+</button>
    </div>
  );
}
```

### Plugin Categories

1. **State Management**: `history`, `computed`, `middleware`
2. **Persistence**: `persist`, `rnPersist`, `sync`
3. **Validation**: `validate`, `schema`
4. **Performance**: `debounce`, `throttle`
5. **Utilities**: `logger`, `analytics`, `encrypt`

### Common Patterns

- **Theme Management**: Global theme state with persistence
- **Shopping Cart**: Complex object updates with persistence
- **User Authentication**: Login state with cleanup middleware
- **Form Validation**: Real-time validation with debouncing
- **Search & Filters**: Debounced search with filter state
- **Multi-step Wizards**: Progress tracking with persistence

## Documentation Coverage

### API Reference (`/api/`)
- Core pouch interface methods
- Plugin lifecycle hooks
- TypeScript type definitions
- Functional update patterns

### Plugin Documentation (`/plugins/`)
Each plugin includes:
- Configuration options
- Usage examples
- API methods added to pouches
- 6-8 real-world use cases
- Performance considerations

### Examples (`/examples/`)
- Getting started guide with basic patterns
- Advanced implementation techniques
- 8 comprehensive real-world use cases
- Best practices and anti-patterns

### TypeScript Reference (`/types/`)
- Complete interface definitions
- Plugin-specific type extensions
- Utility types and type guards
- Advanced generic patterns
- Error type definitions

## Key Features Documented

- ✅ Factory pattern for pouch creation
- ✅ Observer pattern for state changes
- ✅ Plugin system with three phases (initialize, setup, onSet)
- ✅ React and React Native integration
- ✅ TypeScript support with generics
- ✅ 13 built-in plugins with comprehensive examples
- ✅ Performance optimization techniques
- ✅ Error handling patterns
- ✅ Testing strategies
- ✅ Integration with other libraries

## Usage

This knowledgebase is designed to be consumed by MCP-compatible tools and AI assistants to provide comprehensive understanding of React Pouch capabilities, patterns, and best practices.

The documentation focuses on practical implementation with extensive code examples, making it easy to understand how to integrate React Pouch into real applications.

## Links

- **NPM Package**: `react-pouch`
- **GitHub Repository**: [react-pouch](https://github.com/yourusername/react-pouch)
- **Documentation**: [react-pouch.dev](https://react-pouch.dev)

---

*Generated with Claude Code - MCP Knowledgebase for React Pouch v1.0.0*