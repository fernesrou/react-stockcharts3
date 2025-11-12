# Pan-to-Load with Discontinuous Data: Working Solutions

## Problem Summary

You want:
1. ✅ Pan-to-load functionality (`onLoadBefore`/`onLoadAfter`)
2. ✅ No time gaps (TradingView-like continuous display)
3. ✅ No viewport jumping when new data loads

**The Issue:**
`discontinuousTimeScaleProvider` with `.initialIndex()` **does NOT work** with pan-to-load due to a bug in `ChartCanvas.getDerivedStateFromProps`.

## Why discontinuousTimeScaleProvider Fails

### The Bug Mechanism

1. **Initial state**: Viewing indices `[10, 60]` in data with 100 candles
2. **Prepend 66 candles**: Use `.initialIndex(-66)` to shift indices
3. **New indices**: `[-66, -65, ..., -1, 0, 1, ..., 99]`
4. **ChartCanvas bug**:
   - Gets old domain `[10, 60]` from `state.xScale`
   - Applies it to new xScale with shifted indices
   - Domain `[10, 60]` now points to **different candles**
   - **Result**: Viewport jumps!

### Why It Works in Original react-stockcharts

Original react-stockcharts used class components with manual `setState()`, bypassing `getDerivedStateFromProps`.

react-stockcharts3 uses `getDerivedStateFromProps` which intercepts all prop changes and tries to preserve the domain automatically, but doesn't account for index mapping changes.

## ✅ Working Solution 1: scaleTime() with Gaps

**File**: `LoadingChart.tsx` (current implementation)

```typescript
import { scaleTime } from "d3-scale";

<ChartCanvas
    xScale={scaleTime()}
    xAccessor={(d) => d.date}
    onLoadBefore={this.handleLoadBefore}
    onLoadAfter={this.handleLoadAfter}
/>
```

**Pros:**
- ✅ Perfect pan-to-load without jumping
- ✅ Technically accurate (gaps represent market closures)
- ✅ Simple, reliable implementation

**Cons:**
- ⚠️ Shows time gaps (weekends, after-hours)

## ✅ Working Solution 2: scaleTime() + Gap Removal

**File**: `LoadingChartNoGaps.tsx` (new implementation)

```typescript
import { scaleTime } from "d3-scale";

// Preprocess data to remove gaps
private removeGaps(data: IOHLCData[]): IOHLCData[] {
    // Calculate median interval between candles
    const medianInterval = calculateMedianInterval(data);

    // Create synthetic continuous timeline
    const result: IOHLCData[] = [];
    let syntheticTime = data[0].date.getTime();

    for (let i = 0; i < data.length; i++) {
        result.push({
            ...data[i],
            date: new Date(syntheticTime),
            originalDate: data[i].date, // Keep for display
        });
        syntheticTime += medianInterval;
    }

    return result;
}
```

**How It Works:**
1. Calculate median time interval between candles
2. Replace actual dates with synthetic continuous timeline
3. Store original dates for axis labels
4. Use `scaleTime()` on synthetic dates (works perfectly with pan-to-load)
5. Display original dates on axis for accuracy

**Pros:**
- ✅ No gaps (TradingView-like appearance)
- ✅ Perfect pan-to-load without jumping
- ✅ Wider candles automatically fill space
- ✅ Uses reliable `scaleTime()` under the hood

**Cons:**
- ⚠️ Time axis shows compressed timestamps
- ⚠️ Not technically accurate (hides market closures)
- ⚠️ Requires data reprocessing on every load

## Comparison

| Feature | scaleTime (Gaps) | scaleTime (No Gaps) | discontinuousScale |
|---------|------------------|---------------------|-------------------|
| Pan-to-load | ✅ Works | ✅ Works | ❌ Jumps |
| No gaps | ❌ Shows gaps | ✅ No gaps | ✅ No gaps |
| Accurate time | ✅ Accurate | ⚠️ Compressed | ✅ Accurate |
| Implementation | Simple | Moderate | Complex |
| Reliability | ✅ Stable | ✅ Stable | ❌ Buggy |

## Recommendation

### For Most Use Cases
**Use Solution 1** (scaleTime with gaps) - It's simple, accurate, and reliable.

### For TradingView-like Appearance
**Use Solution 2** (scaleTime with gap removal) - It provides the visual continuity you want while maintaining pan-to-load reliability.

### Do NOT Use
**discontinuousTimeScaleProvider** with pan-to-load - It's fundamentally broken in react-stockcharts3.

## Implementation Examples

### Example 1: With Gaps (Simple)

See `LoadingChart.tsx`:
- Uses `scaleTime()`
- Direct date-based xAccessor
- Works out of the box

### Example 2: No Gaps (Advanced)

See `LoadingChartNoGaps.tsx`:
- Uses `scaleTime()` with preprocessed data
- Removes gaps by creating synthetic timeline
- Preserves original dates for display
- Reprocesses data on each load

## Technical Details

### Why scaleTime() Doesn't Jump

```typescript
// Before loading
domain: [Date('2024-01-10'), Date('2024-02-20')]

// After prepending 66 candles
// Same dates still exist at same positions in time
domain: [Date('2024-01-10'), Date('2024-02-20')]

// Result: No jump! ✅
```

### Why discontinuousTimeScaleProvider Jumps

```typescript
// Before loading
indices: [0, 1, 2, ..., 99]
domain: [10, 60] // Shows candles at array positions 10-60

// After prepending 66 candles with .initialIndex(-66)
indices: [-66, -65, ..., -1, 0, 1, ..., 99]
// ChartCanvas preserves domain [10, 60]
// But now [10, 60] points to array positions 76-126!

// Result: Jump to wrong position! ❌
```

## Fix for Library Maintainers

To fix this bug in react-stockcharts3, modify `ChartCanvas.getDerivedStateFromProps`:

```typescript
public static getDerivedStateFromProps(props, state) {
    // Detect index shift
    const oldFirstIndex = state.xScale?.index?.()?.[0]?.index;
    const newFirstIndex = calculatedState.xScale?.index?.()?.[0]?.index;

    if (oldFirstIndex !== newFirstIndex) {
        // Adjust domain to compensate for index shift
        const indexShift = newFirstIndex - oldFirstIndex;
        const [oldStart, oldEnd] = state.xScale.domain();
        const newDomain = [oldStart + indexShift, oldEnd + indexShift];
        newState.xScale.domain(newDomain);
    }
}
```

However, this would require forking and maintaining the library.

## Conclusion

For pan-to-load with discontinuous data:
1. **Recommended**: Use `scaleTime()` + gap removal preprocessing
2. **Simple alternative**: Use `scaleTime()` as-is (accept gaps)
3. **Avoid**: discontinuousTimeScaleProvider with .initialIndex()

The gap removal approach provides the best of both worlds: TradingView-like visual continuity with the reliability of date-based scaling.
