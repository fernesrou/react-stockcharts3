import * as React from "react";
import { GenericChartComponent } from "@react-stockcharts3/core";

interface SVGComponentProps {
    readonly children: (moreProps: any) => React.ReactNode;
}

export class SVGComponent extends React.Component<SVGComponentProps> {
    public render() {
        const { children } = this.props;
        return <GenericChartComponent drawOn={[]} svgDraw={children} />;
    }
}
