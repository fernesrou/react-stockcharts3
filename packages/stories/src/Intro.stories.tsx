import type { Meta, StoryObj } from "@storybook/react";
import StockChart from "./features/StockChart";

const meta: Meta<typeof StockChart> = {
    title: "Intro",
    component: StockChart,
    parameters: {
        docs: {
            page: null, // This will use the MDX file
        },
    },
};

export default meta;
type Story = StoryObj<typeof StockChart>;

export const Default: Story = {};
