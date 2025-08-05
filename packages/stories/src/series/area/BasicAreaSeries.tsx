import * as React from "react";
import { Chart, ChartCanvas } from "@react-stockcharts3/core";
import { XAxis, YAxis } from "@react-stockcharts3/axes";
import { discontinuousTimeScaleProviderBuilder } from "@react-stockcharts3/scales";
import { AreaSeries, AreaSeriesProps } from "@react-stockcharts3/series";
import { withDeviceRatio, withSize } from "@react-stockcharts3/utils";
import { IOHLCData, withOHLCData } from "../../data";

interface ChartProps extends Partial<AreaSeriesProps> {
    readonly data: IOHLCData[];
    readonly height: number;
    readonly ratio: number;
    readonly width: number;
}

class BasicAreaSeries extends React.Component<ChartProps> {
    private readonly margin = { left: 0, right: 40, top: 24, bottom: 24 };
    private readonly xScaleProvider = discontinuousTimeScaleProviderBuilder().inputDateAccessor(
        (d: IOHLCData) => d.date,
    );

    public render() {
        const { data: initialData, height, ratio, width, ...rest } = this.props;

        const { data, xScale, xAccessor, displayXAccessor } = this.xScaleProvider(initialData);

        const max = xAccessor(data[data.length - 1]);
        const min = xAccessor(data[Math.max(0, data.length - 100)]);
        const xExtents = [min, max];

        return (
            <ChartCanvas
                height={height}
                ratio={ratio}
                width={width}
                margin={this.margin}
                data={data}
                displayXAccessor={displayXAccessor}
                seriesName="Data"
                xScale={xScale}
                xAccessor={xAccessor}
                xExtents={xExtents}
            >
                <Chart id={1} yExtents={this.yExtents}>
                    <AreaSeries yAccessor={this.yAccessor} {...rest} />
                    <XAxis />
                    <YAxis />
                </Chart>
            </ChartCanvas>
        );
    }

    private readonly yAccessor = (data: IOHLCData) => {
        return data.close;
    };

    private readonly yExtents = (data: IOHLCData) => {
        return [data.high, data.low];
    };
}

export const Daily = withOHLCData()(withSize({ style: { minHeight: 600 } })(withDeviceRatio()(BasicAreaSeries)));

export const Intraday = withOHLCData("MINUTES")(
    withSize({ style: { minHeight: 600 } })(withDeviceRatio()(BasicAreaSeries)),
);
