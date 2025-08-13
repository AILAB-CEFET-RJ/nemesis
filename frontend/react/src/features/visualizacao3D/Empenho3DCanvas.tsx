import React, { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Html, OrbitControls, GizmoHelper, GizmoViewport } from "@react-three/drei";
import { fetchEmpenhos3D } from "./dataFetcher";
import { Empenho3DItem } from "./types";
import { PerspectiveCamera } from "three";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";

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

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh" }}>
      {/* Painel lateral fixo */}
      <div
        style={{
          width: "320px",
          backgroundColor: "#f8f9fa",
          padding: "16px",
          borderRight: "1px solid #ccc",
          overflowY: "auto",
          flexShrink: 0,
        }}
      >
        <h2>Detalhes do Item</h2>
        {selectedItem ? (
          <>
            <p><strong>ID:</strong> {selectedItem.id}</p>
            <p><strong>Descrição:</strong> {selectedItem.descricao}</p>
            <p><strong>Coordenadas:</strong></p>
            <ul>
              <li><strong>X:</strong> {selectedItem.x.toFixed(2)}</li>
              <li><strong>Y:</strong> {selectedItem.y.toFixed(2)}</li>
              <li><strong>Z:</strong> {selectedItem.z.toFixed(2)}</li>
            </ul>
            <p><strong>Cluster:</strong> {selectedItem.cluster}</p>
            <p><strong>Cor:</strong> <span style={{ color: selectedItem.color }}>{selectedItem.color}</span></p>
            <button onClick={() => setSelectedItem(null)} style={{ marginTop: "12px" }}>Fechar</button>
          </>
        ) : (
          <p>Selecione um ponto para ver os detalhes.</p>
        )}
      </div>

      {/* Área 3D */}
      <div style={{ flex: 1 }}>
        <Canvas camera={{ position: [0, 0, 5] }}>
          <ambientLight />
          <pointLight position={[10, 10, 10]} />
          <OrbitControls
            ref={controlsRef}
            makeDefault
            autoRotate
            autoRotateSpeed={0.5}
          />
          <perspectiveCamera ref={cameraRef} />
          <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
            <GizmoViewport axisColors={['#ff0000', '#00ff00', '#0000ff']} labelColor="#fff" />
          </GizmoHelper>
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
  );
};
