# Plan de Modernización React 18 - React Financial Charts

## 🎯 Objetivo

Modernizar el monorepo de React Financial Charts para aprovechar las características de React 18 mientras se mantiene el rendimiento óptimo de los gráficos y se evita el flickering durante las interacciones.

## 📊 Estado Actual

-   **React Version**: 18.3.1 (ya instalado)
-   **Problema Principal**: Flickering en desarrollo debido a React 18 Strict Mode
-   **Arquitectura**: Canvas HTML5 con operaciones síncronas usando `requestAnimationFrame`

## 🔍 Análisis del Problema

### React 17 vs React 18 - Diferencias Clave

| Aspecto               | React 17               | React 18                                |
| --------------------- | ---------------------- | --------------------------------------- |
| **Rendering**         | Síncrono               | Concurrente                             |
| **Batching**          | Solo en event handlers | Automático en todas las actualizaciones |
| **Strict Mode**       | Un solo render         | Doble montaje en desarrollo             |
| **Canvas Operations** | Inmediatas             | Pueden ser interrumpidas/batched        |

### Causas Específicas del Flickering

1. **Doble Montaje en Strict Mode**

    - Constructor se ejecuta 2 veces
    - `useEffect` se ejecuta, desmonta y vuelve a montar
    - Canvas se limpia y redibuja en ciclos separados

2. **Automatic Batching**

    - Múltiples `setState` se agrupan automáticamente
    - Canvas clearing y redrawing ocurren en diferentes frames
    - Usuario ve el estado intermedio (canvas vacío)

3. **Concurrent Rendering**
    - Work puede ser interrumpido y reanudado
    - `requestAnimationFrame` callbacks pueden ejecutarse fuera de orden
    - Pérdida de sincronización entre limpieza y redibujado

## 🛠️ Estrategias de Solución

### Estrategia 1: Configuración de Desarrollo (Recomendada)

**Objetivo**: Deshabilitar Strict Mode específicamente para demos/development

```javascript
// .storybook/preview.js
export const decorators = [
    (Story) => {
        // Wrapper que previene double mounting
        return React.createElement(
            "div",
            {
                "data-chart-container": true,
                style: {
                    isolation: "isolate",
                    willChange: "transform",
                },
            },
            React.createElement(Story),
        );
    },
];
```

```javascript
// .storybook/main.js
module.exports = {
    framework: {
        name: "@storybook/react-webpack5",
        options: {
            strictMode: false, // Deshabilitar para charts
        },
    },
};
```

### Estrategia 2: Canvas Operations Optimization

**Objetivo**: Hacer que las operaciones de canvas sean resistentes al batching

```typescript
// ChartCanvas.tsx - Método optimizado
private optimizedCanvasUpdate = (operation: () => void) => {
  // Usar flushSync para operaciones críticas de canvas
  if (typeof flushSync !== 'undefined') {
    flushSync(() => {
      operation();
    });
  } else {
    // Fallback para entornos sin flushSync
    operation();
  }
};

// Reemplazar requestAnimationFrame en operaciones críticas
private handlePanOptimized = (mousePosition: [number, number], e: React.MouseEvent) => {
  // ... lógica de pan ...

  // En lugar de requestAnimationFrame
  this.optimizedCanvasUpdate(() => {
    this.clearBothCanvas();
    this.draw({ trigger: "pan" });
  });
};
```

### Estrategia 3: Hook-Based Canvas Management

**Objetivo**: Aislar canvas operations del ciclo de vida de React

```typescript
// useCanvasRenderer.ts
export const useCanvasRenderer = (canvasRef: RefObject<HTMLCanvasElement>) => {
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const isRenderingRef = useRef(false);

    const render = useCallback((drawFunction: (ctx: CanvasRenderingContext2D) => void) => {
        if (!contextRef.current || isRenderingRef.current) return;

        isRenderingRef.current = true;

        // Usar scheduler.postTask si está disponible (mejor que requestAnimationFrame)
        const execute = () => {
            if (contextRef.current) {
                drawFunction(contextRef.current);
            }
            isRenderingRef.current = false;
        };

        if ("scheduler" in window && "postTask" in scheduler) {
            scheduler.postTask(execute, { priority: "user-blocking" });
        } else {
            execute();
        }
    }, []);

    return { render, context: contextRef.current };
};
```

### Estrategia 4: Concurrent-Safe Chart Component

**Objetivo**: Wrapper que protege charts de concurrent features

```typescript
// ConcurrentSafeChart.tsx
export const ConcurrentSafeChart = ({ children, ...props }) => {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Solo renderizar en el cliente para evitar hydration issues
    if (!isClient) {
        return <div>Loading chart...</div>;
    }

    return (
        <div
            style={{
                contain: "layout style paint",
                isolation: "isolate",
            }}
        >
            {children}
        </div>
    );
};
```

## 📋 Plan de Implementación

### Fase 1: Configuración Base (1-2 horas)

-   [ ] Configurar Storybook para deshabilitar Strict Mode
-   [ ] Agregar CSS optimizations para canvas containers
-   [ ] Probar que el flickering desaparece en desarrollo

### Fase 2: Optimización de Canvas (2-3 horas)

-   [ ] Implementar `flushSync` en operaciones críticas de canvas
-   [ ] Reemplazar `requestAnimationFrame` por `scheduler.postTask` donde sea apropiado
-   [ ] Crear utility hook `useCanvasRenderer`

### Fase 3: Component Wrappers (1-2 horas)

-   [ ] Crear `ConcurrentSafeChart` wrapper
-   [ ] Implementar `useStrictModeDetection` hook
-   [ ] Actualizar exports principales para incluir versiones seguras

### Fase 4: Testing y Validación (2-3 horas)

-   [ ] Probar en diferentes navegadores
-   [ ] Validar rendimiento vs React 17
-   [ ] Crear tests específicos para concurrent behavior
-   [ ] Documentar breaking changes (si los hay)

### Fase 5: Documentación (1 hora)

-   [ ] Actualizar README con notas sobre React 18
-   [ ] Crear migration guide para usuarios
-   [ ] Documentar configuraciones recomendadas

## 🧪 Testing Strategy

### Tests de Flickering

```typescript
// __tests__/flickering.test.tsx
describe("React 18 Flickering Prevention", () => {
    it("should not flicker during pan operations in Strict Mode", async () => {
        const { container } = render(
            <React.StrictMode>
                <ChartCanvas {...mockProps} />
            </React.StrictMode>,
        );

        // Simulate pan operation
        const canvas = container.querySelector("canvas");
        fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(canvas, { clientX: 150, clientY: 100 });

        // Check that canvas content is stable
        expect(canvas).toHaveAttribute("data-stable", "true");
    });
});
```

### Performance Tests

```typescript
// __tests__/performance.test.tsx
describe("React 18 Performance", () => {
    it("should maintain 60fps during interactions", async () => {
        const performanceMonitor = new PerformanceMonitor();

        render(<ChartCanvas {...mockProps} />);

        // Simulate intensive interactions
        await simulateIntensivePanAndZoom();

        const metrics = performanceMonitor.getMetrics();
        expect(metrics.averageFPS).toBeGreaterThan(55);
    });
});
```

## 🚀 Configuraciones Recomendadas

### Para Desarrollo

```javascript
// .storybook/main.js
module.exports = {
    framework: {
        name: "@storybook/react-webpack5",
        options: {
            strictMode: false,
        },
    },
    typescript: {
        reactDocgen: false, // Reduce build time
    },
};
```

### Para Producción

```javascript
// webpack.config.js
module.exports = {
    optimization: {
        // Prevent code splitting for chart components
        splitChunks: {
            cacheGroups: {
                charts: {
                    test: /[\\/]@react-stockcharts3[\\/]/,
                    name: "charts",
                    chunks: "all",
                    priority: 10,
                },
            },
        },
    },
};
```

### Para Testing

```javascript
// jest.config.js
module.exports = {
    testEnvironment: "jsdom",
    setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
    // Mock scheduler API for older browsers in tests
    moduleNameMapping: {
        "^scheduler$": "<rootDir>/src/__mocks__/scheduler.js",
    },
};
```

## ⚠️ Consideraciones Importantes

### Breaking Changes Potenciales

1. **Strict Mode**: Charts pueden comportarse diferente si el usuario activa Strict Mode
2. **Concurrent Features**: Suspend/Resume puede afectar animaciones complejas
3. **SSR**: Hydration mismatch si se usan features específicos del cliente

### Fallbacks Necesarios

1. **scheduler.postTask**: Fallback a requestAnimationFrame
2. **flushSync**: Fallback a operación síncrona normal
3. **CSS contain**: Graceful degradation en navegadores antiguos

### Monitoreo Post-Implementación

1. **Core Web Vitals**: Medir impacto en performance
2. **Error Tracking**: Monitorear errores específicos de React 18
3. **User Feedback**: Recopilar feedback sobre smoothness de charts

## 📚 Referencias

-   [React 18 Upgrade Guide](https://react.dev/blog/2022/03/08/react-18-upgrade-guide)
-   [Automatic Batching](https://github.com/reactwg/react-18/discussions/21)
-   [Strict Mode Changes](https://github.com/reactwg/react-18/discussions/19)
-   [Canvas Performance Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)

---

**Última actualización**: `new Date().toISOString()`
**Versión**: 1.0
**Estado**: Draft - Pendiente de implementación
