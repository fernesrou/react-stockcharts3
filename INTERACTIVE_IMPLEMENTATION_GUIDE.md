# Interactive Drawing Elements Implementation Guide

This guide documents how to properly implement interactive drawing tools (TrendLine, Channel, Fibonacci, etc.) with full selection, deselection, dragging, and drawing capabilities in React StockCharts 3.

## Overview

Interactive elements require careful coordination between multiple components:
- **Drawing Component** (TrendLine, Channel, FibonacciRetracement, etc.)
- **DrawingObjectSelector** for handling selection/deselection
- **Chart Container** for managing state and interactions

## Core Architecture

### 1. Chart Container Pattern

Each interactive chart story should follow this pattern:

```typescript
interface ChartState {
    enableTool: boolean;     // Drawing mode toggle
    elements: any[];         // Array of drawn elements
}

class InteractiveChart extends React.Component<Props, ChartState> {
    private interactiveNodes: any = {};
    
    constructor(props) {
        super(props);
        this.state = {
            enableTool: false,
            elements: [],
        };
    }
}
```

### 2. Interactive Node Management

```typescript
// Save reference to interactive components
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

// Provide nodes to DrawingObjectSelector
private getInteractiveNodes() {
    return this.interactiveNodes;
}
```

### 3. Selection Handler

```typescript
private readonly handleSelection = (e: React.MouseEvent, interactives: any[], moreProps: any) => {
    // Convert interactives to state updates
    const newState = this.toObject(interactives, (each) => {
        // Map chartId to state key (e.g., chartId 1 -> "elements")
        const stateKey = each.chartId === 1 ? "elements" : `${each.type.toLowerCase()}_${each.chartId}`;
        return [stateKey, each.objects || []];
    });
    
    this.setState(newState);
};

// Utility to convert array to object
private toObject(interactives: any[], keyMapper: (each: any) => [string, any]) {
    const obj: any = {};
    interactives.forEach((each) => {
        const [key, value] = keyMapper(each);
        obj[key] = value;
    });
    return obj;
}
```

### 4. Drawing Completion Handler

```typescript
private readonly onDrawComplete = (e: React.MouseEvent, newElements: any[], moreProps: any) => {
    this.setState({
        enableTool: false,  // Exit drawing mode
        elements: newElements,
    });
};
```

### 5. Keyboard Controls

```typescript
private readonly onKeyPress = (e: KeyboardEvent) => {
    switch (e.key.toLowerCase()) {
        case "escape":
            this.setState({ enableTool: false });
            break;
        case "delete":
        case "backspace":
            this.setState((prevState) => ({
                elements: prevState.elements.filter((el) => !el.selected),
            }));
            break;
        case "d":  // or tool-specific key
            this.setState({ enableTool: true });
            break;
    }
};
```

## Chart Implementation

### Chart Structure

```tsx
<ChartCanvas {...chartProps}>
    <Chart id={1} yExtents={...}>
        <XAxis />
        <YAxis />
        <CandlestickSeries />
        
        {/* Interactive Drawing Tool */}
        <InteractiveTool
            ref={this.saveInteractiveNodes("ToolType", 1)}
            enabled={enableTool}
            onComplete={this.onDrawComplete}
            elements={safeElements}
        />
        
        {/* Selection Handler */}
        <DrawingObjectSelector
            enabled={!enableTool}  // Only active when not drawing
            getInteractiveNodes={this.getInteractiveNodes}
            drawingObjectMap={{
                ToolType: "elements",  // Maps component type to props key
            }}
            onSelect={this.handleSelection}
        />
        
        <MouseCoordinates />
    </Chart>
</ChartCanvas>
```

## DrawingObjectSelector Configuration

The DrawingObjectSelector requires:

1. **enabled**: `!drawingMode` (disabled during drawing)
2. **getInteractiveNodes**: Function returning node references
3. **drawingObjectMap**: Maps component types to their data prop keys
4. **onSelect**: Handler for selection state changes

```typescript
const drawingObjectMap = {
    TrendLine: "trends",
    Channel: "channels", 
    FibonacciRetracement: "retracements",
    // Map component type -> data prop name
};
```

## Key Implementation Details

### State Management
- Use arrays to store drawn elements
- Each element should have a `selected` boolean property
- Always ensure arrays are valid before rendering

### Drawing Modes
- `enabled={drawingMode}` for drawing components
- `enabled={!drawingMode}` for DrawingObjectSelector
- Never have both active simultaneously

### Event Handling
- Drawing components handle creation
- DrawingObjectSelector handles selection/deselection
- Keyboard handlers manage mode switching and deletion

### Data Safety
```typescript
// Always ensure arrays are valid
const safeElements = Array.isArray(elements) ? elements : [];
```

## Toolbar Implementation

```tsx
<div style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
    <button
        onClick={() => this.setState({ enableTool: true })}
        style={{
            backgroundColor: enableTool ? "#007bff" : "#fff",
            color: enableTool ? "#fff" : "#000",
        }}
    >
        Draw Tool (D)
    </button>
    <button
        onClick={() => this.setState({ enableTool: false })}
        style={{
            backgroundColor: !enableTool ? "#007bff" : "#fff",
            color: !enableTool ? "#fff" : "#000",
        }}
    >
        Select Mode
    </button>
    <div style={{ marginLeft: "20px", color: "#666" }}>
        Mode: {enableTool ? "Drawing" : "Select"} | 
        Elements: {safeElements.length} | 
        ESC: Cancel | DEL: Delete Selected
    </div>
</div>
```

## Component Lifecycle

```typescript
componentDidMount() {
    document.addEventListener("keydown", this.onKeyPress);
}

componentWillUnmount() {
    document.removeEventListener("keydown", this.onKeyPress);
}
```

## Common Issues and Solutions

### 1. Selection Not Working
- Ensure DrawingObjectSelector has `enabled={!drawingMode}`
- Verify `drawingObjectMap` matches component types and prop names
- Check that `getInteractiveNodes` returns valid node references
- **CRITICAL**: Wrapper components must bind `isHover` utility: `this.isHover = isHover.bind(this)`

### 2. "node.isHover is not a function" Error
- **Root Cause**: Missing `isHover` binding in wrapper components
- **Solution**: In wrapper constructor, add: `this.isHover = isHover.bind(this);`
- **Import**: Ensure `import { isHover, saveNodeType } from "../utils";`

### 3. Hover Tooltips Not Appearing
- **Root Cause**: `"mouseleave"` event in `drawOn` array interferes with hover detection
- **Solution**: Remove `"mouseleave"` from `drawOn` array in components
- **Correct**: `drawOn={["mousemove", "pan", "drag"]}` 
- **Incorrect**: `drawOn={["mousemove", "mouseleave", "pan", "drag"]}`

### 4. Transparency Issues (Canvas Components)
- **Root Cause**: Color conflicts between main component and wrapper defaultProps
- **Solution**: Update both component and wrapper appearance.fill with rgba colors
- **Main Component**: Use `rgba(228, 26, 28, 0.1)` format in defaultProps
- **Wrapper Component**: Ensure transparent colors aren't overridden

### 5. Scale Errors in isHover  
- The `getMorePropsForChart` utility handles missing chart configs
- Provides fallback scales when chart context is incomplete
- No manual intervention needed if using the updated utils

### 6. Element Not Persisting
- Verify `onComplete` handler updates state correctly
- Ensure drawing component receives updated elements array
- Check array safety with `Array.isArray()` checks

### 7. Keyboard Controls Not Working
- Add event listeners in `componentDidMount`
- Remove in `componentWillUnmount`
- Handle escape, delete, and tool-specific keys

## Testing Workflow

1. **Drawing**: Activate tool → draw element → verify persistence
2. **Selection**: Click drawn element → verify selection visual feedback
3. **Deselection**: Click empty area → verify deselection
4. **Dragging**: Select element → drag → verify position update
5. **Deletion**: Select element → press DELETE → verify removal
6. **Mode Switching**: ESC key → verify exit from drawing mode

## React 18 Compatibility 

### Storybook Configuration
React 18's Strict Mode can cause flickering with canvas-based charts. Disable it in development:

```javascript
// .storybook/main.js
framework: {
  name: "@storybook/react-webpack5",
  options: {
    strictMode: false, // Critical for chart performance
  },
}
```

### Concurrent Features
- Canvas operations are designed to be concurrent-safe
- Automatic batching works correctly with chart interactions  
- State updates are optimized for React 18's rendering model

## Available Interactive Components

All components support full selection, deselection, dragging, and keyboard controls:

### 1. TrendLine 
- **Key**: `T` to activate, `D` to draw mode
- **Features**: LINE, RAY, XLINE types, edge point dragging
- **Keyboard**: ESC (cancel), DEL (delete selected)

### 2. GannFan
- **Key**: `G` to activate  
- **Features**: 8 fan lines with transparent areas between
- **Colors**: Rgba transparent with 0.1 opacity
- **Hover**: Tooltip "Click to select object"

### 3. FibonacciRetracement  
- **Key**: `F` to activate
- **Features**: Multiple retracement levels, draggable levels
- **Display**: Percentage and price labels

### 4. EquidistantChannel
- **Key**: `C` to activate
- **Features**: Parallel channel lines, channel area fill
- **Transparency**: Green rgba(44, 160, 44, 0.1)

### 5. StandardDeviationChannel  
- **Key**: `S` to activate
- **Features**: Statistical channel based on linear regression
- **Styling**: Consistent green theme with transparency

### 6. InteractiveText
- **Key**: `X` to activate
- **Features**: Editable text labels, modal editing on double-click
- **Interaction**: Click to select, double-click to edit text

## Color Scheme Standards

All interactive components use a consistent color scheme:
- **Primary Color**: `#2ca02c` (green)
- **Fill Opacity**: `0.1` for transparent areas
- **Stroke Width**: `1px` normal, `2px` when selected/hovered
- **Edge Points**: White fill with green stroke

## Performance Optimization

### Canvas Rendering
- Remove unnecessary `"mouseleave"` from `drawOn` arrays
- Use rgba colors directly instead of separate opacity values  
- Minimize canvas redraws with proper state management

### Memory Management
- Clean up event listeners in `componentWillUnmount`
- Use proper TypeScript typing to avoid memory leaks
- ESLint clean code with `/* eslint-disable @typescript-eslint/no-unused-vars */` for demo files

## Quick Troubleshooting Checklist

When implementing a new interactive component, verify these critical points:

### ✅ Essential Wrapper Configuration
```typescript
// In wrapper constructor (e.g., EachGannFan.tsx):
this.isHover = isHover.bind(this);  // ← CRITICAL for selection
this.saveNodeType = saveNodeType.bind(this);
```

### ✅ Component DrawOn Array  
```typescript
// In component (e.g., GannFan.tsx):
drawOn={["mousemove", "pan", "drag"]}  // ← No "mouseleave"
```

### ✅ DrawingObjectSelector Props
```typescript
<DrawingObjectSelector
    enabled={!enableTool}  // ← Opposite of drawing mode
    getInteractiveNodes={this.getInteractiveNodes}
    drawingObjectMap={{ ComponentName: "propName" }}  // ← Must match exactly
    onSelect={this.handleSelection}
/>
```

### ✅ Color Consistency
- **Main Component defaultProps**: rgba colors with 0.1 opacity
- **Wrapper defaultProps**: Should not override main component colors  
- **Stroke colors**: Use consistent `#2ca02c` green theme

### ✅ State Management
```typescript
// Always ensure arrays are safe:
const safeElements = Array.isArray(elements) ? elements : [];

// ESLint for demo files:
/* eslint-disable @typescript-eslint/no-unused-vars */
```

Following this checklist ensures full interactive functionality: single-click selection, click-to-deselect, hover tooltips, drag operations, and keyboard controls.

This pattern provides complete interactive functionality for all drawing tools in React StockCharts 3 with React 18 compatibility.