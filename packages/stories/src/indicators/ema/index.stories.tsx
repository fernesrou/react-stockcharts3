import type { Meta, StoryObj } from "@storybook/react";
import EMAIndicator from "./EmaIndicator";

const meta: Meta<typeof EMAIndicator> = {
    title: "Visualization/Indicator/EMA",
    component: EMAIndicator,
    parameters: {
        componentSubtitle: "Moving averages smooth the price data to form a trend following indicator.",
    },
};

export default meta;
type Story = StoryObj<typeof EMAIndicator>;

export const basic: Story = {
    render: () => <EMAIndicator />,
};
