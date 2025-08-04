import type { Meta, StoryObj } from "@storybook/react";
import { SARSeries } from "../../../../series/src/SARSeries";
import SARIndicator from "./SarIndicator";

const meta: Meta<typeof SARSeries> = {
    title: "Visualization/Indicator/SAR",
    component: SARSeries,
};

export default meta;
type Story = StoryObj<typeof SARSeries>;

export const basic: Story = {
    render: () => <SARIndicator />,
};
