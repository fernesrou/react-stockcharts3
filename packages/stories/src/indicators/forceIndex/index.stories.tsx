import type { Meta, StoryObj } from "@storybook/react";
import { forceIndex } from "@react-stockcharts3/indicators";
import ForceIndicator from "./ForceIndicator";

const meta: Meta<typeof forceIndex> = {
    title: "Visualization/Indicator/Force Index",
    component: forceIndex,
    parameters: {
        componentSubtitle: `The Force Index is an indicator that uses price
        and volume to assess the power behind a move or identify possible
        turning points.`,
    },
};

export default meta;
type Story = StoryObj<typeof forceIndex>;

export const basic: Story = {
    render: () => <ForceIndicator />,
};
