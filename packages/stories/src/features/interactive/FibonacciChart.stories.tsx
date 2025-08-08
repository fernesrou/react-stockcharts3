import type { Meta, StoryObj } from "@storybook/react";
import FibonacciChart from "./FibonacciChart";

const meta: Meta<typeof FibonacciChart> = {
    title: "Interactive/Fibonacci Retracement",
    component: FibonacciChart,
    parameters: {
        layout: "fullscreen",
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => <FibonacciChart />,
};
