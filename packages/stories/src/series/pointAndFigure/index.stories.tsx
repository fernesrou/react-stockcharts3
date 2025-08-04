import type { Meta, StoryObj } from "@storybook/react";
import { PointAndFigureSeries } from "../../../../series/src/PointAndFigureSeries";
import { Daily } from "./BasicPointAndFigureSeries";

const meta: Meta<typeof PointAndFigureSeries> = {
    component: PointAndFigureSeries,
    title: "Visualization/Series/Point & Figure",
};

export default meta;
type Story = StoryObj<typeof PointAndFigureSeries>;

export const daily: Story = {
    render: () => <Daily />,
};
