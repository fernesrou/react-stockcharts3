import type { Meta, StoryObj } from "@storybook/react";
import { OHLCSeries } from "../../../../series/src/OHLCSeries";
import { Daily, Intraday } from "./BasicOHLCSeries";

const meta: Meta<typeof OHLCSeries> = {
    component: OHLCSeries,
    title: "Visualization/Series/OHLC",
};

export default meta;
type Story = StoryObj<typeof OHLCSeries>;

export const daily: Story = {
    render: () => <Daily />,
};

export const intraday: Story = {
    render: () => <Intraday />,
};
