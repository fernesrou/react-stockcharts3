# React 18 Modernization - Code Examples

## 🔧 Implementaciones Específicas

### 1. ChartCanvas - Versión React 18 Optimizada

```typescript
// packages/core/src/ChartCanvasReact18.tsx
import { Component } from 'react';
import { flushSync } from 'react-dom';

export class ChartCanvasReact18<TXAxis extends number | Date> extends Component<
  ChartCanvasProps<TXAxis>,
  ChartCanvasState<TXAxis>
> {
  private isStrictMode = false;
  private strictModeRenderCount = 0;
  private canvasUpdateQueue: (() => void)[] = [];
  private isProcessingQueue = false;

  constructor(props: ChartCanvasProps<TXAxis>) {
    super(props);
    
    // Detectar Strict Mode por doble construcción
    this.strictModeRenderCount++;
    setTimeout(() => {
      if (this.strictModeRenderCount > 1) {
        this.isStrictMode = true;
        console.info('[React Financial Charts] Strict Mode detected - using optimized rendering');
      }
    }, 0);
    
    this.state = resetChart(props);
  }

  // Operación de canvas optimizada para React 18
  private safeCanvasOperation = (operation: () => void) => {
    if (this.isStrictMode) {
      // En Strict Mode, usar flushSync para evitar batching
      try {
        flushSync(() => {
          operation();
        });
      } catch (error) {
        // Fallback si flushSync falla
        operation();
      }
    } else {
      // En modo normal, usar queue para prevenir operaciones simultáneas
      this.canvasUpdateQueue.push(operation);
      this.processCanvasQueue();
    }
  };

  private processCanvasQueue = () => {
    if (this.isProcessingQueue || this.canvasUpdateQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    
    // Usar scheduler.postTask si está disponible
    const processNext = () => {
      const operation = this.canvasUpdateQueue.shift();
      if (operation) {
        operation();
      }
      
      if (this.canvasUpdateQueue.length > 0) {
        // Procesar siguiente operación en próximo tick
        if ('scheduler' in window && 'postTask' in (window as any).scheduler) {
          (window as any).scheduler.postTask(processNext, { priority: 'user-blocking' });
        } else {
          requestAnimationFrame(processNext);
        }
      } else {
        this.isProcessingQueue = false;
      }
    };

    processNext();
  };

  // Pan operation optimizada
  public handlePan = (mousePosition: [number, number], e: React.MouseEvent) => {
    if (!this.waitingForPanAnimationFrame) {
      this.waitingForPanAnimationFrame = true;

      const newState = this.panHelper(mousePosition, this.state);
      
      this.triggerEvent("pan", newState, e);

      this.mutableState = {
        mouseXY: newState.mouseXY,
        currentItem: newState.currentItem,
        currentCharts: newState.currentCharts,
      };

      // Usar operación segura en lugar de requestAnimationFrame
      this.safeCanvasOperation(() => {
        this.waitingForPanAnimationFrame = false;
        this.clearBothCanvas();
        this.draw({ trigger: "pan" });
      });
    }
  };

  // Zoom operation optimizada
  public handlePinchZoom = (initialPinch: any, finalPinch: any, e: React.TouchEvent) => {
    if (!this.waitingForPinchZoomAnimationFrame) {
      this.waitingForPinchZoomAnimationFrame = true;
      
      const state = this.pinchZoomHelper(initialPinch, finalPinch);
      this.triggerEvent("pinchzoom", state, e);
      this.finalPinch = finalPinch;

      this.safeCanvasOperation(() => {
        this.clearBothCanvas();
        this.draw({ trigger: "pinchzoom" });
        this.waitingForPinchZoomAnimationFrame = false;
      });
    }
  };
}
```

### 2. Hook para Detección de Strict Mode

```typescript
// packages/core/src/hooks/useStrictModeDetection.ts
import { useRef, useEffect, useState } from 'react';

export function useStrictModeDetection() {
  const renderCountRef = useRef(0);
  const [isStrictMode, setIsStrictMode] = useState(false);

  useEffect(() => {
    renderCountRef.current++;
    
    // En Strict Mode, useEffect se ejecuta, limpia y vuelve a ejecutar
    const timeoutId = setTimeout(() => {
      if (renderCountRef.current > 1) {
        setIsStrictMode(true);
      }
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      // En Strict Mode, este cleanup se ejecuta inmediatamente
      renderCountRef.current++;
    };
  }, []);

  return isStrictMode;
}
```

### 3. Canvas Renderer Hook Optimizado

```typescript
// packages/core/src/hooks/useCanvasRenderer.ts
import { useRef, useCallback, useEffect } from 'react';

interface CanvasRendererOptions {
  enableOptimizations?: boolean;
  throttleMs?: number;
}

export function useCanvasRenderer(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  options: CanvasRendererOptions = {}
) {
  const { enableOptimizations = true, throttleMs = 16 } = options;
  
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const isRenderingRef = useRef(false);
  const lastRenderTime = useRef(0);
  const pendingRenderRef = useRef<number | null>(null);

  useEffect(() => {
    if (canvasRef.current && !contextRef.current) {
      contextRef.current = canvasRef.current.getContext('2d');
    }
  }, [canvasRef]);

  const render = useCallback((drawFunction: (ctx: CanvasRenderingContext2D) => void) => {
    if (!contextRef.current || isRenderingRef.current) return;

    const now = performance.now();
    
    // Throttling para prevenir renders excesivos
    if (enableOptimizations && now - lastRenderTime.current < throttleMs) {
      if (pendingRenderRef.current) {
        cancelAnimationFrame(pendingRenderRef.current);
      }
      
      pendingRenderRef.current = requestAnimationFrame(() => {
        render(drawFunction);
      });
      return;
    }

    isRenderingRef.current = true;
    lastRenderTime.current = now;

    try {
      if (contextRef.current) {
        drawFunction(contextRef.current);
      }
    } finally {
      isRenderingRef.current = false;
    }
  }, [enableOptimizations, throttleMs]);

  const clear = useCallback(() => {
    if (contextRef.current && canvasRef.current) {
      const { width, height } = canvasRef.current;
      contextRef.current.clearRect(0, 0, width, height);
    }
  }, [canvasRef]);

  return { render, clear, context: contextRef.current };
}
```

### 4. Wrapper Component para Concurrent Safety

```typescript
// packages/core/src/components/ConcurrentSafeChart.tsx
import React, { useState, useEffect, ReactNode } from 'react';
import { useStrictModeDetection } from '../hooks/useStrictModeDetection';

interface ConcurrentSafeChartProps {
  children: ReactNode;
  fallback?: ReactNode;
  enableOptimizations?: boolean;
}

export const ConcurrentSafeChart: React.FC<ConcurrentSafeChartProps> = ({
  children,
  fallback = <div>Loading chart...</div>,
  enableOptimizations = true,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const isStrictMode = useStrictModeDetection();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // En SSR o primera render, mostrar fallback
  if (!isMounted) {
    return <>{fallback}</>;
  }

  const containerStyles: React.CSSProperties = {
    // CSS Containment para mejorar performance
    contain: 'layout style paint',
    // Isolation para prevenir repaints cascading
    isolation: 'isolate',
    // Will-change para optimizar compositing
    ...(enableOptimizations && {
      willChange: 'transform',
    }),
  };

  if (isStrictMode && enableOptimizations) {
    // En Strict Mode, agregar optimizaciones adicionales
    containerStyles.transform = 'translateZ(0)'; // Force GPU layer
  }

  return (
    <div style={containerStyles} data-concurrent-safe="true">
      {children}
    </div>
  );
};
```

### 5. Utility para flushSync Seguro

```typescript
// packages/core/src/utils/reactCompat.ts
import { flushSync } from 'react-dom';

export function safeFlushSync(callback: () => void) {
  try {
    if (typeof flushSync === 'function') {
      flushSync(callback);
    } else {
      callback();
    }
  } catch (error) {
    console.warn('[React Financial Charts] flushSync failed, falling back to sync execution:', error);
    callback();
  }
}

export function isReact18() {
  try {
    return typeof flushSync === 'function';
  } catch {
    return false;
  }
}

// Scheduler API polyfill
export function scheduleTask(callback: () => void, priority: 'user-blocking' | 'user-visible' | 'background' = 'user-visible') {
  if ('scheduler' in window && 'postTask' in (window as any).scheduler) {
    return (window as any).scheduler.postTask(callback, { priority });
  } else {
    // Fallback a requestAnimationFrame
    return requestAnimationFrame(callback);
  }
}
```

### 6. Configuración de Storybook Optimizada

```javascript
// packages/stories/.storybook/main.js
/** @type {import('@storybook/react-webpack5').StorybookConfig} */
module.exports = {
  addons: ["@storybook/addon-essentials", "@storybook/addon-docs"],
  stories: ["../src/**/*.stories.@(js|jsx|ts|tsx)"],
  
  typescript: {
    check: false,
    reactDocgen: false, // Deshabilitar para mejorar performance
  },
  
  framework: {
    name: "@storybook/react-webpack5",
    options: {
      strictMode: false, // CRÍTICO: Deshabilitar para charts
    },
  },
  
  webpackFinal: async (config) => {
    // Optimizaciones para charts
    config.optimization = config.optimization || {};
    config.optimization.usedExports = true;
    
    // Prevenir code splitting de componentes de charts
    config.optimization.splitChunks = {
      ...config.optimization.splitChunks,
      cacheGroups: {
        ...config.optimization.splitChunks.cacheGroups,
        charts: {
          test: /[\\/]packages[\\/](core|series|axes)[\\/]/,
          name: 'charts',
          chunks: 'all',
          priority: 20,
        },
      },
    };

    return config;
  },
};
```

```javascript
// packages/stories/.storybook/preview.js
import React from 'react';

// Decorator optimizado para prevenir flickering
export const decorators = [
  (Story, context) => {
    return React.createElement(
      'div',
      {
        'data-chart-container': true,
        style: {
          // CSS optimizations para charts
          contain: 'layout style paint',
          isolation: 'isolate',
          willChange: 'auto', // Prevent constant repainting
          // Force hardware acceleration solo si es necesario
          ...(context.parameters?.forceGPU && {
            transform: 'translateZ(0)',
          }),
        },
      },
      React.createElement(Story, context.args)
    );
  },
];

export const parameters = {
  controls: { hideNoControlsWarning: true },
  options: {
    storySort: {
      order: ['Intro', 'Features', 'Visualization'],
    },
  },
  // Configuraciones específicas para charts
  charts: {
    disableStrictMode: true,
    enableOptimizations: true,
  },
};
```

### 7. Test Utilities para React 18

```typescript
// packages/core/src/__tests__/utils/react18TestUtils.ts
import React from 'react';
import { render, RenderOptions } from '@testing-library/react';

// Wrapper de testing que simula diferentes modos de React
interface React18TestWrapperProps {
  children: React.ReactNode;
  strictMode?: boolean;
  concurrent?: boolean;
}

const React18TestWrapper: React.FC<React18TestWrapperProps> = ({
  children,
  strictMode = false,
  concurrent = false,
}) => {
  let wrapper = children;
  
  if (strictMode) {
    wrapper = React.createElement(React.StrictMode, {}, wrapper);
  }
  
  // Para concurrent mode, podrías usar startTransition en el futuro
  
  return React.createElement('div', { 'data-testid': 'test-wrapper' }, wrapper);
};

export function renderWithReact18Options(
  ui: React.ReactElement,
  options?: RenderOptions & {
    strictMode?: boolean;
    concurrent?: boolean;
  }
) {
  const { strictMode, concurrent, ...renderOptions } = options || {};
  
  return render(ui, {
    wrapper: ({ children }) =>
      React.createElement(React18TestWrapper, {
        strictMode,
        concurrent,
        children,
      }),
    ...renderOptions,
  });
}

// Helper para simular doble montaje de Strict Mode
export async function simulateStrictModeDoubleMount(component: React.ReactElement) {
  // Primera renderización
  const { unmount, rerender } = render(component);
  
  // Simular unmount
  unmount();
  
  // Segunda renderización (comportamiento de Strict Mode)
  return render(component);
}
```

## 🧪 Ejemplos de Testing

### Test de Flickering Prevention

```typescript
// packages/core/src/__tests__/flickering.test.tsx
import { renderWithReact18Options } from './utils/react18TestUtils';
import { ChartCanvas } from '../ChartCanvas';
import { fireEvent, waitFor } from '@testing-library/react';

describe('React 18 Flickering Prevention', () => {
  const mockProps = {
    // ... props básicos para ChartCanvas
  };

  test('should not flicker during pan in Strict Mode', async () => {
    const { container } = renderWithReact18Options(
      <ChartCanvas {...mockProps} />,
      { strictMode: true }
    );

    const canvas = container.querySelector('canvas')!;
    
    // Simular pan operation
    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(canvas, { clientX: 150, clientY: 100 });
    fireEvent.mouseUp(canvas);

    // Verificar que no hay contenido intermedio vacío
    await waitFor(() => {
      const imageData = canvas.getContext('2d')!.getImageData(0, 0, 100, 100);
      const hasContent = Array.from(imageData.data).some(pixel => pixel !== 0);
      expect(hasContent).toBe(true);
    });
  });

  test('should maintain performance metrics', async () => {
    let renderCount = 0;
    const MockChart = () => {
      renderCount++;
      return <ChartCanvas {...mockProps} />;
    };

    renderWithReact18Options(<MockChart />, { strictMode: true });

    // En Strict Mode, debería renderizar máximo 2 veces
    expect(renderCount).toBeLessThanOrEqual(2);
  });
});
```

---

Este documento proporciona implementaciones concretas y ejemplos de código para la modernización React 18, enfocándose específicamente en prevenir el flickering mientras se aprovechan las nuevas características de React 18.