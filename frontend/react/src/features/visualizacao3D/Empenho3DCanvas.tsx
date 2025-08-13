import React, { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { fetchEmpenhos3D } from "./dataFetcher";
import { Empenho3DItem } from "./types";
import { PerspectiveCamera } from "three";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { ItemModal } from "./ItemModal";

interface SphereProps {
  item: Empenho3DItem;
  hoveredItem: Empenho3DItem | null;
  setHoveredItem: (item: Empenho3DItem | null) => void;
  setSelectedItem: (item: Empenho3DItem) => void;
}

const Sphere: React.FC<SphereProps> = ({
  item,
  hoveredItem,
  setHoveredItem,
  setSelectedItem,
}) => (
  <mesh
    position={[item.x, item.y, item.z]}
    onPointerOver={(e) => {
      e.stopPropagation();
      setHoveredItem(item);
    }}
    onPointerOut={(e) => {
      e.stopPropagation();
      setHoveredItem(null);
    }}
    onClick={(e) => {
      e.stopPropagation();
      setSelectedItem(item);
    }}
  >
    <sphereGeometry args={[0.1, 32, 32]} />
    <meshStandardMaterial color={item.color || "#1f77b4"} />
    {hoveredItem?.id === item.id && (
      <Html distanceFactor={10}>
        <div
          style={{
            background: "white",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "0.8rem",
            boxShadow: "0px 0px 5px rgba(0,0,0,0.3)",
          }}
        >
          <strong>{item.id}</strong>
          <br />
          {item.descricao}
        </div>
      </Html>
    )}
  </mesh>
);

export const Empenho3DCanvas: React.FC = () => {
  const [data, setData] = useState<Empenho3DItem[]>([]);
  const [hoveredItem, setHoveredItem] = useState<Empenho3DItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<Empenho3DItem | null>(null);

  const cameraRef = useRef<PerspectiveCamera>(null);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const centerScene = (items: Empenho3DItem[]) => {
    if (items.length && cameraRef.current && controlsRef.current) {
      const cx = items.reduce((sum, p) => sum + p.x, 0) / items.length;
      const cy = items.reduce((sum, p) => sum + p.y, 0) / items.length;
      const cz = items.reduce((sum, p) => sum + p.z, 0) / items.length;

      controlsRef.current.target.set(cx, cy, cz);
      cameraRef.current.lookAt(cx, cy, cz);
      controlsRef.current.update();
    }
  };

  useEffect(() => {
    fetchEmpenhos3D().then((d) => {
      setData(d);
      centerScene(d);
    });
  }, []);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (cameraRef.current) cameraRef.current.updateProjectionMatrix();
      if (controlsRef.current) controlsRef.current.update();
      centerScene(data);
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [data]);

  return (
    <>
      <div style={{ display: "flex", width: "100vw", height: "100vh" }}>
        <div style={{ flex: 1 }} ref={containerRef}>
          <Canvas camera={{ position: [0, 0, 5] }}>
            <ambientLight />
            <pointLight position={[10, 10, 10]} />
            <OrbitControls ref={controlsRef} />
            <perspectiveCamera ref={cameraRef} />
            {data.map((item) => (
              <Sphere
                key={item.id}
                item={item}
                hoveredItem={hoveredItem}
                setHoveredItem={setHoveredItem}
                setSelectedItem={setSelectedItem}
              />
            ))}
          </Canvas>
        </div>
      </div>

      {selectedItem && (
        <ItemModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </>
  );
};
