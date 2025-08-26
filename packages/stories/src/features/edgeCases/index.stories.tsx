import type { Meta, StoryObj } from "@storybook/react";
import React, { useEffect, useState } from "react";
import BasicLineSeries from "./BasicLineSeries";

const meta: Meta<typeof BasicLineSeries> = {
    title: "Features/EdgeCases",
    component: BasicLineSeries,
};

export default meta;
type Story = StoryObj<typeof BasicLineSeries>;

export const noData: Story = {
    render: () => <BasicLineSeries data={[]} />,
};

export const singleDataPoint: Story = {
    render: () => (
        <BasicLineSeries data={[{ close: 120, open: 120, high: 140, low: 100, date: new Date(), volume: 1_000_000 }]} />
    ),
};

export const twoDataPoint: Story = {
    render: () => (
        <BasicLineSeries
            data={[
                {
                    close: 120,
                    open: 120,
                    high: 140,
                    low: 100,
                    date: new Date(2020, 7, 8, 10, 0, 0, 0),
                    volume: 1_000_000,
                },
                {
                    close: 140,
                    open: 120,
                    high: 140,
                    low: 100,
                    date: new Date(2020, 7, 8, 10, 1, 0, 0),
                    volume: 1_000_000,
                },
            ]}
        />
    ),
};

export const threeDataPoint: Story = {
    render: () => (
        <BasicLineSeries
            data={[
                {
                    close: 120,
                    open: 120,
                    high: 140,
                    low: 100,
                    date: new Date(2020, 7, 8, 10, 0, 0, 0),
                    volume: 1_000_000,
                },
                {
                    close: 140,
                    open: 120,
                    high: 150,
                    low: 100,
                    date: new Date(2020, 7, 8, 10, 1, 0, 0),
                    volume: 1_000_000,
                },
                {
                    close: 120,
                    open: 120,
                    high: 140,
                    low: 100,
                    date: new Date(2020, 7, 8, 10, 2, 0, 0),
                    volume: 1_000_000,
                },
            ]}
        />
    ),
};

export const emptyThenThreeAsync: Story = {
    render: () => {
        const [data, setData] = useState<any[]>([]);
        useEffect(() => {
            const timeout = setTimeout(() => {
                setData([
                    {
                        close: 120,
                        open: 120,
                        high: 140,
                        low: 100,
                        date: new Date(2020, 7, 8, 10, 0, 0, 0),
                        volume: 1_000_000,
                    },
                    {
                        close: 140,
                        open: 120,
                        high: 150,
                        low: 100,
                        date: new Date(2020, 7, 8, 10, 1, 0, 0),
                        volume: 1_000_000,
                    },
                    {
                        close: 120,
                        open: 120,
                        high: 140,
                        low: 100,
                        date: new Date(2020, 7, 8, 10, 2, 0, 0),
                        volume: 1_000_000,
                    },
                ]);
            }, 1000);
            return () => clearTimeout(timeout);
        }, []);
        return <BasicLineSeries data={data} />;
    },
};
