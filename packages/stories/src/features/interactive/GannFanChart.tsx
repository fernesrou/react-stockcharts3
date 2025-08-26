/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from "react";
import { format } from "d3-format";
import { timeFormat } from "d3-time-format";
import { ChartCanvas, Chart } from "@react-stockcharts3/core";
import { XAxis, YAxis } from "@react-stockcharts3/axes";
import { CandlestickSeries } from "@react-stockcharts3/series";
import { CrossHairCursor, MouseCoordinateX, MouseCoordinateY } from "@react-stockcharts3/coordinates";
import { discontinuousTimeScaleProvider } from "@react-stockcharts3/scales";
import { GannFan, DrawingObjectSelector } from "@react-stockcharts3/interactive";
import { withSize, withDeviceRatio } from "@react-stockcharts3/utils";
import { IOHLCData, withOHLCData } from "../../data";

interface GannFanChartProps {
    readonly data: IOHLCData[];
    readonly height: number;
    readonly width: number;
    readonly ratio: number;
}

interface GannFanChartState {
    enableGannFan: boolean;
    fans: any[];
}

class GannFanChart extends React.Component<GannFanChartProps, GannFanChartState> {
    private interactiveNodes: any = {};

    public constructor(props: GannFanChartProps) {
        super(props);

        this.state = {
            enableGannFan: false,
            fans: [],
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
                this.setState({ enableGannFan: false });
                break;
            case "delete":
            case "backspace":
                this.setState((prevState) => ({
                    fans: Array.isArray(prevState.fans) ? prevState.fans.filter((fan) => !fan.selected) : [],
                }));
                break;
            case "g":
                this.setState({ enableGannFan: true });
                break;
        }
    };

    private readonly onDrawComplete = (e: React.MouseEvent, newFans: any[], _moreProps: any) => {
        this.setState({
            enableGannFan: false,
            fans: newFans,
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
        const newState = this.toObject(interactives, (each) => {
            const stateKey = each.chartId === 1 ? "fans" : `${each.type.toLowerCase()}_${each.chartId}`;
            return [stateKey, each.objects || []];
        });

        this.setState(newState);
    };

    public render() {
        const { data, height, width, ratio } = this.props;
        const { enableGannFan, fans } = this.state;

        const safeFans = Array.isArray(fans) ? fans : [];

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
                        onClick={() => this.setState({ enableGannFan: true })}
                        style={{
                            backgroundColor: enableGannFan ? "#007bff" : "#fff",
                            color: enableGannFan ? "#fff" : "#000",
                            border: "1px solid #ccc",
                            padding: "8px 12px",
                            cursor: "pointer",
                        }}
                    >
                        Draw Gann Fan (G)
                    </button>
                    <button
                        onClick={() => this.setState({ enableGannFan: false })}
                        style={{
                            backgroundColor: !enableGannFan ? "#007bff" : "#fff",
                            color: !enableGannFan ? "#fff" : "#000",
                            border: "1px solid #ccc",
                            padding: "8px 12px",
                            cursor: "pointer",
                        }}
                    >
                        Select Mode
                    </button>
                    <div style={{ marginLeft: "20px", color: "#666" }}>
                        Mode: {enableGannFan ? "Drawing" : "Select"} | Gann Fans: {safeFans.length} | ESC: Cancel | DEL:
                        Delete Selected | Selector: {!enableGannFan ? "ENABLED" : "DISABLED"}
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

                        <GannFan
                            ref={this.saveInteractiveNodes("GannFan", 1)}
                            enabled={enableGannFan}
                            snap={false}
                            onStart={() => {
                                // GannFan drawing started
                            }}
                            onComplete={this.onDrawComplete}
                            fans={safeFans}
                        />

                        <MouseCoordinateY displayFormat={format(".2f")} />
                        <MouseCoordinateX displayFormat={timeFormat("%Y-%m-%d")} />

                        <DrawingObjectSelector
                            enabled={!enableGannFan}
                            getInteractiveNodes={this.getInteractiveNodes}
                            drawingObjectMap={{
                                GannFan: "fans",
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

export default withOHLCData()(withSize({ style: { minHeight: 600 } })(withDeviceRatio()(GannFanChart)));
