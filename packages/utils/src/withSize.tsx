import * as React from "react";
import AutoSizer, { Props as AutoSizerProps } from "react-virtualized-auto-sizer";

export interface WithSizeProps {
    readonly width: number;
    readonly height: number;
}

export const withSize = (props?: Omit<AutoSizerProps, "children">) => {
    return <TProps extends WithSizeProps>(OriginalComponent: React.ComponentClass<TProps>) => {
        return class WithSize extends React.Component<Omit<TProps, "width" | "height">> {
            public render() {
                // Filter out problematic props for React 18 compatibility
                const safeProps = props ? { ...props } : {};

                // Remove disableHeight and disableWidth if they are true to avoid type conflicts
                if ("disableHeight" in safeProps && safeProps.disableHeight === true) {
                    delete (safeProps as any).disableHeight;
                }
                if ("disableWidth" in safeProps && safeProps.disableWidth === true) {
                    delete (safeProps as any).disableWidth;
                }

                return (
                    <AutoSizer {...(safeProps as any)}>
                        {({ height, width }) => {
                            return <OriginalComponent {...(this.props as TProps)} height={height} width={width} />;
                        }}
                    </AutoSizer>
                );
            }
        };
    };
};
