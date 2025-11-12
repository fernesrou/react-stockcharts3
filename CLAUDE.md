# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React Financial Charts is a TypeScript-based monorepo for creating financial charts in React. It's a fork of react-stockcharts, fully converted to TypeScript with extensive bug fixes and improvements. The project uses Lerna for managing multiple packages and dependencies.

## Common Commands

### Development
- `npm start` - Builds all packages, then starts watch mode and Storybook in parallel
- `npm run build` - Builds all packages using Lerna
- `npm run watch` - Watches all packages for changes in parallel (requires prior build)
- After `npm ci`, dependencies are automatically bootstrapped via Lerna

### Linting and Testing
- `npm run lint` - Runs ESLint on TypeScript/TSX files
- `npm run lint:fix` - Fixes ESLint issues automatically
- `npm test` - Runs tests across all packages

### Package-Specific Builds
- `npm run build:core` - Builds only the core package (`@react-stockcharts3/core`)
- `npm run build:charts` - Builds only the main charts package (`react-stockcharts3`)
- `npm run build:series` - Builds only the series package (`@react-stockcharts3/series`)
- `npm run build:indicators` - Builds only the indicators package (`@react-stockcharts3/indicators`)
- Build other packages: `npm run build:annotations`, `build:axes`, `build:coordinates`, `build:interactive`, `build:scales`, `build:tooltip`, `build:utils`
- Generic Lerna command: `lerna run build --scope=@react-stockcharts3/[package-name]`

### Documentation
- `npm run docs` - Builds documentation and Storybook stories
- `npm run start:stories` - Starts Storybook development server

### Cleanup
- `npm run clean` - Cleans all packages and node_modules
- `npm run clean:packages` - Cleans only package build outputs

## Architecture

### Monorepo Structure
The project is organized as a Lerna monorepo with packages in `/packages/`:

- **`core`** - Core chart components (ChartCanvas, Chart, EventCapture)
- **`charts`** - Main entry point that re-exports all other packages
- **`series`** - Chart series components (CandlestickSeries, LineSeries, AreaSeries, etc.)
- **`indicators`** - Technical indicators (MACD, RSI, Bollinger Bands, etc.)
- **`coordinates`** - Mouse and cursor coordinate components
- **`axes`** - X and Y axis components
- **`annotations`** - Chart annotation components
- **`interactive`** - Interactive drawing tools (TrendLine, Fibonacci, etc.)
- **`tooltip`** - Tooltip components for various chart types
- **`scales`** - Time and price scaling utilities
- **`utils`** - Shared utility components and functions
- **`stories`** - Storybook examples and documentation

### Key Components
- **ChartCanvas** (`packages/core/src/ChartCanvas.tsx`) - Main chart container that handles canvas rendering, events, and data management
- **Chart** - Individual chart panels within ChartCanvas
- **Series Components** - Render different chart types (candlestick, line, area, etc.)
- **Indicators** - Technical analysis overlays and separate indicator panels

### Data Flow
Charts expect data in OHLC format with time-based x-axis scaling. The core uses D3 scales for price and time domains, with custom discontinuous time scaling for financial markets.

### Canvas Architecture
The library uses HTML5 Canvas for high-performance rendering of financial data, with SVG overlays for interactive elements and tooltips.

## Development Notes

### TypeScript Configuration
Each package has its own `tsconfig.json` that extends common TypeScript settings. The build process compiles TypeScript to both CommonJS and ES modules.

### Testing
Tests use Jest and are located in `__tests__` directories within each package. Run tests for individual packages using Lerna scoping.

### Storybook
Examples and documentation are built using Storybook. Stories are located in `packages/stories/src/` organized by feature and component type. Storybook configuration is in `packages/stories/.storybook/`.

## React 18 Modernization

This project has been modernized to work with React 18. Key documents:

- **`REACT_18_MODERNIZATION_PLAN.md`** - Comprehensive plan for React 18 compatibility, addressing flickering issues caused by Strict Mode and concurrent rendering
- **`REACT_18_CODE_EXAMPLES.md`** - Specific code implementations and examples for React 18 optimization

### Key React 18 Considerations

- **Flickering Prevention**: Charts use optimized canvas operations that work with React 18's automatic batching
- **Strict Mode**: Development environments should disable Strict Mode for smooth chart interactions
- **Concurrent Features**: Canvas operations are designed to be concurrent-safe while maintaining performance

### Development Setup

Storybook is already configured with Strict Mode disabled to prevent chart flickering:

```javascript
// packages/stories/.storybook/main.js
framework: {
  name: "@storybook/react-webpack5",
  options: {
    strictMode: false, // Critical for chart performance
  },
}
```