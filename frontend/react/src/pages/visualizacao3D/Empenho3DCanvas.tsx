import React, { useEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Html, OrbitControls, GizmoHelper, GizmoViewport } from "@react-three/drei";
import { fetchAllEmpenhos3D } from "./dataFetcher";
import { Empenho3DItem } from "./types";
import { PerspectiveCamera } from "three";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { AutoRotatePause } from "./AutoRotatePause";

interface SphereProps {
  item: Empenho3DItem;
  hoveredItem: Empenho3DItem | null;
  setHoveredItem: (item: Empenho3DItem | null) => void;
  setSelectedItem: (item: Empenho3DItem | null) => void;
  setSelectedEmpenho: (item: Empenho3DItem | null) => void;
  selectedAbrirMais: boolean;
}

const Sphere: React.FC<SphereProps> = ({
  item,
  hoveredItem,
  selectedAbrirMais,
  setHoveredItem,
  setSelectedItem,
  setSelectedEmpenho,
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
      if (selectedAbrirMais) {
        setSelectedEmpenho(item);
      } else {
        setSelectedItem(item);
      }
    }}
  >
    <sphereGeometry args={[0.05, 16, 16]} />
    <meshStandardMaterial color={item.color || "#1f77b4"} />
    {hoveredItem?.id === item.id && ( 
      <Html distanceFactor={10}>
        <div className="bg-white px-2 py-1 rounded text-[0.8rem] shadow-[0_0_5px_rgba(0,0,0,0.3)]">
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
  const [selectedEmpenho, setSelectedEmpenho] = useState<Empenho3DItem | null>(null);
  const [selectedAbrirMais, setSelectedAbrirMais] = useState<boolean>(false);


  const cameraRef = useRef<PerspectiveCamera>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

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
    if (selectedItem !== null && selectedAbrirMais == true) {
      fetchAllEmpenhos3D(selectedItem.id).then((d: any) => {
        setData(d);
        centerScene(d);
      });
    } else {
      fetchAllEmpenhos3D("").then((d: any) => {
        setData(d);
        centerScene(d);
      });
    }
  }, [selectedItem, selectedAbrirMais]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedItem(null);
      }
    };
    if (selectedItem && selectedAbrirMais) {
      window.addEventListener("keydown", handleEsc);
    }
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [selectedItem]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedAbrirMais(false);
      }
    };
    if (selectedAbrirMais) {
      window.addEventListener("keydown", handleEsc);
    }
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [selectedAbrirMais]);

  return (
    <div className="flex w-screen h-screen">
      {/* Painel lateral fixo */}
      <div className="w-[320px] bg-[#f8f9fa] p-4 border-r border-[#ccc] overflow-y-auto shrink-0">
        <h2 className="mt-2 mb-2 text-xl">Detalhes do Item</h2>
        {selectedItem ? (
          <>
            <p><strong>ID:</strong> {selectedItem.id}</p>
            <p className="mt-4"><strong>Descrição:</strong> {selectedItem.descricao}</p>
            <p className="mt-4"><strong>Número de empenhos:</strong> {selectedItem.num_empenhos}</p>
            

            <p className="mt-4"><strong>Variação nas coordenadas X, Y e Z:</strong></p>
            <ul>
              <li><strong>X:</strong> {selectedItem.var_x.toFixed(2)}</li>
              <li><strong>Y:</strong> {selectedItem.var_y.toFixed(2)}</li>
              <li><strong>Z:</strong> {selectedItem.var_z.toFixed(2)}</li>
            </ul>
            <div className="grid grid-cols-1">
              <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-semibold" onClick={() => setSelectedAbrirMais(true)}>Abrir detalhes</button>
              <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-semibold" onClick={() => setSelectedItem(null)}>Fechar</button>
            </div>
          </>
        ) : (
          <div>
            <div className="mt-1 mb-1">Existem 129 pontos.</div>
            <div className="mt-1 mb-1">Selecione um ponto para ver os detalhes.</div>
          </div>
        )}
      </div>

      {/* Área 3D */}
      <div className="flex-1">
        <Canvas camera={{ position: [0, 0, 5] }}>
          <ambientLight />
          <pointLight position={[10, 10, 10]} />
          <OrbitControls
            ref={controlsRef}
            makeDefault
            autoRotate
            autoRotateSpeed={0.1}
          />
          <AutoRotatePause controlsRef={controlsRef} />
          <perspectiveCamera ref={cameraRef} />
          <GizmoHelper alignment="top-left" margin={[80, 80]}>
            <GizmoViewport axisColors={['#ff0000', '#00ff00', '#0000ff']} labelColor="#fff" />
          </GizmoHelper>

          <>
          {!selectedAbrirMais &&(
            <>
            {data.map((item) => (
            <Sphere
              key={item.id}
              item={item}
              hoveredItem={hoveredItem}
              selectedAbrirMais={selectedAbrirMais}
              setHoveredItem={setHoveredItem}
              setSelectedItem={setSelectedItem}
              setSelectedEmpenho={setSelectedEmpenho}
            />
            ))}
            </>
          )}
          </>

          <>
          {selectedAbrirMais &&(
            <>
            {data.map((item) => (
            <Sphere
              key={item.id}
              item={item}
              hoveredItem={hoveredItem}
              selectedAbrirMais={selectedAbrirMais}
              setHoveredItem={setHoveredItem}
              setSelectedItem={setSelectedItem}
              setSelectedEmpenho={setSelectedEmpenho}
            />
            ))}
            </>
          )}
          </>
          
          
        </Canvas>
      </div>
    </div>
  );
};
