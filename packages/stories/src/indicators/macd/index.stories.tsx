import type { Meta, StoryObj } from "@storybook/react";
import { MACDSeries } from "../../../../series/src/MACDSeries";
import MACDIndicator from "./MacdIndicator";

const meta: Meta<typeof MACDSeries> = {
    title: "Visualization/Indicator/MACD",
    component: MACDSeries,
};

export default meta;
type Story = StoryObj<typeof MACDSeries>;

export const basic: Story = {
    render: () => <MACDIndicator />,
};
