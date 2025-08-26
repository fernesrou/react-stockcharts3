/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from "react";
import { format } from "d3-format";
import { timeFormat } from "d3-time-format";
import { ChartCanvas, Chart } from "@react-stockcharts3/core";
import { XAxis, YAxis } from "@react-stockcharts3/axes";
import { CandlestickSeries } from "@react-stockcharts3/series";
import { CrossHairCursor, MouseCoordinateX, MouseCoordinateY } from "@react-stockcharts3/coordinates";
import { discontinuousTimeScaleProvider } from "@react-stockcharts3/scales";
import { InteractiveText, DrawingObjectSelector } from "@react-stockcharts3/interactive";
import { withSize, withDeviceRatio } from "@react-stockcharts3/utils";
import { IOHLCData, withOHLCData } from "../../data";

interface InteractiveTextChartProps {
    readonly data: IOHLCData[];
    readonly height: number;
    readonly width: number;
    readonly ratio: number;
}

interface InteractiveTextChartState {
    enableText: boolean;
    textElements: any[];
    showModal: boolean;
    editingIndex: number | null;
    editingText: string;
}

class InteractiveTextChart extends React.Component<InteractiveTextChartProps, InteractiveTextChartState> {
    private interactiveNodes: any = {};

    public constructor(props: InteractiveTextChartProps) {
        super(props);

        this.state = {
            enableText: false,
            textElements: [],
            showModal: false,
            editingIndex: null,
            editingText: "",
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
                this.setState({ enableText: false });
                break;
            case "delete":
            case "backspace":
                this.setState((prevState) => ({
                    textElements: Array.isArray(prevState.textElements)
                        ? prevState.textElements.filter((text) => !text.selected)
                        : [],
                }));
                break;
            case "x":
                this.setState({ enableText: true });
                break;
        }
    };

    private readonly onChoosePosition = (e: React.MouseEvent, newText: any, _moreProps: any) => {
        this.setState((prevState) => ({
            enableText: false,
            textElements: [...(Array.isArray(prevState.textElements) ? prevState.textElements : []), newText],
            showModal: true,
            editingIndex: prevState.textElements.length,
            editingText: newText.text,
        }));
    };

    private readonly onTextDragComplete = (e: React.MouseEvent, newTextElements: any[], _moreProps: any) => {
        this.setState({
            textElements: newTextElements,
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
            const stateKey = each.chartId === 1 ? "textElements" : `${each.type.toLowerCase()}_${each.chartId}`;
            return [stateKey, each.objects || []];
        });

        this.setState(newState);
    };

    private readonly handleDoubleClick = (e: React.MouseEvent, interactives: any[], _moreProps: any) => {
        // Check if any text element is selected for editing
        const selectedElements = interactives.flatMap(
            (interactive) => interactive.objects?.filter((obj: any) => obj.selected) || [],
        );

        if (selectedElements.length > 0) {
            // Find the index of the selected element in our state
            const selectedElement = selectedElements[0];
            const index = this.state.textElements.findIndex(
                (el) =>
                    el.position &&
                    selectedElement.position &&
                    el.position[0] === selectedElement.position[0] &&
                    el.position[1] === selectedElement.position[1],
            );

            if (index !== -1) {
                this.setState({
                    showModal: true,
                    editingIndex: index,
                    editingText: selectedElement.text || "Lorem ipsum...",
                });
            }
        }
    };

    private readonly handleModalSave = () => {
        const { editingIndex, editingText } = this.state;
        if (editingIndex !== null) {
            this.setState((prevState) => ({
                textElements: prevState.textElements.map((el, idx) =>
                    idx === editingIndex ? { ...el, text: editingText } : el,
                ),
                showModal: false,
                editingIndex: null,
                editingText: "",
            }));
        }
    };

    private readonly handleModalCancel = () => {
        this.setState({
            showModal: false,
            editingIndex: null,
            editingText: "",
        });
    };

    public render() {
        const { data, height, width, ratio } = this.props;
        const { enableText, textElements, showModal, editingText } = this.state;

        const safeTextElements = Array.isArray(textElements) ? textElements : [];

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
                        onClick={() => this.setState({ enableText: true })}
                        style={{
                            backgroundColor: enableText ? "#007bff" : "#fff",
                            color: enableText ? "#fff" : "#000",
                            border: "1px solid #ccc",
                            padding: "8px 12px",
                            cursor: "pointer",
                        }}
                    >
                        Add Text (X)
                    </button>
                    <button
                        onClick={() => this.setState({ enableText: false })}
                        style={{
                            backgroundColor: !enableText ? "#007bff" : "#fff",
                            color: !enableText ? "#fff" : "#000",
                            border: "1px solid #ccc",
                            padding: "8px 12px",
                            cursor: "pointer",
                        }}
                    >
                        Select Mode
                    </button>
                    <div style={{ marginLeft: "20px", color: "#666" }}>
                        Mode: {enableText ? "Adding Text" : "Select"} | Text Elements: {safeTextElements.length} | ESC:
                        Cancel | DEL: Delete Selected | Selector: {!enableText ? "ENABLED" : "DISABLED"}
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

                        <InteractiveText
                            ref={this.saveInteractiveNodes("InteractiveText", 1)}
                            enabled={enableText}
                            onChoosePosition={this.onChoosePosition}
                            onDragComplete={this.onTextDragComplete}
                            textList={safeTextElements}
                        />

                        <MouseCoordinateY displayFormat={format(".2f")} />
                        <MouseCoordinateX displayFormat={timeFormat("%Y-%m-%d")} />

                        <DrawingObjectSelector
                            enabled={!enableText}
                            getInteractiveNodes={this.getInteractiveNodes}
                            drawingObjectMap={{
                                InteractiveText: "textList",
                            }}
                            onSelect={this.handleSelection}
                            onDoubleClick={this.handleDoubleClick}
                        />
                    </Chart>

                    <CrossHairCursor />
                </ChartCanvas>

                {/* Text Edit Modal */}
                {showModal && (
                    <div
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            backgroundColor: "rgba(0, 0, 0, 0.5)",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            zIndex: 1000,
                        }}
                    >
                        <div
                            style={{
                                backgroundColor: "white",
                                padding: "20px",
                                borderRadius: "8px",
                                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                                minWidth: "300px",
                            }}
                        >
                            <h3 style={{ margin: "0 0 15px 0" }}>Edit Text</h3>
                            <textarea
                                value={editingText}
                                onChange={(e) => this.setState({ editingText: e.target.value })}
                                style={{
                                    width: "100%",
                                    height: "100px",
                                    padding: "8px",
                                    border: "1px solid #ccc",
                                    borderRadius: "4px",
                                    resize: "vertical",
                                    fontFamily: "Arial, sans-serif",
                                }}
                                autoFocus
                            />
                            <div
                                style={{
                                    marginTop: "15px",
                                    display: "flex",
                                    gap: "10px",
                                    justifyContent: "flex-end",
                                }}
                            >
                                <button
                                    onClick={this.handleModalCancel}
                                    style={{
                                        padding: "8px 16px",
                                        border: "1px solid #ccc",
                                        backgroundColor: "white",
                                        borderRadius: "4px",
                                        cursor: "pointer",
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={this.handleModalSave}
                                    style={{
                                        padding: "8px 16px",
                                        border: "none",
                                        backgroundColor: "#007bff",
                                        color: "white",
                                        borderRadius: "4px",
                                        cursor: "pointer",
                                    }}
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}

export default withOHLCData()(withSize({ style: { minHeight: 600 } })(withDeviceRatio()(InteractiveTextChart)));
