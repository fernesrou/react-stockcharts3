import type { Meta, StoryObj } from "@storybook/react";
import { scaleLog, scaleUtc } from "d3-scale";
import { Daily } from "./Scales";

const meta: Meta<typeof Daily> = {
    title: "Features/Scales",
    component: Daily,
};

export default meta;
type Story = StoryObj<typeof Daily>;

export const continuousScale: Story = {
    render: () => <Daily />,
};

export const utcScale: Story = {
    render: () => <Daily xScale={scaleUtc()} />,
};

export const logScale: Story = {
    render: () => <Daily yScale={scaleLog()} />,
};
