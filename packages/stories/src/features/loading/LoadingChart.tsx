import { scaleTime } from "d3-scale";
import * as React from "react";
import {
    CandlestickSeries,
    Chart,
    ChartCanvas,
    CrossHairCursor,
    timeFormat,
    withDeviceRatio,
    withSize,
    XAxis,
    YAxis,
} from "react-stockcharts3";
import { IOHLCData, withOHLCData } from "../../data";

interface ChartProps {
    readonly data: IOHLCData[];
    readonly height: number;
    readonly width: number;
    readonly ratio: number;
}

interface ChartState {
    data: IOHLCData[];
}

class LoadingChart extends React.Component<ChartProps, ChartState> {
    private readonly margin = { left: 0, right: 56, top: 0, bottom: 24 };
    private readonly padding = { left: 0, right: 32, top: 0, bottom: 0 };

    public constructor(props: ChartProps) {
        super(props);

        // Start with a subset of the data (middle section)
        const startIndex = Math.floor(props.data.length * 0.4);
        const endIndex = Math.floor(props.data.length * 0.6);

        this.state = {
            data: props.data.slice(startIndex, endIndex),
        };
    }

    public render() {
        const { height, ratio, width } = this.props;
        const { data } = this.state;

        const xScale = scaleTime();
        const xAccessor = (d: IOHLCData) => d.date;

        return (
            <ChartCanvas
                height={height}
                ratio={ratio}
                width={width}
                margin={this.margin}
                padding={this.padding}
                data={data}
                seriesName="Data"
                xScale={xScale}
                xAccessor={xAccessor}
                onLoadBefore={this.handleLoadBefore}
                onLoadAfter={this.handleLoadAfter}
            >
                <Chart id={1} yExtentsCalculator={this.yExtentsCalculator}>
                    <CandlestickSeries />
                    <XAxis tickFormat={timeFormat} />
                    <YAxis />
                </Chart>
                <CrossHairCursor snapX={false} />
            </ChartCanvas>
        );
    }

    private handleLoadBefore = (start: Date, end: Date) => {
        console.log("onLoadBefore triggered:", { start, end });

        const { data: fullData } = this.props;
        const { data: currentData } = this.state;

        // Find the earliest date in current data
        const earliestCurrent = currentData[0].date;

        // Find data points before the current earliest
        const newDataPoints = fullData.filter(
            d => d.date < earliestCurrent && d.date >= start
        );

        if (newDataPoints.length > 0) {
            // Simulate network delay
            setTimeout(() => {
                this.setState(prevState => ({
                    data: [...newDataPoints, ...prevState.data],
                }));
                console.log(`Loaded ${newDataPoints.length} earlier data points`);
            }, 500);
        }
    };

    private handleLoadAfter = (start: Date, end: Date) => {
        console.log("onLoadAfter triggered:", { start, end });

        const { data: fullData } = this.props;
        const { data: currentData } = this.state;

        // Find the latest date in current data
        const latestCurrent = currentData[currentData.length - 1].date;

        // Find data points after the current latest
        const newDataPoints = fullData.filter(
            d => d.date > latestCurrent && d.date <= end
        );

        if (newDataPoints.length > 0) {
            // Simulate network delay
            setTimeout(() => {
                this.setState(prevState => ({
                    data: [...prevState.data, ...newDataPoints],
                }));
                console.log(`Loaded ${newDataPoints.length} later data points`);
            }, 500);
        }
    };

    private readonly yExtentsCalculator = ({ plotData }: { plotData: IOHLCData[] }) => {
        let min: number | undefined;
        let max: number | undefined;
        for (const { low, high } of plotData) {
            if (min === undefined) {
                min = low;
            }
            if (max === undefined) {
                max = high;
            }

            if (low !== undefined) {
                if (min! > low) {
                    min = low;
                }
            }

            if (high !== undefined) {
                if (max! < high) {
                    max = high;
                }
            }
        }

        if (min === undefined) {
            min = 0;
        }

        if (max === undefined) {
            max = 0;
        }

        const padding = (max - min) * 0.1;

        return [min - padding, max + padding * 2];
    };
}

export const Loading = withOHLCData("DAILY")(
    withSize({ style: { minHeight: 600 } })(withDeviceRatio()(LoadingChart))
);
