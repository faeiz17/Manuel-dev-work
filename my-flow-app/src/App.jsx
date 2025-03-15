// App.jsx
import React, { useCallback } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  addEdge,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css"; // important: styles for React Flow

function App() {
  // -- Initial data: you can start with a couple of nodes, or keep it empty.
  const initialNodes = [
    {
      id: "1",
      type: "input",
      data: { label: "Input Node" },
      position: { x: 0, y: 0 },
    },
    {
      id: "2",
      data: { label: "Another Node" },
      position: { x: 200, y: 0 },
    },
  ];

  const initialEdges = [];

  // -- React Flow provides hooks to easily manage state for nodes and edges.
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // -- Called whenever a new connection (edge) is made between two nodes.
  const onConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  // -- Example function to add a new node at a random position.
  const handleAddNode = () => {
    const newId = (nodes.length + 1).toString();
    const newNode = {
      id: newId,
      data: { label: `Node ${newId}` },
      position: { x: Math.random() * 400, y: Math.random() * 200 },
    };

    setNodes((nds) => nds.concat(newNode));
  };

  // -- (Optional) Handle clicking a node. You could navigate, open a modal, etc.
  const onNodeClick = (event, node) => {
    // For example, navigate to a new page or open a modal:
    // window.open(`/your-node-page/${node.id}`, '_blank');
    alert(`You clicked on node with id: ${node.id}`);
  };

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      {/* A button to add new nodes */}
      <button
        style={{ position: "absolute", zIndex: 10, left: 10, top: 10 }}
        onClick={handleAddNode}
      >
        Add Node
      </button>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick} // (Optional) if you want a click handler
        fitView
      >
        <MiniMap />
        <Controls />
        <Background color="#aaa" gap={16} />
      </ReactFlow>
    </div>
  );
}

export default App;
