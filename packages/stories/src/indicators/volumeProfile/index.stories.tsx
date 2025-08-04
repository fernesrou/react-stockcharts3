import type { Meta, StoryObj } from "@storybook/react";
import { VolumeProfileSeries } from "../../../../series/src/VolumeProfileSeries";
import VolumeProfile from "./VolumeProfile";

const meta: Meta<typeof VolumeProfileSeries> = {
    title: "Visualization/Indicator/Volume Profile",
    component: VolumeProfileSeries,
};

export default meta;
type Story = StoryObj<typeof VolumeProfileSeries>;

export const basic: Story = {
    render: () => <VolumeProfile />,
};
