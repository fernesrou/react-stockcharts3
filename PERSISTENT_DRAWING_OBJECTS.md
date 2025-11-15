# Persistent Drawing Objects Across Intervals

This document explains the implementation of cross-interval persistence for interactive drawing objects (EquidistantChannel, TrendLine, etc.) in react-stockcharts3.

## Problem Statement

Drawing objects were not persisting correctly when switching between different time intervals (e.g., from 5-minute to daily charts). The drawings would appear at incorrect Y-axis (price) positions or disappear entirely when changing intervals.

### Root Cause

The library's drawing components accept coordinates as `[xValue, yValue]` pairs where:
- `xValue` should be a Date or timestamp
- `yValue` should be a price

However, the original implementation was **snapping coordinates to the nearest data point** even when `snap={false}` was set. This meant:

1. A drawing created on a 5-minute interval would store coordinates like `[Date("2024-01-15 10:23:00"), 150.25]`
2. When switching to a daily interval, that exact timestamp (`10:23:00`) doesn't exist in the dataset (only `00:00:00` timestamps exist)
3. The coordinate conversion logic would fail to properly map the stored coordinates to pixel positions

### Technical Details

In `ChartDataUtil.ts`, the `getXValue()` function was always calling `getClosestItem()` which snapped timestamps to the nearest available data point in the current dataset:

```typescript
export function getXValue(xScale, xAccessor, mouseXY, plotData) {
    if (xScale.invert) {
        xValue = xScale.invert(mouseXY[0]);  // Get raw timestamp
        if (xValue > xAccessor(last(plotData))) {
            return Math.round(xValue.valueOf());
        } else {
            item = getClosestItem(plotData, xValue, xAccessor);  // ❌ Snaps to dataset
        }
    }
    return xAccessor(item);  // Returns snapped value
}
```

## Solution

Store **raw Date timestamps** that don't depend on the current dataset. When `snap={false}`, use `xScale.invert()` directly instead of snapping to the closest data point.

### Changes Made

#### 1. MouseLocationIndicator.tsx

Modified the `xy()` method to use raw timestamp inversion when `snap=false`:

```typescript
// Before
const xValue = snap && !shouldDisableSnap(e)
    ? xAccessor(currentItem)
    : getXValue(xScale, xAccessor, mouseXY, plotData);  // Always snaps

// After
const xValue = snap && !shouldDisableSnap(e)
    ? xAccessor(currentItem)
    : xScale.invert ? xScale.invert(mouseXY[0]) : getXValue(xScale, xAccessor, mouseXY, plotData);
```

#### 2. EachEquidistantChannel.tsx

Updated all drag handlers to use raw timestamp inversion:

```typescript
// handleLine1Edge1Drag, handleLine1Edge2Drag, handleChannelDrag
// Before
const newX1Value = getXValue(xScale, xAccessor, [x1 - dx, y1 - dy], fullData);

// After
const newX1Value = xScale.invert ? xScale.invert(x1 - dx) : getXValue(xScale, xAccessor, [x1 - dx, y1 - dy], fullData);
```

### How It Works Now

1. **Drawing Creation**: When a user creates a drawing with `snap={false}`, the exact mouse position is converted to a raw timestamp using `xScale.invert(pixelX)`, not snapped to any data point.

2. **Storage Format**: Drawings are stored as:
   ```typescript
   {
       startXY: [Date("2024-01-15 10:23:17.456"), 150.25],  // Raw timestamp + price
       endXY: [Date("2024-01-15 14:47:33.891"), 152.75],
       dy: 2.5  // Price offset for parallel channel
   }
   ```

3. **Rendering**: When the drawing is rendered on any interval:
   - The raw timestamp is passed to `xScale(timestamp)` which interpolates it to the correct pixel position
   - The price value is passed to `yScale(price)` which converts it to pixels
   - This works regardless of whether that exact timestamp exists in the current dataset

4. **Cross-Interval Persistence**: Because drawings are anchored to absolute timestamps and prices (not dataset indices), they appear at the correct positions across all intervals.

## Implementation Guide

### For New Drawing Components

To make any drawing component support cross-interval persistence:

1. **Set `snap={false}` in MouseLocationIndicator**:
   ```typescript
   <MouseLocationIndicator
       enabled={enabled}
       snap={false}  // Critical for cross-interval support
       onMouseDown={this.handleStart}
       onClick={this.handleEnd}
   />
   ```

2. **Use raw timestamp inversion in drag handlers**:
   ```typescript
   private readonly handleDrag = (e: React.MouseEvent, moreProps: any) => {
       const { xScale, yScale } = moreProps;
       const { startPos, mouseXY } = moreProps;

       const dx = startPos[0] - mouseXY[0];
       const dy = startPos[1] - mouseXY[1];

       const x1 = xScale(this.dragStart.x);
       const y1 = yScale(this.dragStart.y);

       // Use xScale.invert directly for raw timestamps
       const newXValue = xScale.invert ? xScale.invert(x1 - dx) : /* fallback */;
       const newYValue = yScale.invert(y1 - dy);

       // Update drawing with new values
   };
   ```

3. **Store coordinates as data values, not pixels**:
   ```typescript
   // ✅ Correct - stores Date and price
   const channel = {
       startXY: [new Date("2024-01-15T10:23:17"), 150.25],
       endXY: [new Date("2024-01-15T14:47:33"), 152.75]
   };

   // ❌ Wrong - stores pixel coordinates
   const channel = {
       startXY: [100, 200],  // These won't work across intervals
       endXY: [500, 180]
   };
   ```

### For Chart Implementation

In your chart component that manages drawing state:

```typescript
interface ChartState {
    channels: Array<{
        startXY: [Date, number];  // [timestamp, price]
        endXY: [Date, number];
        dy?: number;
        selected?: boolean;
        appearance?: object;
    }>;
}

// The library handles coordinate conversion automatically
<EquidistantChannel
    enabled={drawingMode}
    snap={false}  // Essential
    onComplete={this.handleDrawingComplete}
    channels={this.state.channels}
/>
```

### Persistence Across Sessions

To save/load drawings across sessions or intervals:

```typescript
// Save to localStorage/database
const serializedChannels = channels.map(ch => ({
    ...ch,
    startXY: [ch.startXY[0].toISOString(), ch.startXY[1]],
    endXY: [ch.endXY[0].toISOString(), ch.endXY[1]]
}));

// Restore from storage
const restoredChannels = serializedChannels.map(ch => ({
    ...ch,
    startXY: [new Date(ch.startXY[0]), ch.startXY[1]],
    endXY: [new Date(ch.endXY[0]), ch.endXY[1]]
}));
```

## Testing Checklist

When implementing persistent drawing objects:

- [ ] Drawing created on one interval appears at same dates/prices on other intervals
- [ ] Dragging a drawing on different intervals updates correctly
- [ ] Resizing drawing edges works across intervals
- [ ] Drawings can be serialized to JSON and restored
- [ ] Multiple drawings don't interfere with each other
- [ ] Drawings outside the visible range don't cause errors
- [ ] Drawing selection works consistently across intervals

## Related Files

- `packages/interactive/src/components/MouseLocationIndicator.tsx` - Coordinate capture
- `packages/interactive/src/wrapper/EachEquidistantChannel.tsx` - Channel implementation
- `packages/interactive/src/wrapper/EachTrendLine.tsx` - Similar pattern for trend lines
- `packages/core/src/utils/ChartDataUtil.ts` - Coordinate conversion utilities
- `packages/stories/src/features/interactive/ChannelChart.tsx` - Example implementation

## Future Enhancements

Potential improvements for drawing persistence:

1. **Automatic coordinate migration** - Detect old pixel-based coordinates and convert them
2. **Drawing validation** - Check if drawings are within reasonable bounds when loading
3. **Batch coordinate updates** - Optimize re-rendering when switching intervals with many drawings
4. **Drawing metadata** - Store creation interval, user notes, etc. with each drawing
5. **Conflict resolution** - Handle drawings created on different intervals that overlap

## Discontinuous Scale Handling

### Understanding Discontinuous Scales

When using `discontinuousTimeScaleProvider`, the architecture is different from regular time scales:

- **`xScale`** maps **index ↔ pixels** (NOT date ↔ pixels)
- **`xAccessor(datum)`** returns `datum.idx.index` (a numeric index in the dataset)
- **`displayXAccessor(datum)`** returns the actual Date for display purposes
- **`xScale.invert(pixel)`** returns an **index** (number), not a Date

This means the coordinate conversion requires an additional step:
```
Date ↔ Index ↔ Pixel
```

### Required Helper Functions

To work with discontinuous scales, use these conversion utilities:

```typescript
import { getClosestItem } from "@react-stockcharts3/core";

// Convert Date to Index using the current dataset
function dateToIndex(
    date: Date,
    plotData: any[],
    xAccessor: (d: any) => number,
    displayXAccessor: (d: any) => Date
): number | null {
    const item = getClosestItem(plotData, date, displayXAccessor);
    return item ? xAccessor(item) : null;
}

// Convert Index to Date using the current dataset
function indexToDate(
    index: number,
    plotData: any[],
    xAccessor: (d: any) => number,
    displayXAccessor: (d: any) => Date
): Date | null {
    const item = getClosestItem(plotData, index, xAccessor);
    return item ? displayXAccessor(item) : null;
}
```

### Capturing Coordinates with Discontinuous Scales

When capturing drawing coordinates (mouse clicks/drags):

```typescript
// In MouseLocationIndicator or drag handlers
const { xScale, yScale, plotData, xAccessor, displayXAccessor } = moreProps;

// Step 1: Convert pixel to index
const mouseIndex = xScale.invert(mouseXY[0]);  // pixel → index

// Step 2: Convert index to date for storage
const storedDate = indexToDate(mouseIndex, plotData, xAccessor, displayXAccessor);
const storedPrice = yScale.invert(mouseXY[1]);

// Step 3: Store as [Date, price]
const coordinate = [storedDate, storedPrice];
```

### Rendering Coordinates with Discontinuous Scales

When rendering a drawing with stored coordinates:

```typescript
// In render/drawing component
const { xScale, yScale, plotData, xAccessor, displayXAccessor } = moreProps;
const [storedDate, storedPrice] = drawing.startXY;

// Step 1: Convert stored date to current dataset index
const currentIndex = dateToIndex(storedDate, plotData, xAccessor, displayXAccessor);

// Step 2: Convert index to pixel
const x = xScale(currentIndex);
const y = yScale(storedPrice);

// Use x, y for rendering
```

### Updated Drag Handler Example

For discontinuous scales, drag handlers need the extra conversion:

```typescript
private readonly handleDrag = (e: React.MouseEvent, moreProps: any) => {
    const { xScale, yScale, plotData, xAccessor, displayXAccessor } = moreProps;
    const { startPos, mouseXY } = moreProps;

    const dx = startPos[0] - mouseXY[0];
    const dy = startPos[1] - mouseXY[1];

    // Convert stored date to current index, then to pixel
    const currentIndex = dateToIndex(this.dragStart.date, plotData, xAccessor, displayXAccessor);
    const x1 = xScale(currentIndex);
    const y1 = yScale(this.dragStart.price);

    // Calculate new position
    const newIndex = xScale.invert(x1 - dx);
    const newYValue = yScale.invert(y1 - dy);

    // Convert new index back to date for storage
    const newDate = indexToDate(newIndex, plotData, xAccessor, displayXAccessor);

    // Update drawing with [newDate, newYValue]
};
```

### Why This Works Across Intervals

With discontinuous scales, drawings persist correctly because:

1. **Storage is interval-independent**: Dates are absolute, not tied to any specific dataset
2. **Rendering adapts to current data**: The date-to-index conversion uses the currently loaded dataset
3. **Gaps are handled automatically**: The discontinuous scale skips weekends/holidays/non-trading hours
4. **Index lookup is flexible**: `getClosestItem` finds the nearest data point for any date

### Example: 5-Minute to Daily Interval

```typescript
// Drawing created on 5-minute chart
const drawing = {
    startXY: [new Date("2024-01-15T10:23:00"), 150.25],  // Mid-morning timestamp
    endXY: [new Date("2024-01-15T14:47:00"), 152.75]
};

// When rendered on DAILY chart:
// 1. dateToIndex() finds the daily bar for 2024-01-15 (ignores the time)
// 2. Gets that bar's index (e.g., 42)
// 3. xScale(42) converts to pixel position
// 4. Drawing appears at the correct date (2024-01-15) and price

// When rendered back on 5-MINUTE chart:
// 1. dateToIndex() finds the 5-min bar closest to 10:23:00
// 2. Gets that bar's index (e.g., 2847)
// 3. xScale(2847) converts to pixel position
// 4. Drawing appears at approximately 10:23:00 at the correct price
```

## Notes

- This solution works for **both time-based scales** (scaleTime) and **discontinuous scales** (discontinuousTimeScaleProvider)
- For **continuous scales** (scaleTime): `xScale.invert()` returns dates directly, no index conversion needed
- For **discontinuous scales**: Always use the date↔index conversion helpers
- For **non-time scales** (scaleLinear, etc.): snapping may still be necessary
- The `dy` property (parallel channel offset) is stored as a price difference, not pixels
- Price values work across intervals as long as the Y-axis represents the same units (e.g., USD)
- The `getClosestItem` utility from `@react-stockcharts3/core` handles both date and index lookups efficiently using binary search
