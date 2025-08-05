import type { Meta, StoryObj } from "@storybook/react";
import {
    lastVisibleItemBasedZoomAnchor,
    mouseBasedZoomAnchor,
    rightDomainBasedZoomAnchor,
} from "@react-stockcharts3/core";
import { ChartCanvas } from "../../../../core/src/ChartCanvas";
import Interaction from "./Interaction";

const meta: Meta<typeof ChartCanvas> = {
    component: ChartCanvas,
    title: "Features/Interaction",
};

export default meta;
type Story = StoryObj<typeof ChartCanvas>;

export const clamp: Story = {
    render: () => <Interaction clamp />,
};

export const disable: Story = {
    render: () => <Interaction disableInteraction />,
};

export const disablePan: Story = {
    render: () => <Interaction disablePan />,
};

export const disableZoom: Story = {
    render: () => <Interaction disableZoom />,
};

export const zoomAnchorToMouse: Story = {
    render: () => <Interaction zoomAnchor={mouseBasedZoomAnchor} />,
};

export const zoomAnchorToLastVisible: Story = {
    render: () => <Interaction zoomAnchor={lastVisibleItemBasedZoomAnchor} />,
};

export const zoomAnchorToBounds: Story = {
    render: () => <Interaction zoomAnchor={rightDomainBasedZoomAnchor} />,
};
