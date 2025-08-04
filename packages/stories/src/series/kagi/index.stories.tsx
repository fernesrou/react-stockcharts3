import type { Meta, StoryObj } from "@storybook/react";
import { KagiSeries } from "../../../../series/src/KagiSeries";
import { Daily, Intraday } from "./BasicKagiSeries";

const meta: Meta<typeof KagiSeries> = {
    component: KagiSeries,
    title: "Visualization/Series/Kagi",
};

export default meta;
type Story = StoryObj<typeof KagiSeries>;

export const daily: Story = {
    render: () => <Daily />,
};

export const intraday: Story = {
    render: () => <Intraday />,
};
