/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from "react";
import { format } from "d3-format";
import { timeFormat } from "d3-time-format";
import { ChartCanvas, Chart } from "@react-stockcharts3/core";
import { XAxis, YAxis } from "@react-stockcharts3/axes";
import { CandlestickSeries } from "@react-stockcharts3/series";
import { CrossHairCursor, MouseCoordinateX, MouseCoordinateY } from "@react-stockcharts3/coordinates";
import { discontinuousTimeScaleProvider } from "@react-stockcharts3/scales";
import { EquidistantChannel, DrawingObjectSelector } from "@react-stockcharts3/interactive";
import { withSize, withDeviceRatio } from "@react-stockcharts3/utils";
import { IOHLCData, withOHLCData } from "../../data";

interface ChannelChartProps {
    readonly data: IOHLCData[];
    readonly height: number;
    readonly width: number;
    readonly ratio: number;
}

interface ChannelChartState {
    enableChannel: boolean;
    channels: any[];
}

class ChannelChart extends React.Component<ChannelChartProps, ChannelChartState> {
    private interactiveNodes: any = {};

    public constructor(props: ChannelChartProps) {
        super(props);

        this.state = {
            enableChannel: false,
            channels: [],
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
                this.setState({ enableChannel: false });
                break;
            case "delete":
            case "backspace":
                this.setState((prevState) => ({
                    channels: Array.isArray(prevState.channels)
                        ? prevState.channels.filter((channel) => !channel.selected)
                        : [],
                }));
                break;
            case "c":
                this.setState({ enableChannel: true });
                break;
        }
    };

    private readonly onDrawComplete = (e: React.MouseEvent, newChannels: any[], _moreProps: any) => {
        console.log("Channel drawing completed:", newChannels);
        this.setState({
            enableChannel: false,
            channels: newChannels,
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
        console.log("=== DrawingObjectSelector CALLED (Channel) ===");
        console.log("Event:", e.type, e.target);
        console.log("Interactives received:", interactives);

        // Debug específico para EquidistantChannel
        interactives.forEach((interactive, idx) => {
            console.log(`Interactive ${idx}:`, {
                type: interactive.type,
                chartId: interactive.chartId,
                objects: interactive.objects,
                objectsLength: interactive.objects?.length,
            });

            if (interactive.objects) {
                interactive.objects.forEach((obj, objIdx) => {
                    console.log(`  Object ${objIdx}:`, {
                        selected: obj.selected,
                        keys: Object.keys(obj),
                    });
                });
            }
        });

        const newState = this.toObject(interactives, (each) => {
            console.log("Processing interactive:", each);
            const stateKey = each.chartId === 1 ? "channels" : `${each.type.toLowerCase()}_${each.chartId}`;
            return [stateKey, each.objects || []];
        });

        console.log("New state to set:", newState);
        this.setState(newState);
        console.log("=== END DrawingObjectSelector (Channel) ===");
    };

    public render() {
        const { data, height, width, ratio } = this.props;
        const { enableChannel, channels } = this.state;

        const safeChannels = Array.isArray(channels) ? channels : [];

        console.log("ChannelChart render:", {
            enableChannel,
            channels: safeChannels.length,
            rawChannels: channels,
            selectorEnabled: !enableChannel,
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
                        onClick={() => this.setState({ enableChannel: true })}
                        style={{
                            backgroundColor: enableChannel ? "#007bff" : "#fff",
                            color: enableChannel ? "#fff" : "#000",
                            border: "1px solid #ccc",
                            padding: "8px 12px",
                            cursor: "pointer",
                        }}
                    >
                        Draw Channel (C)
                    </button>
                    <button
                        onClick={() => this.setState({ enableChannel: false })}
                        style={{
                            backgroundColor: !enableChannel ? "#007bff" : "#fff",
                            color: !enableChannel ? "#fff" : "#000",
                            border: "1px solid #ccc",
                            padding: "8px 12px",
                            cursor: "pointer",
                        }}
                    >
                        Select Mode
                    </button>
                    <div style={{ marginLeft: "20px", color: "#666" }}>
                        Mode: {enableChannel ? "Drawing" : "Select"} | Channels: {safeChannels.length} | ESC: Cancel |
                        DEL: Delete Selected | Selector: {!enableChannel ? "ENABLED" : "DISABLED"}
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

                        <EquidistantChannel
                            ref={this.saveInteractiveNodes("EquidistantChannel", 1)}
                            enabled={enableChannel}
                            snap={false}
                            onStart={() => console.log("Channel drawing started")}
                            onComplete={this.onDrawComplete}
                            channels={safeChannels}
                        />

                        <MouseCoordinateY displayFormat={format(".2f")} />
                        <MouseCoordinateX displayFormat={timeFormat("%Y-%m-%d")} />

                        <DrawingObjectSelector
                            enabled={!enableChannel}
                            getInteractiveNodes={this.getInteractiveNodes}
                            drawingObjectMap={{
                                EquidistantChannel: "channels",
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

export default withOHLCData()(withSize({ style: { minHeight: 600 } })(withDeviceRatio()(ChannelChart)));
