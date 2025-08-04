import type { Meta, StoryObj } from "@storybook/react";
import { HoverTooltip } from "../../../../tooltip/src/HoverTooltip";
import Tooltips from "./Tooltips";

const meta: Meta<typeof HoverTooltip> = {
    title: "Features/Tooltips",
    component: HoverTooltip,
};

export default meta;
type Story = StoryObj<typeof HoverTooltip>;

export const hover: Story = {
    render: () => <Tooltips />,
};
