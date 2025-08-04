import type { Meta, StoryObj } from "@storybook/react";
import { BarSeries } from "../../../../series/src/BarSeries";
import { Daily, Intraday } from "./BasicBarSeries";

const meta: Meta<typeof BarSeries> = {
    component: BarSeries,
    title: "Visualization/Series/Bar",
    argTypes: {
        fillStyle: { control: "color" },
    },
};

export default meta;
type Story = StoryObj<typeof BarSeries>;

export const daily: Story = {
    render: (args) => <Daily {...args} />,
};

export const intraday: Story = {
    render: (args) => <Intraday {...args} />,
};
