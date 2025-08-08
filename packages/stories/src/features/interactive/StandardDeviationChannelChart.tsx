/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from "react";
import { format } from "d3-format";
import { timeFormat } from "d3-time-format";
import { ChartCanvas, Chart } from "@react-stockcharts3/core";
import { XAxis, YAxis } from "@react-stockcharts3/axes";
import { CandlestickSeries } from "@react-stockcharts3/series";
import { CrossHairCursor, MouseCoordinateX, MouseCoordinateY } from "@react-stockcharts3/coordinates";
import { discontinuousTimeScaleProvider } from "@react-stockcharts3/scales";
import { StandardDeviationChannel, DrawingObjectSelector } from "@react-stockcharts3/interactive";
import { withSize, withDeviceRatio } from "@react-stockcharts3/utils";
import { IOHLCData, withOHLCData } from "../../data";

interface StandardDeviationChannelChartProps {
    readonly data: IOHLCData[];
    readonly height: number;
    readonly width: number;
    readonly ratio: number;
}

interface StandardDeviationChannelChartState {
    enableStdDevChannel: boolean;
    stdDevChannels: any[];
}

class StandardDeviationChannelChart extends React.Component<
    StandardDeviationChannelChartProps,
    StandardDeviationChannelChartState
> {
    private interactiveNodes: any = {};

    public constructor(props: StandardDeviationChannelChartProps) {
        super(props);

        this.state = {
            enableStdDevChannel: false,
            stdDevChannels: [],
        };

        this.saveInteractiveNodes = this.saveInteractiveNodes.bind(this);
        this.getInteractiveNodes = this.getInteractiveNodes.bind(this);
    }

    private saveInteractiveNodes(type: string, chartId: number) {
        return (node: any) => {
            if (!this.interactiveNodes) {
                this.interactiveNodes = {};
            }
            const key = `${type}_${chartId}`;
            if (node || this.interactiveNodes[key]) {
                this.interactiveNodes = {
                    ...this.interactiveNodes,
                    [key]: { type, chartId, node },
                };
            }
        };
    }

    private getInteractiveNodes() {
        console.log("getInteractiveNodes called:", this.interactiveNodes);
        return this.interactiveNodes;
    }

    public componentDidMount() {
        document.addEventListener("keydown", this.onKeyPress);
    }

    public componentWillUnmount() {
        document.removeEventListener("keydown", this.onKeyPress);
    }

    private readonly onKeyPress = (e: KeyboardEvent) => {
        switch (e.key.toLowerCase()) {
            case "escape":
                this.setState({ enableStdDevChannel: false });
                break;
            case "delete":
            case "backspace":
                this.setState((prevState) => ({
                    stdDevChannels: Array.isArray(prevState.stdDevChannels)
                        ? prevState.stdDevChannels.filter((channel) => !channel.selected)
                        : [],
                }));
                break;
            case "s":
                this.setState({ enableStdDevChannel: true });
                break;
        }
    };

    private readonly onDrawComplete = (e: React.MouseEvent, newStdDevChannels: any[], _moreProps: any) => {
        console.log("StandardDeviationChannel drawing completed:", newStdDevChannels);
        this.setState({
            enableStdDevChannel: false,
            stdDevChannels: newStdDevChannels,
        });
    };

    private toObject(interactives: any[], keyMapper: (each: any) => [string, any]) {
        const obj: any = {};
        interactives.forEach((each) => {
            const [key, value] = keyMapper(each);
            obj[key] = value;
        });
        return obj;
    }

    private readonly handleSelection = (e: React.MouseEvent, interactives: any[], _moreProps: any) => {
        console.log("=== DrawingObjectSelector CALLED (StandardDeviationChannel) ===");
        console.log("Event:", e.type, e.target);
        console.log("Interactives received:", interactives);

        const newState = this.toObject(interactives, (each) => {
            console.log("Processing interactive:", each);
            const stateKey = each.chartId === 1 ? "stdDevChannels" : `${each.type.toLowerCase()}_${each.chartId}`;
            return [stateKey, each.objects || []];
        });

        console.log("New state to set:", newState);
        this.setState(newState);
        console.log("=== END DrawingObjectSelector (StandardDeviationChannel) ===");
    };

    public render() {
        const { data, height, width, ratio } = this.props;
        const { enableStdDevChannel, stdDevChannels } = this.state;

        const safeStdDevChannels = Array.isArray(stdDevChannels) ? stdDevChannels : [];

        console.log("StandardDeviationChannelChart render:", {
            enableStdDevChannel,
            stdDevChannels: safeStdDevChannels.length,
            rawStdDevChannels: stdDevChannels,
            selectorEnabled: !enableStdDevChannel,
            interactiveNodes: this.interactiveNodes,
        });

        const xScaleProvider = discontinuousTimeScaleProvider.inputDateAccessor((d: IOHLCData) => d.date);
        const { data: chartData, xScale, xAccessor, displayXAccessor } = xScaleProvider(data);

        const start = xAccessor(chartData[chartData.length - 200]);
        const end = xAccessor(chartData[chartData.length - 1]);
        const xExtents = [start, end];

        return (
            <div>
                {/* Toolbar */}
                <div
                    style={{
                        padding: "10px",
                        borderBottom: "1px solid #ccc",
                        backgroundColor: "#f5f5f5",
                        display: "flex",
                        gap: "10px",
                        alignItems: "center",
                    }}
                >
                    <button
                        onClick={() => this.setState({ enableStdDevChannel: true })}
                        style={{
                            backgroundColor: enableStdDevChannel ? "#007bff" : "#fff",
                            color: enableStdDevChannel ? "#fff" : "#000",
                            border: "1px solid #ccc",
                            padding: "8px 12px",
                            cursor: "pointer",
                        }}
                    >
                        Draw Std Dev Channel (S)
                    </button>
                    <button
                        onClick={() => this.setState({ enableStdDevChannel: false })}
                        style={{
                            backgroundColor: !enableStdDevChannel ? "#007bff" : "#fff",
                            color: !enableStdDevChannel ? "#fff" : "#000",
                            border: "1px solid #ccc",
                            padding: "8px 12px",
                            cursor: "pointer",
                        }}
                    >
                        Select Mode
                    </button>
                    <div style={{ marginLeft: "20px", color: "#666" }}>
                        Mode: {enableStdDevChannel ? "Drawing" : "Select"} | Std Dev Channels:{" "}
                        {safeStdDevChannels.length} | ESC: Cancel | DEL: Delete Selected | Selector:{" "}
                        {!enableStdDevChannel ? "ENABLED" : "DISABLED"}
                    </div>
                </div>

                <ChartCanvas
                    height={height}
                    width={width}
                    ratio={ratio}
                    margin={{ left: 70, right: 70, top: 20, bottom: 30 }}
                    data={chartData}
                    displayXAccessor={displayXAccessor}
                    seriesName="Data"
                    xScale={xScale}
                    xAccessor={xAccessor}
                    xExtents={xExtents}
                >
                    <Chart id={1} yExtents={(d: IOHLCData) => [d.high, d.low]}>
                        <XAxis />
                        <YAxis />
                        <CandlestickSeries />

                        <StandardDeviationChannel
                            ref={this.saveInteractiveNodes("StandardDeviationChannel", 1)}
                            enabled={enableStdDevChannel}
                            snap={false}
                            onStart={() => console.log("StandardDeviationChannel drawing started")}
                            onComplete={this.onDrawComplete}
                            channels={safeStdDevChannels}
                        />

                        <MouseCoordinateY displayFormat={format(".2f")} />
                        <MouseCoordinateX displayFormat={timeFormat("%Y-%m-%d")} />

                        <DrawingObjectSelector
                            enabled={!enableStdDevChannel}
                            getInteractiveNodes={this.getInteractiveNodes}
                            drawingObjectMap={{
                                StandardDeviationChannel: "channels",
                            }}
                            onSelect={this.handleSelection}
                        />
                    </Chart>

                    <CrossHairCursor />
                </ChartCanvas>
            </div>
        );
    }
}

export default withOHLCData()(
    withSize({ style: { minHeight: 600 } })(withDeviceRatio()(StandardDeviationChannelChart)),
);
