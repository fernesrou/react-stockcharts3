import type { Meta, StoryObj } from "@storybook/react";
import { ScatterSeries } from "../../../../series/src/ScatterSeries";
import BasicScatterSeries from "./BasicScatterSeries";

const meta: Meta<typeof ScatterSeries> = {
    component: ScatterSeries,
    title: "Visualization/Series/Scatter",
};

export default meta;
type Story = StoryObj<typeof ScatterSeries>;

export const bubble: Story = {
    render: () => <BasicScatterSeries />,
};
