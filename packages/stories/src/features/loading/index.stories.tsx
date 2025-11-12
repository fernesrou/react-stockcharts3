import type { Meta, StoryObj } from "@storybook/react";
import { Loading } from "./LoadingChart";
import { LoadingNoGaps } from "./LoadingChartNoGaps";

const meta: Meta<typeof Loading> = {
    title: "Features/Loading Data",
    component: Loading,
    parameters: {
        docs: {
            description: {
                component: `
This example demonstrates the \`onLoadBefore\` and \`onLoadAfter\` callbacks.

These callbacks enable **infinite scrolling** by loading more data when users pan or zoom beyond the current dataset boundaries.

## How It Works

- **onLoadBefore**: Called when panning/zooming **left** (earlier in time) past the first data point
- **onLoadAfter**: Called when panning/zooming **right** (later in time) past the last data point

## Try It

1. The chart initially shows only a subset of data (middle 20%)
2. **Pan left** or **zoom out** on the left edge to trigger \`onLoadBefore\`
3. **Pan right** or **zoom out** on the right edge to trigger \`onLoadAfter\`
4. Watch the console for callback logs

## Typical Use Case

\`\`\`typescript
<ChartCanvas
    data={data}
    onLoadBefore={(start, end) => {
        // Fetch historical data from API
        fetchHistoricalData(start, end).then(newData => {
            setData([...newData, ...data]);
        });
    }}
    onLoadAfter={(start, end) => {
        // Fetch recent data from API
        fetchRecentData(start, end).then(newData => {
            setData([...data, ...newData]);
        });
    }}
/>
\`\`\`

## ⚠️ discontinuousTimeScaleProvider + pan-to-load = Bug

Using \`discontinuousTimeScaleProvider\` with \`.initialIndex()\` and pan-to-load causes viewport jumping.
This is a fundamental bug in react-stockcharts3's \`ChartCanvas.getDerivedStateFromProps\`.

See \`PAN_TO_LOAD_IMPLEMENTATION.md\` for full technical analysis.

**Working Solutions:**
1. Use \`scaleTime()\` (shows gaps - technically accurate)
2. Use \`scaleTime()\` + preprocess data to remove gaps (no gaps, works perfectly)
                `,
            },
        },
    },
};

export default meta;
type Story = StoryObj<typeof Loading>;

export const WithGaps: Story = {
    name: "With Time Gaps (Accurate)",
    render: () => <Loading />,
    parameters: {
        docs: {
            description: {
                story: `
Uses \`scaleTime()\` which shows market closures as gaps.

**Pros:**
- ✅ Perfect pan-to-load without jumping
- ✅ Technically accurate (gaps = market closures)

**Cons:**
- ⚠️ Visible gaps in weekends/after-hours
                `,
            },
        },
    },
};

export const WithoutGaps: Story = {
    name: "No Gaps (TradingView-like)",
    render: () => <LoadingNoGaps />,
    parameters: {
        docs: {
            description: {
                story: `
Uses \`scaleTime()\` + custom data preprocessing to remove gaps.

**Pros:**
- ✅ No gaps (TradingView-like appearance)
- ✅ Perfect pan-to-load without jumping
- ✅ Wider candles fill the space

**Cons:**
- ⚠️ Time axis shows compressed timestamps
- ⚠️ Not technically accurate (hides market closures)
                `,
            },
        },
    },
};
