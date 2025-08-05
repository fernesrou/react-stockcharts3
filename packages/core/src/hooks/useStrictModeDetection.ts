import { useRef, useEffect, useState } from "react";

/**
 * Hook to detect React Strict Mode
 * In Strict Mode, components are mounted, unmounted, and remounted
 * which can cause issues with canvas operations
 */
export function useStrictModeDetection(): boolean {
    const renderCountRef = useRef(0);
    const [isStrictMode, setIsStrictMode] = useState(false);

    useEffect(() => {
        renderCountRef.current++;

        // In Strict Mode, useEffect runs, cleanup runs, then runs again
        const timeoutId = setTimeout(() => {
            if (renderCountRef.current > 1) {
                setIsStrictMode(true);
                console.info("[React Financial Charts] React Strict Mode detected in functional component");
            }
        }, 0);

        return () => {
            clearTimeout(timeoutId);
            // In Strict Mode, this cleanup runs immediately after initial effect
            renderCountRef.current++;
        };
    }, []);

    return isStrictMode;
}
