/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from "react";
import { format } from "d3-format";
import { timeFormat } from "d3-time-format";
import { ChartCanvas, Chart } from "@react-stockcharts3/core";
import { XAxis, YAxis } from "@react-stockcharts3/axes";
import { CandlestickSeries } from "@react-stockcharts3/series";
import { CrossHairCursor, MouseCoordinateX, MouseCoordinateY } from "@react-stockcharts3/coordinates";
import { discontinuousTimeScaleProvider } from "@react-stockcharts3/scales";
import { FibonacciRetracement, DrawingObjectSelector } from "@react-stockcharts3/interactive";
import { withSize, withDeviceRatio } from "@react-stockcharts3/utils";
import { IOHLCData, withOHLCData } from "../../data";

interface FibonacciChartProps {
    readonly data: IOHLCData[];
    readonly height: number;
    readonly width: number;
    readonly ratio: number;
}

interface FibonacciChartState {
    enableFibonacci: boolean;
    retracements: any[];
}

class FibonacciChart extends React.Component<FibonacciChartProps, FibonacciChartState> {
    private interactiveNodes: any = {};

    public constructor(props: FibonacciChartProps) {
        super(props);

        this.state = {
            enableFibonacci: false,
            retracements: [],
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
                this.setState({ enableFibonacci: false });
                break;
            case "delete":
            case "backspace":
                this.setState((prevState) => ({
                    retracements: Array.isArray(prevState.retracements)
                        ? prevState.retracements.filter((retracement) => !retracement.selected)
                        : [],
                }));
                break;
            case "f":
                this.setState({ enableFibonacci: true });
                break;
        }
    };

    private readonly onDrawComplete = (e: React.MouseEvent, newRetracements: any[], _moreProps: any) => {
        console.log("Fibonacci drawing completed:", newRetracements);
        this.setState({
            enableFibonacci: false,
            retracements: newRetracements,
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

    private readonly handleSelection = (e: React.MouseEvent, interactives: any[], moreProps: any) => {
        console.log("=== DrawingObjectSelector CALLED ===");
        console.log("Event:", e.type, e.target);
        console.log("Interactives received:", interactives);
        console.log("MoreProps:", moreProps);

        const newState = this.toObject(interactives, (each) => {
            console.log("Processing interactive:", each);
            const stateKey = each.chartId === 1 ? "retracements" : `${each.type.toLowerCase()}_${each.chartId}`;
            return [stateKey, each.objects || []];
        });

        console.log("New state to set:", newState);
        this.setState(newState);
        console.log("=== END DrawingObjectSelector ===");
    };

    public render() {
        const { data, height, width, ratio } = this.props;
        const { enableFibonacci, retracements } = this.state;

        const safeRetracements = Array.isArray(retracements) ? retracements : [];

        console.log("FibonacciChart render:", {
            enableFibonacci,
            retracements: safeRetracements.length,
            rawRetracements: retracements,
            selectorEnabled: !enableFibonacci,
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
                        onClick={() => this.setState({ enableFibonacci: true })}
                        style={{
                            backgroundColor: enableFibonacci ? "#007bff" : "#fff",
                            color: enableFibonacci ? "#fff" : "#000",
                            border: "1px solid #ccc",
                            padding: "8px 12px",
                            cursor: "pointer",
                        }}
                    >
                        Draw Fibonacci (F)
                    </button>
                    <button
                        onClick={() => this.setState({ enableFibonacci: false })}
                        style={{
                            backgroundColor: !enableFibonacci ? "#007bff" : "#fff",
                            color: !enableFibonacci ? "#fff" : "#000",
                            border: "1px solid #ccc",
                            padding: "8px 12px",
                            cursor: "pointer",
                        }}
                    >
                        Select Mode
                    </button>
                    <div style={{ marginLeft: "20px", color: "#666" }}>
                        Mode: {enableFibonacci ? "Drawing" : "Select"} | Retracements: {safeRetracements.length} | ESC:
                        Cancel | DEL: Delete Selected | Selector: {!enableFibonacci ? "ENABLED" : "DISABLED"}
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

                        <FibonacciRetracement
                            ref={this.saveInteractiveNodes("FibonacciRetracement", 1)}
                            enabled={enableFibonacci}
                            snap={false}
                            onStart={() => console.log("Fibonacci drawing started")}
                            onComplete={this.onDrawComplete}
                            retracements={safeRetracements}
                        />

                        <MouseCoordinateY displayFormat={format(".2f")} />
                        <MouseCoordinateX displayFormat={timeFormat("%Y-%m-%d")} />

                        <DrawingObjectSelector
                            enabled={!enableFibonacci}
                            getInteractiveNodes={this.getInteractiveNodes}
                            drawingObjectMap={{
                                FibonacciRetracement: "retracements",
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

export default withOHLCData()(withSize({ style: { minHeight: 600 } })(withDeviceRatio()(FibonacciChart)));
