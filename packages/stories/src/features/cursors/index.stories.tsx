import type { Meta, StoryObj } from "@storybook/react";
import { Cursor } from "../../../../coordinates/src/Cursor";
import Cursors from "./Cursors";

const meta: Meta<typeof Cursor> = {
    component: Cursor,
    title: "Features/Cursors",
    argTypes: {
        strokeStyle: { control: "color" },
        xCursorShapeFillStyle: { control: "color" },
        xCursorShapeStrokeStyle: { control: "color" },
    },
};

export default meta;
type Story = StoryObj<typeof Cursor>;

export const cursor: Story = {
    render: (args) => <Cursors {...args} />,
};

export const crosshair: Story = {
    render: () => <Cursors crosshair />,
};
