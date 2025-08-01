# React Compatibility Guide

This guide describes React Financial Charts compatibility with different React versions.

## Supported React Versions

React Financial Charts supports the following React versions:

- ✅ **React 16.x** - Full support
- ✅ **React 17.x** - Full support  
- ✅ **React 18.x** - Full support
- ✅ **React 19.x** - Full support

## Installation

### With React 19

```bash
npm install react@^19.0.0 react-dom@^19.0.0 react-financial-charts
```

### With React 18

```bash
npm install react@^18.0.0 react-dom@^18.0.0 react-financial-charts
```

### With React 17

```bash
npm install react@^17.0.0 react-dom@^17.0.0 react-financial-charts
```

### With React 16

```bash
npm install react@^16.0.0 react-dom@^16.0.0 react-financial-charts
```

## React 19 Compatibility

React Financial Charts has been verified to work with React 19. The library:

- ✅ Uses `React.createRef()` which is fully compatible with React 19
- ✅ Does not use deprecated APIs like `React.findDOMNode()`
- ✅ Does not use `forwardRef` in ways that would break with React 19
- ✅ Uses Class Components which remain fully supported
- ✅ Context API usage is compatible with React 19
- ✅ Event handling follows React 19 patterns

### Key Compatibility Notes

1. **Refs**: All ref usage follows modern patterns with `React.createRef()`
2. **Context**: Uses modern Context API (React.createContext)
3. **Events**: All event handlers are properly typed and follow React patterns
4. **TypeScript**: Compatible with React 19 TypeScript definitions

## Migration Notes

### From React 16/17 to React 18

- No changes required in React Financial Charts usage
- Follow React 18 migration guide for your application

### From React 18 to React 19

- No changes required in React Financial Charts usage
- Follow React 19 migration guide for your application

## Testing

The library has been tested with:
- React 16.8+ (Hooks support required)
- React 17.x (all versions)
- React 18.x (all versions)
- React 19.x (latest stable)

## Issues and Support

If you encounter any compatibility issues with a specific React version, please:

1. Check that you're using a supported React version
2. Verify your peer dependencies are correctly installed
3. Report issues at: https://github.com/reactivemarkets/react-financial-charts/issues

## Development

The library is developed and tested with:
- Node.js 18+
- TypeScript 5.6+
- React 18.x (development environment)
- React 19.x (compatibility testing)