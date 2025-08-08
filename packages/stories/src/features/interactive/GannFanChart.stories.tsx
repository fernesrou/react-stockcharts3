import type { Meta, StoryObj } from "@storybook/react";
import GannFanChart from "./GannFanChart";

const meta: Meta<typeof GannFanChart> = {
    title: "Interactive/Gann Fan",
    component: GannFanChart,
    parameters: {
        layout: "fullscreen",
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => <GannFanChart />,
};
