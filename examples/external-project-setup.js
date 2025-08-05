/**
 * Example setup for external projects using React StockCharts 3
 * Copy this code to your project and modify as needed
 */

import React from 'react';
import { Chart, ChartCanvas } from 'react-stockcharts3';
import { CandlestickSeries } from '@react-stockcharts3/series';
import { XAxis, YAxis } from '@react-stockcharts3/axes';
import { scaleTime } from 'd3-scale';

// Sample data - replace with your actual data
const sampleData = [
  {
    date: new Date(2023, 0, 1),
    open: 100,
    high: 110,
    low: 95,
    close: 105,
    volume: 1000000
  },
  {
    date: new Date(2023, 0, 2),
    open: 105,
    high: 115,
    low: 100,
    close: 112,
    volume: 1200000
  },
  {
    date: new Date(2023, 0, 3),
    open: 112,
    high: 118,
    low: 108,
    close: 116,
    volume: 900000
  },
  // Add more data points...
];

// Required: accessor function for x-axis (usually time/date)
const xAccessor = (d) => d.date;

// Required: define the data range for x-axis
const xExtents = [
  xAccessor(sampleData[0]),
  xAccessor(sampleData[sampleData.length - 1])
];

/**
 * Basic Financial Chart Component
 * This is the minimal setup required for a working chart
 */
function FinancialChart({ data = sampleData, width = 800, height = 400 }) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      <h2>Financial Chart Example</h2>
      
      <ChartCanvas
        height={height}
        width={width}
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
    </div>
  );
}

/**
 * Enhanced Chart with Multiple Indicators
 * Shows how to add multiple chart panels and indicators
 */
function EnhancedChart({ data = sampleData, width = 800, height = 600 }) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      <h2>Enhanced Financial Chart</h2>
      
      <ChartCanvas
        height={height}
        width={width}
        ratio={1}
        margin={{ left: 50, right: 50, top: 10, bottom: 30 }}
        data={data}
        xAccessor={xAccessor}
        xScale={scaleTime()}
        xExtents={xExtents}
      >
        {/* Main price chart */}
        <Chart id={1} height={400} yExtents={(d) => [d.high, d.low]}>
          <XAxis />
          <YAxis />
          <CandlestickSeries />
        </Chart>
        
        {/* Volume chart */}
        <Chart id={2} height={150} yExtents={(d) => d.volume} origin={(w, h) => [0, h - 150]}>
          <YAxis axisAt="left" orient="left" ticks={5} />
          {/* Add BarSeries here for volume if available */}
        </Chart>
      </ChartCanvas>
    </div>
  );
}

/**
 * Error Boundary for Chart Components
 * Helps catch and display React version conflicts
 */
class ChartErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Chart Error:', error, errorInfo);
    
    // Check if it's a React version conflict
    if (error.message.includes('older version of React')) {
      console.error('🔥 REACT VERSION CONFLICT DETECTED!');
      console.error('👉 Run: npx react-stockcharts3 diagnose');
      console.error('📖 See: EXTERNAL_INSTALLATION.md');
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          border: '2px solid red', 
          borderRadius: '8px',
          backgroundColor: '#ffe6e6',
          color: '#d00'
        }}>
          <h3>Chart Error</h3>
          <p><strong>Error:</strong> {this.state.error?.message}</p>
          
          {this.state.error?.message.includes('older version of React') && (
            <div>
              <p><strong>This is likely a React version conflict!</strong></p>
              <ol>
                <li>Run: <code>npx react-stockcharts3 diagnose</code></li>
                <li>Check: <code>EXTERNAL_INSTALLATION.md</code></li>
                <li>Ensure single React version in your project</li>
              </ol>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Main App Component
 * Shows how to use charts in your application
 */
function App() {
  return (
    <div className="App">
      <h1>React StockCharts 3 - External Project</h1>
      
      <ChartErrorBoundary>
        <FinancialChart />
      </ChartErrorBoundary>
      
      <hr style={{ margin: '40px 0' }} />
      
      <ChartErrorBoundary>
        <EnhancedChart />
      </ChartErrorBoundary>
      
      <footer style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f5f5f5' }}>
        <h3>Troubleshooting</h3>
        <p>If charts don't render or you see errors:</p>
        <ol>
          <li>Check browser console for specific errors</li>
          <li>Run diagnostic: <code>npx react-stockcharts3 diagnose</code></li>
          <li>Review setup guide: <code>EXTERNAL_INSTALLATION.md</code></li>
          <li>Ensure React 18+ is installed</li>
        </ol>
      </footer>
    </div>
  );
}

export default App;

// Export individual components for flexible usage
export { FinancialChart, EnhancedChart, ChartErrorBoundary };