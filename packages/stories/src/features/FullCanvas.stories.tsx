import type { Meta, StoryObj } from "@storybook/react";
import StockChart, { MinutesStockChart, SecondsStockChart } from "./StockChart";

const meta: Meta<typeof StockChart> = {
    component: StockChart,
    title: "Features/Full Screen",
};

export default meta;
type Story = StoryObj<typeof StockChart>;

export const daily: Story = {
    render: () => <StockChart />,
};

export const minutes: Story = {
    render: () => <MinutesStockChart dateTimeFormat="%H:%M" />,
};

export const seconds: Story = {
    render: () => <SecondsStockChart dateTimeFormat="%H:%M:%S" />,
};
