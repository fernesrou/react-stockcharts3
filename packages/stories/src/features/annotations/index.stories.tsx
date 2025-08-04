import type { Meta, StoryObj } from "@storybook/react";
import { Label } from "../../../../annotations/src/Label";
import Annotations from "./Annotations";

const meta: Meta<typeof Label> = {
    component: Label,
    title: "Features/Annotations",
    argTypes: {
        fillStyle: { control: "color" },
        text: {
            control: {
                type: "text",
            },
        },
    },
};

export default meta;
type Story = StoryObj<typeof Label>;

export const background: Story = {
    render: (args) => <Annotations {...args} />,
};
