# Visualização 3D de Itens de Empenho – NEMESIS

Este módulo implementa uma visualização interativa em 3D dos **itens de notas de empenho** no sistema NEMESIS. Cada ponto no espaço representa um item de despesa pública, posicionado por embeddings ou projeções geradas previamente, e agrupado por similaridade.

---

## 📁 Estrutura

O código da visualização está localizado em:

```
frontend/react/src/features/visualizacao3D/
```

Arquivos principais:

- `Empenho3DCanvas.tsx` – Componente principal com visualização 3D, interação e painel de detalhes
- `Visualizacao3DPage.tsx` – Página wrapper para o componente de canvas
- `dataFetcher.ts` – Função para buscar os dados da API
- `types.ts` – Tipagem do item de empenho
- `mockData.json` – Exemplo de dados locais

---

## 🎥 Funcionalidades

✅ Visualização 3D com navegação via mouse (giro, zoom, pan)  
✅ Cada ponto representa um **item de empenho**  
✅ Tooltip com informações ao passar o mouse  
✅ Clique para exibir **painel lateral com detalhes completos**  
✅ Layout responsivo (painel fixo à direita do canvas)  
✅ Suporte a dados mockados ou API real

---

## 🚀 Como testar

1. Instale as dependências do frontend:

```bash
cd frontend/react
npm install
npm install @react-three/fiber @react-three/drei
```

2. Garanta que o backend esteja rodando em `http://localhost:8000` com o endpoint `/api/empenhos-3d`.

3. Rode o frontend:

```bash
npm start
```

Acesse: [http://localhost:3000](http://localhost:3000)

---

## 🔍 Exemplo de formato dos dados esperados

A API deve retornar uma lista de objetos como este:

```json
{
  "id": "item-123",
  "descricao": "Compra de papel A4",
  "x": 0.1,
  "y": -0.3,
  "z": 0.7,
  "color": "#ff5733"
}
```

---

## 🛠️ Próximas melhorias

- 🎯 Foco automático na esfera selecionada
- 🧭 Legenda para clusters
- 🎛️ Filtros interativos por unidade gestora, tipo de despesa ou fornecedor
- 📈 Gráficos ou timelines no painel lateral

---

## 📎 Requisitos

- Node.js ≥ 16
- Navegador moderno com WebGL habilitado
- Backend FastAPI servindo `/api/empenhos-3d` com CORS liberado para `localhost:3000`

---

## 📄 Licença

Este módulo faz parte do sistema NEMESIS – [MIT License](LICENSE)
