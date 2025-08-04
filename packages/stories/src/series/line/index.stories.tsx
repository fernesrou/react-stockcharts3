import type { Meta, StoryObj } from "@storybook/react";
import { LineSeries } from "../../../../series/src/LineSeries";
import { Daily, Intraday } from "./BasicLineSeries";

const meta: Meta<typeof LineSeries> = {
    component: LineSeries,
    title: "Visualization/Series/Line",
    argTypes: {
        strokeStyle: { control: "color" },
    },
};

export default meta;
type Story = StoryObj<typeof LineSeries>;

export const daily: Story = {
    render: (args) => <Daily {...args} />,
};

export const intraday: Story = {
    render: (args) => <Intraday {...args} />,
};
