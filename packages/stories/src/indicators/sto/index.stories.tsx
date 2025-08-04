import type { Meta, StoryObj } from "@storybook/react";
import { StochasticSeries } from "../../../../series/src/StochasticSeries";
import StoIndicator from "./StoIndicator";

const meta: Meta<typeof StochasticSeries> = {
    title: "Visualization/Indicator/Stochastic Oscillator",
    component: StochasticSeries,
};

export default meta;
type Story = StoryObj<typeof StochasticSeries>;

export const basic: Story = {
    render: () => <StoIndicator />,
};
