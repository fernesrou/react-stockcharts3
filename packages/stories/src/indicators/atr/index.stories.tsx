import type { Meta, StoryObj } from "@storybook/react";
import { atr } from "@react-financial-charts/indicators";
import ATRIndicator from "./AtrIndicator";

const meta: Meta<typeof atr> = {
    title: "Visualization/Indicator/ATR",
    component: atr,
    parameters: {
        componentSubtitle: "Average True Range (ATR) is an indicator that measures volatility.",
    },
};

export default meta;
type Story = StoryObj<typeof atr>;

export const basic: Story = {
    render: () => <ATRIndicator />,
};
