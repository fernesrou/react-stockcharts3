import type { Meta, StoryObj } from "@storybook/react";
import InteractiveTextChart from "./InteractiveTextChart";

const meta: Meta<typeof InteractiveTextChart> = {
    title: "Interactive/Interactive Text",
    component: InteractiveTextChart,
    parameters: {
        layout: "fullscreen",
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => <InteractiveTextChart />,
};
