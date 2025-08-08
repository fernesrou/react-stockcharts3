import type { Meta, StoryObj } from "@storybook/react";
import StandardDeviationChannelChart from "./StandardDeviationChannelChart";

const meta: Meta<typeof StandardDeviationChannelChart> = {
    title: "Interactive/Standard Deviation Channel",
    component: StandardDeviationChannelChart,
    parameters: {
        layout: "fullscreen",
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => <StandardDeviationChannelChart />,
};
