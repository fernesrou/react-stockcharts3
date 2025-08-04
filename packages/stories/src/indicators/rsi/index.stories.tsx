import type { Meta, StoryObj } from "@storybook/react";
import { RSISeries } from "../../../../series/src/RSISeries";
import RSIIndicator from "./RsiIndicator";

const meta: Meta<typeof RSISeries> = {
    title: "Visualization/Indicator/RSI",
    component: RSISeries,
};

export default meta;
type Story = StoryObj<typeof RSISeries>;

export const basic: Story = {
    render: () => <RSIIndicator />,
};
