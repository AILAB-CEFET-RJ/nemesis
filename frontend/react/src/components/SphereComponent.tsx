import { Empenho3DItem } from "../pages/visualizacao3D/types";
import { Html } from "@react-three/drei";


interface SphereProps {
  item: Empenho3DItem;
  hoveredItem: Empenho3DItem | null;
  setHoveredItem: (item: Empenho3DItem | null) => void;
  setSelectedElem: (item: Empenho3DItem | null) => void;
  setSelectedEmpenho: (item: Empenho3DItem | null) => void;
  selectedAbrirMais: boolean;
}



export const Sphere: React.FC<SphereProps> = ({
  item,
  hoveredItem,
  selectedAbrirMais,
  setHoveredItem,
  setSelectedElem,
  setSelectedEmpenho,
}) => (
<group position={[item.x, item.y, item.z]}>
  {/* HITBOX invisível (somente para interação) */}
  <mesh
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
        setSelectedElem(item);
      }
    }}
  >
    {/* esfera maior para detecção */}
    <sphereGeometry args={[0.15, 8, 8]} /> 
    <meshBasicMaterial transparent opacity={0} /> 
  </mesh>

  {/* ESFERA visível (não interativa) */}
  <mesh>
    <sphereGeometry args={[0.05, 16, 16]} />
    <meshStandardMaterial color={item.color || "#1f77b4"} />
  </mesh>

  {/* TOOLTIP */}
  {hoveredItem?.elemdespesatce === item.elemdespesatce && (
    <Html
      distanceFactor={6}
      transform
      sprite
      style={{ pointerEvents: "none" }}
    >
      <div
        className={`bg-white px-4 py-2 rounded-lg shadow-md text-sm flex flex-col gap-1 w-max cursor-default select-none ${
          selectedAbrirMais ? "-translate-y-12" : "-translate-y-6"
        }`}
      >
        <span className="font-semibold text-gray-800">
          {selectedAbrirMais ? item.id : item.elemdespesatce}
        </span>
        {selectedAbrirMais && (
          <div className="grid grid-cols-1">
            <span className="text-gray-600 whitespace-nowrap">
              {item.dt_empenho
                ? new Date(item.dt_empenho).toLocaleDateString("pt-BR")
                : "Data indisponível"}
            </span>
            <span className="text-green-700 font-medium">
              {Number(item.vlr_empenho).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          </div>
        )}
      </div>
    </Html>
  )}
</group>

);
