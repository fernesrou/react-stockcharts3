# onLoadBefore & onLoadAfter

Dynamic data loading callbacks for implementing infinite scrolling in financial charts.

## Overview

`onLoadBefore` and `onLoadAfter` are callback props on `ChartCanvas` that trigger when users pan or zoom beyond the currently loaded data range. This enables lazy loading of historical and future data without loading the entire dataset upfront.

## Callbacks

### onLoadBefore

Called when panning or zooming **left** (earlier in time) past the first data point.

```typescript
onLoadBefore?: (start: TXAxis, end: TXAxis) => void;
```

**Parameters:**
- `start` - The visible domain start (left edge of viewport)
- `end` - The first available data point

**When it triggers:** When `start < firstDataPoint`

### onLoadAfter

Called when panning or zooming **right** (later in time) past the last data point.

```typescript
onLoadAfter?: (start: TXAxis, end: TXAxis) => void;
```

**Parameters:**
- `start` - The last available data point
- `end` - The visible domain end (right edge of viewport)

**When it triggers:** When `lastDataPoint < end`

## Trigger Events

Both callbacks are invoked after state updates in these scenarios:

1. **Pinch Zoom End** - After completing a pinch zoom gesture
2. **Mouse Wheel Zoom** - After zooming with scroll wheel
3. **X-Axis Zoom** - After programmatic zoom on the x-axis
4. **Pan End** - After completing a pan gesture

## How It Works

After each interaction, the chart checks if the visible domain extends beyond the available data:

```typescript
const firstItem = head(fullData);
const scale_start = head(xScale.domain());  // Visible left edge
const data_start = xAccessor(firstItem);     // First data point

const lastItem = last(fullData);
const scale_end = last(xScale.domain());     // Visible right edge
const data_end = xAccessor(lastItem);        // Last data point

// User panned/zoomed left beyond available data?
if (scale_start < data_start) {
    onLoadBefore(scale_start, data_start);
}

// User panned/zoomed right beyond available data?
if (data_end < scale_end) {
    onLoadAfter(data_end, scale_end);
}
```

## Usage Example

```typescript
import { ChartCanvas } from "react-stockcharts3";
import { useState } from "react";

function MyChart() {
    const [data, setData] = useState(initialData);

    const handleLoadBefore = async (start, end) => {
        // Fetch historical data from API
        const historicalData = await fetchHistoricalData(start, end);

        // Prepend to existing data
        setData([...historicalData, ...data]);
    };

    const handleLoadAfter = async (start, end) => {
        // Fetch recent/future data from API
        const recentData = await fetchRecentData(start, end);

        // Append to existing data
        setData([...data, ...recentData]);
    };

    return (
        <ChartCanvas
            data={data}
            onLoadBefore={handleLoadBefore}
            onLoadAfter={handleLoadAfter}
            // ... other props
        />
    );
}
```

## Best Practices

### 1. Avoid Duplicate Requests

Track loading state to prevent multiple simultaneous requests:

```typescript
const [isLoadingBefore, setIsLoadingBefore] = useState(false);

const handleLoadBefore = async (start, end) => {
    if (isLoadingBefore) return; // Prevent duplicate requests

    setIsLoadingBefore(true);
    try {
        const newData = await fetchData(start, end);
        setData([...newData, ...data]);
    } finally {
        setIsLoadingBefore(false);
    }
};
```

### 2. Check for Available Data

Before making API requests, check if there's actually more data to load:

```typescript
const handleLoadBefore = async (start, end) => {
    // Check if we've reached the beginning of available data
    if (hasReachedDataStart) return;

    const newData = await fetchData(start, end);

    if (newData.length === 0) {
        setHasReachedDataStart(true);
    } else {
        setData([...newData, ...data]);
    }
};
```

### 3. Handle Errors Gracefully

```typescript
const handleLoadBefore = async (start, end) => {
    try {
        const newData = await fetchData(start, end);
        setData([...newData, ...data]);
    } catch (error) {
        console.error("Failed to load data:", error);
        // Show error notification to user
    }
};
```

### 4. Maintain Data Sorting

Ensure data remains sorted by date after merging:

```typescript
const handleLoadBefore = async (start, end) => {
    const newData = await fetchData(start, end);

    // Data should already be sorted, but verify
    const mergedData = [...newData, ...data];

    // Optional: sort if needed
    mergedData.sort((a, b) => a.date - b.date);

    setData(mergedData);
};
```

## Common Use Cases

### Infinite Scrolling for Stock Charts

Load historical stock data as users scroll back in time:

```typescript
<ChartCanvas
    data={stockData}
    onLoadBefore={(start, end) => loadHistoricalStockData(start, end)}
    onLoadAfter={(start, end) => loadRecentStockData(start, end)}
/>
```

### Real-time Data with History

Combine live data streaming with historical data loading:

```typescript
// Load old data when panning left
onLoadBefore={(start, end) => loadHistoricalData(start, end)}

// Real-time updates handled separately via WebSocket
useEffect(() => {
    const ws = new WebSocket('wss://api.example.com/live');
    ws.onmessage = (event) => {
        const newPoint = JSON.parse(event.data);
        setData([...data, newPoint]);
    };
}, []);
```

### Paginated Data Loading

Load data in chunks based on viewport range:

```typescript
const handleLoadBefore = async (start, end) => {
    const pageSize = 100;
    const newData = await fetchPage(start, pageSize);
    setData([...newData, ...data]);
};
```

## Performance Considerations

1. **Debounce requests** - Rapid zoom/pan actions can trigger multiple callbacks
2. **Limit data size** - Remove old data points when the dataset gets too large
3. **Cache responses** - Cache API responses to avoid redundant requests
4. **Use pagination** - Load data in reasonable chunks, not entire datasets

## Example: Data Pruning

Prevent unlimited memory growth by pruning old data:

```typescript
const MAX_DATA_POINTS = 5000;

const handleLoadAfter = async (start, end) => {
    const newData = await fetchData(start, end);
    const mergedData = [...data, ...newData];

    // Keep only the most recent MAX_DATA_POINTS
    if (mergedData.length > MAX_DATA_POINTS) {
        const pruned = mergedData.slice(-MAX_DATA_POINTS);
        setData(pruned);
    } else {
        setData(mergedData);
    }
};
```

## See Also

- [Loading Data Story](./index.stories.tsx) - Interactive example
- [ChartCanvas API](../../../../../core/src/ChartCanvas.tsx) - Full component documentation
- [Updating Data Story](../updating/index.stories.tsx) - Related example for live data updates
