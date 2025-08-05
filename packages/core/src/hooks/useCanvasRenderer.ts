import { useRef, useCallback, useEffect } from "react";
import { flushSync } from "react-dom";
import { useStrictModeDetection } from "./useStrictModeDetection";

interface CanvasRendererOptions {
    enableOptimizations?: boolean;
    throttleMs?: number;
}

interface CanvasRendererResult {
    render: (drawFunction: (ctx: CanvasRenderingContext2D) => void) => void;
    clear: () => void;
    context: CanvasRenderingContext2D | null;
    isStrictMode: boolean;
}

/**
 * React 18 optimized canvas renderer hook
 * Handles canvas operations with proper React 18 batching prevention
 */
export function useCanvasRenderer(
    canvasRef: React.RefObject<HTMLCanvasElement>,
    options: CanvasRendererOptions = {},
): CanvasRendererResult {
    const { enableOptimizations = true, throttleMs = 16 } = options;

    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const isRenderingRef = useRef(false);
    const lastRenderTime = useRef(0);
    const pendingRenderRef = useRef<number | null>(null);
    const isStrictMode = useStrictModeDetection();

    // Initialize context
    useEffect(() => {
        if (canvasRef.current && !contextRef.current) {
            const ctx = canvasRef.current.getContext("2d");
            if (ctx) {
                contextRef.current = ctx;
            }
        }
    }, [canvasRef]);

    const render = useCallback(
        (drawFunction: (ctx: CanvasRenderingContext2D) => void) => {
            if (!contextRef.current || isRenderingRef.current) {
                return;
            }

            const now = performance.now();

            // Throttling for performance
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

            const executeRender = () => {
                try {
                    if (contextRef.current) {
                        drawFunction(contextRef.current);
                    }
                } finally {
                    isRenderingRef.current = false;
                }
            };

            // In Strict Mode, use flushSync to prevent batching issues
            if (isStrictMode) {
                try {
                    flushSync(executeRender);
                } catch (error) {
                    console.warn("[React Financial Charts] flushSync failed in hook:", error);
                    executeRender();
                }
            } else {
                executeRender();
            }
        },
        [enableOptimizations, throttleMs, isStrictMode],
    );

    const clear = useCallback(() => {
        if (contextRef.current && canvasRef.current) {
            const { width, height } = canvasRef.current;
            const ratio = window.devicePixelRatio || 1;
            contextRef.current.clearRect(0, 0, width * ratio, height * ratio);
        }
    }, [canvasRef]);

    return {
        render,
        clear,
        context: contextRef.current,
        isStrictMode,
    };
}
