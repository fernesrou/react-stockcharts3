# Pan-to-Load Implementation with discontinuousTimeScaleProvider

## Overview

This document explains the **correct and final** implementation of pan-to-load functionality using `discontinuousTimeScaleProvider` in react-stockcharts3. This implementation creates a TradingView-like experience with **no gaps** in the chart and **precise data loading**.

## Why discontinuousTimeScaleProvider?

### Understanding Index-Based vs Date-Based Scales

**Traditional scaleTime() approach:**
```typescript
// Uses actual dates for positioning
Mon Oct 1 → pixel 0
Tue Oct 2 → pixel 100
// Weekend gap (Sat/Sun missing)
Mon Oct 8 → pixel 800  ❌ Big gap!
```

**discontinuousTimeScaleProvider approach:**
```typescript
// Uses sequential indices for positioning
Mon Oct 1 → index 0 → pixel 0
Tue Oct 2 → index 1 → pixel 100
Mon Oct 8 → index 2 → pixel 200  ✅ No gap!
// But displays actual dates on X-axis
```

### How discontinuousTimeScaleProvider Creates No-Gap Charts

The scale provider performs a **data transformation**:

1. **Input**: OHLC data with dates (weekends/holidays missing)
2. **Index Assignment**: Each data point gets a sequential index (0, 1, 2, 3...)
3. **Scale Creation**: A linear scale maps indices to pixels
4. **Date Preservation**: `displayXAccessor` keeps dates for labels

**Result**:
- Positioning uses indices (no gaps)
- Labels show actual dates
- TradingView-like appearance

## The Complete Implementation

### State Management Pattern

```typescript
interface ChartState {
    data: IOHLCData[];
    xScale: any;
    xAccessor: any;
    displayXAccessor: any;
}

class LoadingChart extends React.Component<ChartProps, ChartState> {
    // Track cumulative offset for prepended data
    private cumulativeOffset = 0;

    // Store full dataset
    private fullData: IOHLCData[];

    public constructor(props: ChartProps) {
        super(props);

        // Initialize with subset of data
        const initialData = props.data.slice(startIndex, endIndex);

        // Create initial scale
        const xScaleProvider = discontinuousTimeScaleProviderBuilder()
            .inputDateAccessor((d: IOHLCData) => d.date)
            .initialIndex(0);  // Start at 0

        const { data, xScale, xAccessor, displayXAccessor } = xScaleProvider(initialData);

        // Store scale properties in state
        this.state = { data, xScale, xAccessor, displayXAccessor };
    }
}
```

**Key difference from old approach:**
- ❌ OLD: Used `key={chart_${suffix}}` to force remounting
- ✅ NEW: Store scale in state, update directly (no remounting)
- Why: ChartCanvas.getDerivedStateFromProps handles prop updates smoothly

### Render Method

```typescript
public render() {
    const { height, ratio, width } = this.props;
    const { data, xScale, xAccessor, displayXAccessor } = this.state;

    return (
        <ChartCanvas
            height={height}
            ratio={ratio}
            width={width}
            data={data}
            xScale={xScale}
            xAccessor={xAccessor}              // Returns indices for positioning
            displayXAccessor={displayXAccessor} // Returns dates for display
            onLoadBefore={this.handleLoadBefore}
            onLoadAfter={this.handleLoadAfter}
        >
            <Chart id={1} yExtentsCalculator={this.yExtentsCalculator}>
                <CandlestickSeries />
                <XAxis />  {/* NO tickFormat - uses scale's built-in formatter */}
                <YAxis />
            </Chart>
            <CrossHairCursor snapX={false} />
        </ChartCanvas>
    );
}
```

**Important: XAxis Configuration**
- ❌ DON'T use: `<XAxis tickFormat={timeFormat} />`
- ✅ DO use: `<XAxis />`
- Why: The financeDiscontinuousScale has a built-in `tickFormat()` that properly maps indices to dates

### Loading Data Before (Pan Left)

```typescript
private handleLoadBefore = (start: number, end: number) => {
    // Get current data and accessor from state
    const currentData = this.state.data;
    const { xAccessor } = this.state;

    const earliestCurrent = currentData[0].date;
    const firstIndex = xAccessor(currentData[0]);

    // Calculate EXACT gap (no buffer)
    const gap = Math.ceil(firstIndex - start);
    const chunkSize = Math.max(1, gap);

    // Find data before earliest current
    const candidatePoints = this.fullData.filter(d => d.date < earliestCurrent);

    if (candidatePoints.length === 0) return;

    // Load exactly the gap amount
    const actualChunkSize = Math.min(chunkSize, candidatePoints.length);
    const newDataPoints = candidatePoints.slice(-actualChunkSize);

    // UPDATE OFFSET FIRST (critical!)
    this.cumulativeOffset -= newDataPoints.length;

    // Merge data
    const mergedData = [...newDataPoints, ...currentData];

    // Recalculate scale with new initialIndex
    const xScaleProvider = discontinuousTimeScaleProviderBuilder()
        .inputDateAccessor((d: IOHLCData) => d.date)
        .initialIndex(this.cumulativeOffset);

    const { data, xScale, xAccessor: newXAccessor, displayXAccessor } = xScaleProvider(mergedData);

    // Update state (ChartCanvas.getDerivedStateFromProps handles this)
    this.setState({
        data,
        xScale,
        xAccessor: newXAccessor,
        displayXAccessor,
    });
};
```

### Loading Data After (Pan Right)

```typescript
private handleLoadAfter = (start: number, end: number) => {
    // Get current data and accessor from state
    const currentData = this.state.data;
    const { xAccessor } = this.state;

    const latestCurrent = currentData[currentData.length - 1].date;
    const lastIndex = xAccessor(currentData[currentData.length - 1]);

    // Calculate EXACT gap (no buffer)
    const gap = Math.ceil(end - lastIndex);
    const chunkSize = Math.max(1, gap);

    // Find data after latest current
    const candidatePoints = this.fullData.filter(d => d.date > latestCurrent);

    if (candidatePoints.length === 0) return;

    // Load exactly the gap amount
    const actualChunkSize = Math.min(chunkSize, candidatePoints.length);
    const newDataPoints = candidatePoints.slice(0, actualChunkSize);

    // NO offset change when appending
    const mergedData = [...currentData, ...newDataPoints];

    // Recalculate scale with same initialIndex
    const xScaleProvider = discontinuousTimeScaleProviderBuilder()
        .inputDateAccessor((d: IOHLCData) => d.date)
        .initialIndex(this.cumulativeOffset);

    const { data, xScale, xAccessor: newXAccessor, displayXAccessor } = xScaleProvider(mergedData);

    // Update state
    this.setState({
        data,
        xScale,
        xAccessor: newXAccessor,
        displayXAccessor,
    });
};
```

## How initialIndex Preserves Viewport Position

### The Problem Without initialIndex

```javascript
// Initial state
data = [item400, item401, ..., item599]
indices = [0, 1, 2, ..., 199]
viewport showing indices [150, 199] (rightmost 50 candles)

// After loading 50 items before (WITHOUT initialIndex)
data = [item350, ..., item399, item400, ..., item599]
indices = [0, 1, ..., 49, 50, 51, ..., 249]
                        ↑
                item400 moved from 0 → 50

viewport still showing indices [150, 199]
BUT these are now item500-item549 instead of item550-item599
RESULT: Chart jumps! ❌
```

### The Solution With initialIndex

```javascript
// Initial state
data = [item400, item401, ..., item599]
initialIndex = 0
indices = [0, 1, 2, ..., 199]

// After loading 50 items before (WITH initialIndex = -50)
data = [item350, ..., item399, item400, ..., item599]
initialIndex = -50
indices = [-50, -49, ..., -1, 0, 1, ..., 199]
                            ↑
                    item400 STILL at 0

viewport still showing indices [150, 199]
These are STILL item550-item599
RESULT: No jump! ✅
```

## Understanding Callback Parameters

The `onLoadBefore(start, end)` and `onLoadAfter(start, end)` callbacks receive **index values**:

```typescript
// start: viewport's left edge index
// end: viewport's right edge index

// Example:
onLoadBefore(scale_start: -10, data_start: 0)
// Meaning: viewport wants to show from index -10, but data starts at 0
// Gap: 0 - (-10) = 10 candles needed
```

**Critical: These are indices, not dates!**
- ❌ DON'T convert to dates: `new Date(Math.floor(start))`
- ✅ DO calculate gap: `Math.ceil(firstIndex - start)`

## Dynamic Gap-Based Loading

### Why Gap-Based Loading?

**Fixed chunk loading (❌ OLD approach):**
```typescript
const chunkSize = 50; // Always load 50
```
Problems:
- Too small → blank spaces
- Too large → viewport shifts/auto-scroll

**Gap-based loading (✅ CURRENT approach):**
```typescript
const gap = Math.ceil(firstIndex - start);
const chunkSize = Math.max(1, gap); // Load exactly what's needed
```
Benefits:
- ✅ No blank spaces
- ✅ No viewport shifting
- ✅ Efficient (loads only what's visible)

### Visual Example

```
Viewport showing indices [100, 150]:

┌─────────────────────┐
│   Data loaded       │
│   [100 ... 150]     │
└─────────────────────┘

User pans left → viewport edge reaches index 95:

┌─────────────────────┐
│ ?  ?  ?  ?  ? Data  │  ← Gap of 5 candles
│[95][96][97][98][99][100 ... 145]
└─────────────────────┘

Gap calculation:
firstIndex = 100
start = 95
gap = 100 - 95 = 5

Load exactly 5 candles → fills gap perfectly!

┌─────────────────────┐
│   Data loaded       │
│   [95 ... 145]      │
└─────────────────────┘
```

## The Complete Data Flow

### Step-by-Step: What Happens When Loading Data

**1. User pans left, viewport edge goes past data edge**

**2. ChartCanvas detects and triggers callback:**
```typescript
if (scale_start < data_start) {
    onLoadBefore(scale_start, data_start);
}
```

**3. Handler calculates gap and loads data:**
```typescript
const gap = Math.ceil(firstIndex - start);
const newData = fullData.filter(...).slice(-gap);
```

**4. Update cumulative offset:**
```typescript
this.cumulativeOffset -= newData.length; // e.g., 0 → -5
```

**5. Recalculate scale with new offset:**
```typescript
const xScaleProvider = discontinuousTimeScaleProviderBuilder()
    .inputDateAccessor(d => d.date)
    .initialIndex(this.cumulativeOffset); // -5

// Creates indices: [-5, -4, -3, -2, -1, 0, 1, ..., 199]
```

**6. Update state:**
```typescript
this.setState({ data, xScale, xAccessor, displayXAccessor });
```

**7. ChartCanvas receives new props:**
- `ChartCanvas.getDerivedStateFromProps` runs
- Recalculates viewport with new data/scale
- Viewport position preserved (item at index 0 stays at index 0)

**8. Chart re-renders smoothly without jumping**

## Common Pitfalls and Solutions

### Issue 1: X-Axis Shows Floating Point Numbers

**Symptom**: X-axis displays `0.871`, `0.934`, etc. instead of dates

**Cause**: Overriding the scale's built-in tick formatter

**Solution**:
```typescript
// ❌ WRONG
<XAxis tickFormat={timeFormat} />

// ✅ CORRECT
<XAxis />
```

The `financeDiscontinuousScale.tickFormat()` method properly maps indices to dates:
```typescript
scale.tickFormat = () => {
    return function (x: any) {
        const d = Math.abs(index[0].index);
        const { format, date } = index[Math.floor(x + d)];
        return format(date); // Returns formatted date string
    };
};
```

### Issue 2: Viewport Jumps After Loading Data

**Symptom**: When loading data before/after, the visible candles shift

**Cause**: Not using `initialIndex` or not tracking `cumulativeOffset`

**Solution**:
1. Track offset: `private cumulativeOffset = 0`
2. Update when prepending: `this.cumulativeOffset -= newDataPoints.length`
3. Pass to scale provider: `.initialIndex(this.cumulativeOffset)`

### Issue 3: Variable Name Conflict

**Symptom**: Compilation error: `Identifier 'xAccessor' has already been declared`

**Cause**: Destructuring `xAccessor` from state, then from scale provider

**Solution**:
```typescript
const { xAccessor } = this.state; // First use

// Later...
const { data, xScale, xAccessor: newXAccessor, displayXAccessor } = xScaleProvider(mergedData);
//                       ^^^^^^^^^^^^^ Rename second use

this.setState({
    xAccessor: newXAccessor, // Use renamed variable
});
```

### Issue 4: Chart Resets Viewport on Data Update

**Symptom**: Chart scrolls to show rightmost data after loading

**Cause**: Using `key={chart_${suffix}}` forces remounting, which resets viewport

**Solution**: Remove the key prop, use direct state updates instead:
```typescript
// ❌ WRONG
<ChartCanvas key={`chart_${suffix}`} ... />

// ✅ CORRECT
<ChartCanvas ... />
```

Let `ChartCanvas.getDerivedStateFromProps` handle prop updates.

### Issue 5: Loading Too Much/Too Little Data

**Symptom**:
- Blank spaces between data and viewport edge
- OR viewport shifts because too much data loaded

**Cause**: Fixed chunk size instead of gap-based

**Solution**:
```typescript
// ❌ WRONG
const chunkSize = 50; // Always 50

// ✅ CORRECT
const gap = Math.ceil(firstIndex - start);
const chunkSize = Math.max(1, gap); // Exactly the gap
```

## Comparison with Original react-stockcharts

### Original Implementation

```javascript
// Original uses two-step pattern
handleDownloadMore(start, end) {
    // Step 1: Calculate indices
    const indexCalculator = discontinuousTimeScaleProviderBuilder()
        .initialIndex(Math.ceil(start))
        .indexCalculator();

    const { index } = indexCalculator(updatedData);

    // Step 2: Create scale with those indices
    const xScaleProvider = discontinuousTimeScaleProviderBuilder()
        .initialIndex(Math.ceil(start))
        .withIndex(index);

    const { data, xScale, xAccessor, displayXAccessor } = xScaleProvider(updatedData);

    // Manual state update
    this.setState({ data, xScale, xAccessor, displayXAccessor });
}
```

### react-stockcharts3 (Current Implementation)

```typescript
// Simplified single-step pattern
private handleLoadBefore = (start, end) => {
    // Calculate gap
    const gap = Math.ceil(firstIndex - start);

    // Load data
    const newDataPoints = fullData.filter(...).slice(-gap);

    // Update offset
    this.cumulativeOffset -= newDataPoints.length;

    // Single-step scale creation
    const xScaleProvider = discontinuousTimeScaleProviderBuilder()
        .inputDateAccessor(d => d.date)
        .initialIndex(this.cumulativeOffset);

    const { data, xScale, xAccessor, displayXAccessor } = xScaleProvider(mergedData);

    // State update
    this.setState({ data, xScale, xAccessor, displayXAccessor });
};
```

**Key improvements:**
- ✅ Simpler single-step pattern (no `.indexCalculator()` + `.withIndex()`)
- ✅ Gap-based loading (more precise)
- ✅ Cumulative offset tracking (clearer mental model)
- ✅ Direct state updates (no remounting)

## Working Examples

### File Locations

- **`LoadingChartNoGaps.tsx`** - Current implementation with gap-based loading
- **`LoadingChartDiscontinuous.tsx`** - Reference implementation (identical behavior)
- **`LoadingChart.tsx`** - Alternative using scaleTime() (shows gaps but simpler)

### Quick Start

```typescript
import { discontinuousTimeScaleProviderBuilder } from "react-stockcharts3";

class MyChart extends React.Component<Props, State> {
    private cumulativeOffset = 0;
    private fullData: IOHLCData[];

    constructor(props) {
        super(props);
        this.fullData = props.data;

        // Initialize with subset
        const initialData = props.data.slice(100, 200);
        const xScaleProvider = discontinuousTimeScaleProviderBuilder()
            .inputDateAccessor(d => d.date)
            .initialIndex(0);

        this.state = xScaleProvider(initialData);
    }

    render() {
        const { data, xScale, xAccessor, displayXAccessor } = this.state;

        return (
            <ChartCanvas
                data={data}
                xScale={xScale}
                xAccessor={xAccessor}
                displayXAccessor={displayXAccessor}
                onLoadBefore={this.handleLoadBefore}
                onLoadAfter={this.handleLoadAfter}
            >
                <Chart id={1}>
                    <CandlestickSeries />
                    <XAxis />
                    <YAxis />
                </Chart>
            </ChartCanvas>
        );
    }

    private handleLoadBefore = (start, end) => {
        const { data, xAccessor } = this.state;
        const gap = Math.ceil(xAccessor(data[0]) - start);
        const newData = this.loadGapData(gap, "before");

        this.cumulativeOffset -= newData.length;

        const xScaleProvider = discontinuousTimeScaleProviderBuilder()
            .inputDateAccessor(d => d.date)
            .initialIndex(this.cumulativeOffset);

        this.setState(xScaleProvider([...newData, ...data]));
    };

    private handleLoadAfter = (start, end) => {
        const { data, xAccessor } = this.state;
        const gap = Math.ceil(end - xAccessor(data[data.length - 1]));
        const newData = this.loadGapData(gap, "after");

        const xScaleProvider = discontinuousTimeScaleProviderBuilder()
            .inputDateAccessor(d => d.date)
            .initialIndex(this.cumulativeOffset);

        this.setState(xScaleProvider([...data, ...newData]));
    };
}
```

## Summary Checklist

To implement pan-to-load with no gaps and precise loading:

- ✅ Use `discontinuousTimeScaleProviderBuilder()`
- ✅ Track `cumulativeOffset` for prepended data
- ✅ Pass `.initialIndex(cumulativeOffset)` to scale provider
- ✅ Update offset when prepending: `cumulativeOffset -= newDataPoints.length`
- ✅ Calculate gap: `Math.ceil(firstIndex - start)` or `Math.ceil(end - lastIndex)`
- ✅ Load exactly the gap (no fixed buffers)
- ✅ Store scale props in state: `{ data, xScale, xAccessor, displayXAccessor }`
- ✅ Pass both `xAccessor` and `displayXAccessor` to ChartCanvas
- ✅ Use `<XAxis />` without `tickFormat` prop
- ✅ Update state directly (no `key` remounting)
- ✅ Rename variables to avoid conflicts (`xAccessor: newXAccessor`)

This creates a smooth, TradingView-like pan-to-load experience with no gaps and precise data loading!

---

**Document Updated**: 2025-11-01
**Status**: ✅ Production-ready implementation
**Version**: 2.0 (Gap-based loading)
