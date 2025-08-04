import type { Meta, StoryObj } from "@storybook/react";
import { YAxis } from "../../../../axes/src/YAxis";
import AxisExample from "./Axis";

const meta: Meta<typeof YAxis> = {
    component: YAxis,
    title: "Features/Axis",
    argTypes: {
        axisAt: {
            control: {
                type: "select",
                options: ["left", "right", "middle"],
            },
        },
        gridLinesStrokeStyle: { control: "color" },
        strokeStyle: { control: "color" },
        tickLabelFill: { control: "color" },
        tickStrokeStyle: { control: "color" },
    },
};

export default meta;
type Story = StoryObj<typeof YAxis>;

export const yAxis: Story = {
    render: (args) => <AxisExample {...args} />,
};
