import { Empenho3DItem } from "../pages/visualizacao3D/types";
import { Html } from "@react-three/drei";


interface SphereProps {
  item: Empenho3DItem;
  hoveredItem: Empenho3DItem | null;
  setHoveredItem: (item: Empenho3DItem | null) => void;
  setSelectedItem: (item: Empenho3DItem | null) => void;
  setSelectedEmpenho: (item: Empenho3DItem | null) => void;
  selectedAbrirMais: boolean;
}



export const Sphere: React.FC<SphereProps> = ({
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
