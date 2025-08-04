import type { Meta, StoryObj } from "@storybook/react";
import { CandlestickSeries } from "../../../../series/src/CandlestickSeries";
import { Daily, Intraday } from "./BasicCandlestick";

const meta: Meta<typeof CandlestickSeries> = {
    component: CandlestickSeries,
    title: "Visualization/Series/Candles",
};

export default meta;
type Story = StoryObj<typeof CandlestickSeries>;

export const daily: Story = {
    render: () => <Daily />,
};

export const intraday: Story = {
    render: () => <Intraday />,
};
