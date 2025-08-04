import type { Meta, StoryObj } from "@storybook/react";
import { RenkoSeries } from "../../../../series/src/RenkoSeries";
import { Daily, Intraday } from "./BasicRenkoSeries";

const meta: Meta<typeof RenkoSeries> = {
    component: RenkoSeries,
    title: "Visualization/Series/Renko",
};

export default meta;
type Story = StoryObj<typeof RenkoSeries>;

export const daily: Story = {
    render: () => <Daily />,
};

export const intraday: Story = {
    render: () => <Intraday />,
};
