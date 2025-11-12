import * as React from "react";
import {
    CandlestickSeries,
    Chart,
    ChartCanvas,
    CrossHairCursor,
    discontinuousTimeScaleProviderBuilder,
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
    xScale: any;
    xAccessor: any;
    displayXAccessor: any;
}

class LoadingChartDiscontinuous extends React.Component<ChartProps, ChartState> {
    private readonly margin = { left: 0, right: 56, top: 0, bottom: 24 };
    private readonly padding = { left: 0, right: 32, top: 0, bottom: 0 };

    // Track the cumulative offset for prepended data
    private cumulativeOffset = 0;

    // Store the full dataset
    private fullData: IOHLCData[];

    public constructor(props: ChartProps) {
        super(props);

        // Start with a subset of the data (middle section)
        const startIndex = Math.floor(props.data.length * 0.4);
        const endIndex = Math.floor(props.data.length * 0.6);

        this.fullData = props.data;
        const initialData = props.data.slice(startIndex, endIndex);

        // Initialize scale provider
        const xScaleProvider = discontinuousTimeScaleProviderBuilder()
            .inputDateAccessor((d: IOHLCData) => d.date)
            .initialIndex(0);

        const { data, xScale, xAccessor, displayXAccessor } = xScaleProvider(initialData);

        this.state = {
            data,
            xScale,
            xAccessor,
            displayXAccessor,
        };
    }

    public render() {
        const { height, ratio, width } = this.props;
        const { data, xScale, xAccessor, displayXAccessor } = this.state;

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
                displayXAccessor={displayXAccessor}
                onLoadBefore={this.handleLoadBefore}
                onLoadAfter={this.handleLoadAfter}
            >
                <Chart id={1} yExtentsCalculator={this.yExtentsCalculator}>
                    <CandlestickSeries />
                    <XAxis />
                    <YAxis />
                </Chart>
                <CrossHairCursor snapX={false} />
            </ChartCanvas>
        );
    }

    private handleLoadBefore = (start: number, end: number) => {
        console.log("onLoadBefore triggered:", { start, end });

        // Get current data from state
        const currentData = this.state.data;
        const earliestCurrent = currentData[0].date;

        // Find all data points before the current earliest
        const candidatePoints = this.fullData.filter(d => d.date < earliestCurrent);

        if (candidatePoints.length === 0) {
            console.log("No more data to load before");
            return;
        }

        // Load the most recent 50 points before current data
        const chunkSize = Math.min(50, candidatePoints.length);
        const newDataPoints = candidatePoints.slice(-chunkSize);

        console.log(`Loading ${newDataPoints.length} earlier data points`);
        console.log(`Offset before: ${this.cumulativeOffset} → after: ${this.cumulativeOffset - newDataPoints.length}`);

        // UPDATE OFFSET FIRST (critical for preserving viewport!)
        this.cumulativeOffset -= newDataPoints.length;

        // Merge new data with current
        const mergedData = [...newDataPoints, ...currentData];

        // Recalculate scale with new initialIndex
        const xScaleProvider = discontinuousTimeScaleProviderBuilder()
            .inputDateAccessor((d: IOHLCData) => d.date)
            .initialIndex(this.cumulativeOffset);

        const { data, xScale, xAccessor, displayXAccessor } = xScaleProvider(mergedData);

        // Update state - ChartCanvas will handle this via getDerivedStateFromProps
        this.setState({
            data,
            xScale,
            xAccessor,
            displayXAccessor,
        });
    };

    private handleLoadAfter = (start: number, end: number) => {
        console.log("onLoadAfter triggered:", { start, end });

        // Get current data from state
        const currentData = this.state.data;
        const latestCurrent = currentData[currentData.length - 1].date;

        // Find all data points after the current latest
        const candidatePoints = this.fullData.filter(d => d.date > latestCurrent);

        if (candidatePoints.length === 0) {
            console.log("No more data to load after");
            return;
        }

        // Load the first 50 points after current data
        const chunkSize = Math.min(50, candidatePoints.length);
        const newDataPoints = candidatePoints.slice(0, chunkSize);

        console.log(`Loading ${newDataPoints.length} later data points`);

        // Merge current data with new (NO offset change for appending)
        const mergedData = [...currentData, ...newDataPoints];

        // Recalculate scale with same initialIndex
        const xScaleProvider = discontinuousTimeScaleProviderBuilder()
            .inputDateAccessor((d: IOHLCData) => d.date)
            .initialIndex(this.cumulativeOffset);

        const { data, xScale, xAccessor, displayXAccessor } = xScaleProvider(mergedData);

        // Update state - ChartCanvas will handle this via getDerivedStateFromProps
        this.setState({
            data,
            xScale,
            xAccessor,
            displayXAccessor,
        });
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

export const LoadingDiscontinuous = withOHLCData("DAILY")(
    withSize({ style: { minHeight: 600 } })(withDeviceRatio()(LoadingChartDiscontinuous))
);
