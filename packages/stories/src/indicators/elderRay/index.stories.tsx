import type { Meta, StoryObj } from "@storybook/react";
import { ElderRaySeries } from "../../../../series/src/ElderRaySeries";
import ElderRayIndicator from "./ElderRayIndicator";

const meta: Meta<typeof ElderRaySeries> = {
    title: "Visualization/Indicator/Elder Ray",
    component: ElderRaySeries,
};

export default meta;
type Story = StoryObj<typeof ElderRaySeries>;

export const basic: Story = {
    render: () => <ElderRayIndicator />,
};
