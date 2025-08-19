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

type Suggestion = {
  best_match: string;
  score: number;
};

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
  const [consultaElem, setConsultaElem] = useState<string>("");
  const [suggestionsElemDespesa, setSuggestionsElemDespesa] = useState<Suggestion[]>([])



  const cameraRef = useRef<PerspectiveCamera>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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


  // TODO: colocar em dataFetcher
  const fetchAutoComplete = async (query: string, type: number) => {
    if (!query.trim()) {
      return [];
    }

    try {
      const payload = { consulta: query, tipo: type };
      const response = await fetch("http://localhost:8000/api/auto-filling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();  
      return data;

    } catch (err) {
      console.error("Erro ao buscar sugestões:", err);
      return err;
    } 
    // finally {
    //   setLoading(false);
    // }
  };



  const handleChange = (value: string) => {
    setConsultaElem(value); 
    // Clear existing timer for this field
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // Start a new timer
    timeoutRef.current = setTimeout(() => {
      fetchAutoComplete(value, 1).then((data) => {
        setSuggestionsElemDespesa(Array.isArray(data) ? data : []);
      }); // type = 1, pois é o Elemento da Despesa
    }, 300); 
  };

  return (
    <div className="flex w-screen h-screen">
      {/* Painel lateral fixo */}
      <div className="w-[320px] bg-[#f8f9fa] p-4 border-r border-[#ccc] overflow-y-auto shrink-0">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <span>📍</span> Detalhes do Item
        </h2>
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
            <p className="mt-2 text-sm text-gray-600">
              Existem <span className="font-medium text-blue-600">129 pontos</span>.
            </p>
            <p className="text-sm text-gray-500">
              Selecione um ponto para ver os detalhes ou faça uma pesquisa manualmente abaixo.
            </p>
            <div className="mt-4 relative">
              <textarea
                value={consultaElem}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="Digite o Elemento da Despesa"
                rows={4}
                className="w-full rounded-xl border border-gray-300 pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="absolute left-3 top-2 text-gray-400">🔍</span>
            </div>
            <div>
              <ul>
                {suggestionsElemDespesa.map((s, idx) => (
                  <li key={idx}>{s.best_match}</li>
                ))}
              </ul>
            </div>

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
