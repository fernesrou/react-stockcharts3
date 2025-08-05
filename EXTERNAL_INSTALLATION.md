# 📦 Using React Financial Charts in External Projects

This guide explains how to properly install and use React Financial Charts in your external React projects to avoid the common "multiple React versions" error.

## 🔧 Quick Fix for Multiple React Versions Error

If you're seeing this error:
```
Uncaught Error: A React Element from an older version of React was rendered. This is not supported.
```

Follow the solutions below based on your bundler.

## 📋 Prerequisites

- **React 18+**: This library requires React 18 or higher
- **Node.js 18+**: Required for proper dependency resolution

```bash
npm list react react-dom
# Should show React 18.x.x or higher
```

## 🚀 Installation

### Method 1: NPM/Yarn (Recommended)

```bash
# Install the main package
npm install react-financial-charts

# Or install specific packages
npm install @react-financial-charts/core
npm install @react-financial-charts/series
npm install @react-financial-charts/axes
```

### Method 2: From Source (Development)

```bash
# Clone and build the monorepo
git clone https://github.com/reactivemarkets/react-financial-charts.git
cd react-financial-charts
npm install
npm run build:external
```

## ⚙️ Configuration by Bundler

### Webpack Configuration

Add to your `webpack.config.js`:

```javascript
module.exports = {
  resolve: {
    alias: {
      // Force single React instance
      react: path.resolve('./node_modules/react'),
      'react-dom': path.resolve('./node_modules/react-dom'),
    },
  },
  externals: {
    // Treat React as external in production builds
    react: 'React',
    'react-dom': 'ReactDOM',
  },
};
```

### Vite Configuration

Add to your `vite.config.js`:

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Force single React instance
      react: path.resolve('./node_modules/react'),
      'react-dom': path.resolve('./node_modules/react-dom'),
    },
  },
  build: {
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
});
```

### Create React App (CRA)

For CRA without ejecting, use CRACO:

```bash
npm install @craco/craco --save-dev
```

Create `craco.config.js`:

```javascript
const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        react: path.resolve('./node_modules/react'),
        'react-dom': path.resolve('./node_modules/react-dom'),
      };
      return webpackConfig;
    },
  },
};
```

Update `package.json`:

```json
{
  "scripts": {
    "start": "craco start",
    "build": "craco build",
    "test": "craco test"
  }
}
```

### Next.js Configuration

Add to your `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      react: path.resolve('./node_modules/react'),
      'react-dom': path.resolve('./node_modules/react-dom'),
    };
    return config;
  },
};

module.exports = nextConfig;
```

## 🔍 Troubleshooting

### 1. Clear Cache and Reinstall

```bash
# Remove all node_modules and lock files
rm -rf node_modules package-lock.json yarn.lock
npm install
```

### 2. Check for Duplicate React Installations

```bash
npm ls react
npm ls react-dom
```

If you see multiple versions, use:

```bash
npm dedupe
```

### 3. Force Single React Version

Add to your `package.json`:

```json
{
  "overrides": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  }
}
```

For Yarn:

```json
{
  "resolutions": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  }
}
```

### 4. React 18 Strict Mode (Optional)

If you experience chart flickering, consider disabling Strict Mode for chart components:

```jsx
// Wrap your chart component
function ChartWrapper() {
  return (
    <div data-chart-container>
      {/* Your chart components */}
      <Chart>
        <CandlestickSeries />
      </Chart>
    </div>
  );
}

// In your main App component
function App() {
  return (
    <React.StrictMode>
      <div>
        <Header />
        {/* Chart outside Strict Mode */}
      </div>
    </React.StrictMode>
  );
}
```

## 📖 Basic Usage Example

```jsx
import React from 'react';
import { Chart, ChartCanvas } from 'react-financial-charts';
import { CandlestickSeries } from '@react-financial-charts/series';
import { XAxis, YAxis } from '@react-financial-charts/axes';
import { scaleTime } from 'd3-scale';

const data = [
  {
    date: new Date(2023, 0, 1),
    open: 100,
    high: 110,
    low: 95,
    close: 105,
    volume: 1000000
  },
  // ... more data points
];

const xAccessor = (d) => d.date;
const xExtents = [
  xAccessor(data[0]),
  xAccessor(data[data.length - 1])
];

function MyChart() {
  return (
    <ChartCanvas
      height={400}
      width={800}
      ratio={1}
      margin={{ left: 50, right: 50, top: 10, bottom: 30 }}
      data={data}
      xAccessor={xAccessor}
      xScale={scaleTime()}
      xExtents={xExtents}
    >
      <Chart id={1} yExtents={(d) => [d.high, d.low]}>
        <XAxis />
        <YAxis />
        <CandlestickSeries />
      </Chart>
    </ChartCanvas>
  );
}

export default MyChart;
```

## 🏗️ Development Setup

If you're developing with the library:

1. **Link the packages locally:**
   ```bash
   cd react-financial-charts
   npm run build:external
   npm link
   
   cd your-project
   npm link react-financial-charts
   ```

2. **Watch for changes:**
   ```bash
   cd react-financial-charts
   npm run watch
   ```

## 🆘 Common Issues

### Issue: "Cannot resolve module 'react'"
**Solution:** Ensure React is installed in your project:
```bash
npm install react@^18.3.0 react-dom@^18.3.0
```

### Issue: TypeScript errors
**Solution:** Install type definitions:
```bash
npm install -D @types/react @types/react-dom
```

### Issue: Charts not rendering
**Solution:** Check console for errors and ensure proper data format:
```javascript
// Data must have date/time field and OHLC values
const data = [{
  date: new Date(),  // Required: date field
  open: 100,         // Required: number
  high: 110,         // Required: number  
  low: 95,           // Required: number
  close: 105,        // Required: number
  volume: 1000000    // Optional: number
}];
```

## 📞 Support

If you continue experiencing issues:

1. **Check our GitHub issues:** [Issues Page](https://github.com/reactivemarkets/react-financial-charts/issues)
2. **Verify your setup** using the troubleshooting steps above
3. **Create a minimal reproduction** to help diagnose the problem

## 📚 Additional Resources

- [API Documentation](https://github.com/reactivemarkets/react-financial-charts/tree/main/packages)
- [Storybook Examples](https://reactivemarkets.github.io/react-financial-charts/)
- [React 18 Migration Guide](./REACT_18_MODERNIZATION_PLAN.md)
- [Code Examples](./REACT_18_CODE_EXAMPLES.md)