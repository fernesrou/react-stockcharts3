import type { Meta, StoryObj } from "@storybook/react";
import { Annotate } from "@react-financial-charts/annotations";
import Annotated from "./Annotated";

const meta: Meta<typeof Annotate> = {
    component: Annotate,
    title: "Features/Annotate",
};

export default meta;
type Story = StoryObj<typeof Annotate>;

export const labels: Story = {
    render: () => <Annotated labelAnnotation />,
};

export const paths: Story = {
    render: () => <Annotated svgAnnotation />,
};
