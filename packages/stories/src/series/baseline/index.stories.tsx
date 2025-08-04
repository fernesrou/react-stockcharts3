import type { Meta, StoryObj } from "@storybook/react";
import {
    AlternatingFillAreaSeries,
} from "../../../../series/src/AlternatingFillAreaSeries";
import { Daily, Intraday } from "./BasicBaselineSeries";

const meta: Meta<typeof AlternatingFillAreaSeries> = {
    component: AlternatingFillAreaSeries,
    title: "Visualization/Series/Baseline",
    args: {
        fillStyle: undefined,
        strokeStyle: undefined,
    },
    argTypes: {
        baseAt: { control: "number" },
        fillStyle: { control: "object" },
        strokeStyle: { control: "object" },
    },
};

export default meta;
type Story = StoryObj<typeof AlternatingFillAreaSeries>;

export const daily: Story = {
    render: (args) => <Daily {...args} />,
};

export const intraday: Story = {
    render: (args) => <Intraday {...args} />,
};
