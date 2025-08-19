import { useThree } from "@react-three/fiber";
import { useRef, useEffect } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

export function AutoRotatePause({ controlsRef }: { controlsRef: (React.RefObject<OrbitControlsImpl | null> | null)}) {
  const { gl } = useThree();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handlePointerDown = () => {
      if (controlsRef?.current) {
        controlsRef.current.autoRotateSpeed = 0;

        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(() => {
          if (controlsRef?.current) {
            controlsRef.current.autoRotateSpeed = 0.1; // volta depois de 10s
          }
        }, 10000);
      }
    };

    gl.domElement.addEventListener("pointerdown", handlePointerDown);
    return () => {
      gl.domElement.removeEventListener("pointerdown", handlePointerDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [gl]);

  return null;
}

