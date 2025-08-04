import type { Meta, StoryObj } from "@storybook/react";
import { Updating } from "./BasicLineSeries";

const meta: Meta<typeof Updating> = {
    title: "Features/Updating",
    component: Updating,
};

export default meta;
type Story = StoryObj<typeof Updating>;

export const continuous: Story = {
    render: () => <Updating />,
};
