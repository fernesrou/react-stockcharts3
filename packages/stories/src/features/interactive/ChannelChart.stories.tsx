import type { Meta, StoryObj } from "@storybook/react";
import ChannelChart from "./ChannelChart";

const meta: Meta<typeof ChannelChart> = {
    title: "Interactive/Equidistant Channel",
    component: ChannelChart,
    parameters: {
        layout: "fullscreen",
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => <ChannelChart />,
};
