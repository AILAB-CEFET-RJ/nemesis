import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, GizmoHelper, GizmoViewport } from "@react-three/drei";
import { fetchAllEmpenhos3D, fetchAutoComplete } from "../../utils/dataFetcher";
import { Empenho3DItem } from "./types";
import { PerspectiveCamera } from "three";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { AutoRotatePause } from "./AutoRotatePause";
import { Sphere } from "../../components/SphereComponent"
import { Suggestion } from '../consultaEmpenhos/types'
import { ModalCanvas3D } from "./ModalCanvas3D";

interface canvasprops {
  ente: string;
  unidade: string;
  setabrir3d: Dispatch<SetStateAction<boolean>>;
}


export default function Empenho3DCanvas({ente, unidade, setabrir3d}: canvasprops) {

  const [data, setData] = useState<Empenho3DItem[]>([]);
  const [hoveredItem, setHoveredItem] = useState<Empenho3DItem | null>(null);
  const [selectedElem, setSelectedElem] = useState<Empenho3DItem | null>(null);
  const [selectedEmpenho, setSelectedEmpenho] = useState<Empenho3DItem | null>(null);
  const [selectedAbrirMais, setSelectedAbrirMais] = useState<boolean>(false);
  const prevAbrirMais = useRef<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
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
  const loadData = async () => {
    try {
      const filtro = selectedElem !== null && selectedAbrirMais === true
        ? selectedElem.elemdespesatce
        : "";

      const d = await fetchAllEmpenhos3D(filtro, ente, unidade);
      setData(d);
      centerScene(d);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  loadData();
}, [selectedElem, selectedAbrirMais]);

  useEffect(() => {
    if (selectedAbrirMais) {
      setLoading(true);
    }

    if (prevAbrirMais.current === true && selectedAbrirMais === false) {
      // só roda quando mudou de true para false
      setLoading(true);
    }

    prevAbrirMais.current = selectedAbrirMais;
  }, [selectedElem, selectedAbrirMais]);

  
  useEffect(() => {
    const handleEscElem = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedElem(null); // desseleciona um elemento despesa 
      }
    };

    // const handleEscEmpenhos = (event: KeyboardEvent) => {
    //   if (event.key === "Escape") {
    //     setSelectedAbrirMais(false); // fecha o nível dos empenhos_within_elem
    //   }
    // };

    const handleEscItemEmpenho = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedEmpenho(null); // desseleciona um item de empenho
      }
    };

  // if (selectedAbrirMais) { 
  //   window.addEventListener("keydown", handleEscEmpenhos);
  // }
  if (selectedElem && !selectedEmpenho && !selectedAbrirMais) {
    window.addEventListener("keydown", handleEscElem);
  }
  if (selectedElem && selectedEmpenho){
    window.addEventListener("keydown", handleEscItemEmpenho);
  }
  return () => {
    window.removeEventListener("keydown", handleEscElem);
    // window.removeEventListener("keydown", handleEscEmpenhos);
    window.removeEventListener("keydown", handleEscItemEmpenho);
  };
}, [selectedElem, selectedEmpenho, selectedAbrirMais]);


  const handleChange = (value: string) => {
    setConsultaElem(value); 
    
    // Clear existing timer for this field
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // Start a new timer
    timeoutRef.current = setTimeout(() => {
      fetchAutoComplete(value, 2, unidade).then((data: Suggestion[]) => {
        setSuggestionsElemDespesa(Array.isArray(data) ? data : []);
      }); // type = 1, pois é o Elemento da Despesa
    }, 300); 
  };

  const handleClick = (value: string) => {
    
    const match = data.find((item) =>
    item.elemdespesatce.includes(value)
    );
    if (match) {
      console.log(value);
      setSelectedElem(match);
    }
  }


  return (
    <div className="flex w-screen h-screen">
      <ModalCanvas3D
        handleChange={handleChange}
        handleClick={handleClick}
        ente={ente}
        unidade={unidade}
        setabrir3d={setabrir3d}
        selectedElem={selectedElem}
        setSelectedElem={setSelectedElem}
        selectedAbrirMais={selectedAbrirMais}
        setSelectedAbrirMais={setSelectedAbrirMais}
        data={data}
        consultaElem={consultaElem}
        suggestionsElemDespesa={suggestionsElemDespesa}
        setSelectedEmpenho={setSelectedEmpenho}
        selectedEmpenho={selectedEmpenho}
      />

      {/* Área 3D */}
      {(loading || data.length === 0 ) && (
        <div className="flex-1 flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-blue-600 border-opacity-50"></div>
            <span className="ml-3 text-gray-600">Carregando...</span>
        </div>  
      )}
      
      {data.length > 0 && !loading && (
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
              setSelectedElem={setSelectedElem}
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
              setSelectedElem={setSelectedElem}
              setSelectedEmpenho={setSelectedEmpenho}
            />
            ))}
            </>
          )}
          </>
          
          
        </Canvas>
      </div>
      )}
      
    </div>
  );
};
