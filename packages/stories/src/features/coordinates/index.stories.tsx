import type { Meta, StoryObj } from "@storybook/react";
import { MouseCoordinateY } from "@react-financial-charts/coordinates";
import Coordinates from "./Coordinates";

const meta: Meta<typeof MouseCoordinateY> = {
    component: MouseCoordinateY,
    title: "Features/Coordinates",
};

export default meta;
type Story = StoryObj<typeof MouseCoordinateY>;

export const edge: Story = {
    render: () => <Coordinates />,
};

export const arrows: Story = {
    render: () => <Coordinates arrowWidth={10} />,
};
