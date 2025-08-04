import type { Meta, StoryObj } from "@storybook/react";
import { AreaSeries } from "../../../../series/src/AreaSeries";
import { Daily, Intraday } from "./BasicAreaSeries";

const meta: Meta<typeof AreaSeries> = {
    title: "Visualization/Series/Area",
    component: AreaSeries,
    argTypes: {
        fillStyle: { control: "color" },
        strokeStyle: { control: "color" },
    },
};

export default meta;
type Story = StoryObj<typeof AreaSeries>;

export const daily: Story = {
    render: (args) => <Daily {...args} />,
};

export const intraday: Story = {
    render: (args) => <Intraday {...args} />,
};
