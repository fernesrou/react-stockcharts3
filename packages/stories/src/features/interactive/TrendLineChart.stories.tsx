import type { Meta, StoryObj } from "@storybook/react";
import TrendLineChart from "./TrendLineChart";

const meta: Meta<typeof TrendLineChart> = {
    title: "Interactive/Trend Line",
    component: TrendLineChart,
    parameters: {
        layout: "fullscreen",
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => <TrendLineChart />,
};
