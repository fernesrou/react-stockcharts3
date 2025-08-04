import type { Meta, StoryObj } from "@storybook/react";
import CompareIndicator from "./CompareIndicator";

const meta: Meta<typeof CompareIndicator> = {
    title: "Visualization/Indicator/Compare",
    component: CompareIndicator,
};

export default meta;
type Story = StoryObj<typeof CompareIndicator>;

export const basic: Story = {
    render: () => <CompareIndicator />,
};
