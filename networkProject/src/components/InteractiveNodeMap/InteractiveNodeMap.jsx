import React, { useState, useEffect, useRef, useCallback } from "react";
import ControlPanel from "./ControlPanel";
import MapCanvas from "./MapCanvas";
import InfoDialog from "./InfoDialog";
import LinkDialog from "./LinkDialog";
import DeleteDialog from "./DeleteDialog";
import ColorPickerDialog from "./ColorPickerDialog";
import AddEditDialog from "./AddEditDialog";
import ContextMenu from "./ContextMenu";
import Tooltip from "./Tooltip";

const InteractiveNodeMap = () => {
  // Pastel color palette
  const pastelColors = [
    "#FFB3BA",
    "#BAFFC9",
    "#BAE1FF",
    "#FFFFBA",
    "#FFDFBA",
    "#E0BBE4",
    "#C4A5DE",
    "#B5EAD7",
    "#FF9AA2",
    "#C7CEEA",
    "#FFD1DC",
    "#A5DEE5",
    "#DCEDC1",
    "#FFD3B6",
    "#D0EFB5",
    "#B5D8EB",
    "#F0B5D4",
    "#D8BFD8",
  ];

  // State: nodes & links
  const [nodes, setNodes] = useState([
    {
      id: "Philosophy",
      x: 300,
      y: 100,
      vx: 0,
      vy: 0,
      color: pastelColors[0],
      info: "Study of fundamental questions about existence, knowledge, truth, morality, beauty, the mind, and language.",
    },
    {
      id: "Stoicism",
      x: 200,
      y: 200,
      vx: 0,
      vy: 0,
      color: pastelColors[1],
      info: "A philosophical school founded by Zeno of Citium in the 3rd century BC, emphasizing virtue and self-control.",
    },
    {
      id: "Marcus Aurelius",
      x: 100,
      y: 300,
      vx: 0,
      vy: 0,
      color: pastelColors[2],
      info: 'Roman Emperor and Stoic philosopher, author of "Meditations."',
    },
    {
      id: "Epicureanism",
      x: 400,
      y: 200,
      vx: 0,
      vy: 0,
      color: pastelColors[3],
      info: "A philosophy founded by Epicurus that seeks happiness through the absence of pain and the cultivation of friendships.",
    },
    {
      id: "Platonism",
      x: 500,
      y: 300,
      vx: 0,
      vy: 0,
      color: pastelColors[4],
      info: "A philosophy derived from the teachings of Plato that emphasizes eternal ideas or forms.",
    },
  ]);

  const [links, setLinks] = useState([
    { source: "Philosophy", target: "Stoicism" },
    { source: "Philosophy", target: "Epicureanism" },
    { source: "Philosophy", target: "Platonism" },
    { source: "Stoicism", target: "Marcus Aurelius" },
  ]);

  // Interaction states
  const [selectedNode, setSelectedNode] = useState(null);

  // For Add/Edit node
  const [dialogAction, setDialogAction] = useState(""); // "add" | "edit" | "delete"
  const [isAddEditOpen, setIsAddEditOpen] = useState(false); // specifically for AddEditDialog
  const [newNodeId, setNewNodeId] = useState("");

  // For InfoDialog
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const [nodeInfo, setNodeInfo] = useState("");

  // For LinkDialog
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkSource, setLinkSource] = useState("");
  const [linkTarget, setLinkTarget] = useState("");

  // For DeleteDialog
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // For color picker
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  // For tooltip
  const [tooltip, setTooltip] = useState({
    visible: false,
    content: "",
    x: 0,
    y: 0,
  });

  // Context menu state
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    nodeId: null,
  });

  // Refs
  const svgRef = useRef();
  const fileInputRef = useRef(); // .json
  const textFileInputRef = useRef(); // .txt
  const isDragging = useRef(false);
  const draggedNodeId = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const animationFrameId = useRef(null);
  const tooltipTimerRef = useRef(null);
  const clickTimeoutRef = useRef(null);
  const lastClickTimeRef = useRef(0);

  // ====== Force simulation (with higher damping + lower repulsion) ======
  const applyForces = useCallback(() => {
    setNodes((prevNodes) => {
      return prevNodes.map((node) => {
        if (node.id === draggedNodeId.current) return node;

        let fx = 0,
          fy = 0;

        // Node repulsion
        prevNodes.forEach((otherNode) => {
          if (node.id !== otherNode.id) {
            const dx = node.x - otherNode.x;
            const dy = node.y - otherNode.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > 0 && distance < 200) {
              // Less repulsion factor => 300 instead of 600
              const force = (1 / (distance * distance)) * 300;
              fx += dx * force;
              fy += dy * force;
            }
          }
        });

        // Link attraction
        links.forEach((link) => {
          if (link.source === node.id || link.target === node.id) {
            const otherNode = prevNodes.find(
              (n) =>
                n.id === (link.source === node.id ? link.target : link.source)
            );
            if (otherNode) {
              const dx = otherNode.x - node.x;
              const dy = otherNode.y - node.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              // same multiplier => 0.0015
              fx += dx * distance * 0.0015;
              fy += dy * distance * 0.0015;
            }
          }
        });

        // Soft attraction to center
        fx += (400 - node.x) * 0.005;
        fy += (300 - node.y) * 0.005;

        // High damping => stops shaking faster
        const vx = (node.vx + fx) * 0.9;
        const vy = (node.vy + fy) * 0.9;
        const x = Math.max(30, Math.min(770, node.x + vx));
        const y = Math.max(30, Math.min(570, node.y + vy));

        return { ...node, x, y, vx, vy };
      });
    });

    animationFrameId.current = requestAnimationFrame(applyForces);
  }, [links]);

  useEffect(() => {
    applyForces();
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [applyForces]);

  // ====== Mouse & Drag Handlers ======
  useEffect(() => {
    const handleMouseMove = (event) => {
      if (isDragging.current && draggedNodeId.current) {
        const svgRect = svgRef.current.getBoundingClientRect();
        const newX = event.clientX - svgRect.left - dragOffset.current.x;
        const newY = event.clientY - svgRect.top - dragOffset.current.y;
        setNodes((prevNodes) =>
          prevNodes.map((node) =>
            node.id === draggedNodeId.current
              ? { ...node, x: newX, y: newY, vx: 0, vy: 0 }
              : node
          )
        );
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      draggedNodeId.current = null;
    };

    // Close context menu on global click
    const handleGlobalClick = () => {
      setContextMenu((prev) => ({ ...prev, visible: false }));
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("click", handleGlobalClick);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("click", handleGlobalClick);
    };
  }, []);

  const handleNodeDoubleClick = useCallback((node, event) => {
    event.stopPropagation();
    setSelectedNode(node);
    setNodeInfo(node.info || "");
    setIsInfoDialogOpen(true);
  }, []);

  const handleNodeClick = useCallback(
    (node, event) => {
      event.stopPropagation();
      const currentTime = new Date().getTime();
      const timeDiff = currentTime - lastClickTimeRef.current;

      if (timeDiff < 300) {
        clearTimeout(clickTimeoutRef.current);
        handleNodeDoubleClick(node, event);
      } else {
        clickTimeoutRef.current = setTimeout(() => {
          // Single click => nothing
        }, 300);
      }
      lastClickTimeRef.current = currentTime;
    },
    [handleNodeDoubleClick]
  );

  const handleNodeMouseDown = useCallback((event, node) => {
    event.stopPropagation();
    // Right-click => context menu
    if (event.button === 2) {
      event.preventDefault();
      setSelectedNode(node);
      setContextMenu({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        nodeId: node.id,
      });
      return;
    }
    // Left-click => drag
    setSelectedNode(node);
    draggedNodeId.current = node.id;

    const svgRect = svgRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: event.clientX - svgRect.left - node.x,
      y: event.clientY - svgRect.top - node.y,
    };

    setTimeout(() => {
      if (draggedNodeId.current === node.id) {
        isDragging.current = true;
      }
    }, 100);
  }, []);

  const handleNodeMouseEnter = useCallback((node) => {
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    tooltipTimerRef.current = setTimeout(() => {
      const svgRect = svgRef.current.getBoundingClientRect();
      setTooltip({
        visible: true,
        content: node.info || node.id,
        x: node.x + svgRect.left,
        y: node.y + svgRect.top - 30,
      });
    }, 1500);
  }, []);

  const handleNodeMouseLeave = useCallback(() => {
    if (tooltipTimerRef.current) {
      clearTimeout(tooltipTimerRef.current);
      tooltipTimerRef.current = null;
    }
    setTooltip({ visible: false, content: "", x: 0, y: 0 });
  }, []);

  const handleContextMenu = useCallback((event) => {
    event.preventDefault();
  }, []);

  const handleContextMenuAction = (action) => {
    if (!selectedNode) return;
    if (action === "edit") {
      // Show info text edit
      setNodeInfo(selectedNode.info || "");
      setIsInfoDialogOpen(true);
      setContextMenu((prev) => ({ ...prev, visible: false }));
    } else if (action === "changeColor") {
      setIsColorPickerOpen(true);
      setContextMenu((prev) => ({ ...prev, visible: false }));
    }
  };

  // ====== Add / Edit / Delete logic ======
  const openAddEditDialog = (action) => {
    setDialogAction(action); // "add" or "edit"
    if (action === "edit" && selectedNode) {
      setNewNodeId(selectedNode.id);
    } else {
      setNewNodeId("");
    }
    setIsAddEditOpen(true);
  };

  const handleAddEditConfirm = () => {
    if (dialogAction === "add") {
      addNode();
    } else if (dialogAction === "edit") {
      editNode();
    }
    setIsAddEditOpen(false);
  };

  const openDeleteDialog = () => {
    setDialogAction("delete");
    setIsDeleteOpen(true);
  };

  const deleteNode = () => {
    if (selectedNode) {
      setNodes((prevNodes) =>
        prevNodes.filter((node) => node.id !== selectedNode.id)
      );
      setLinks((prevLinks) =>
        prevLinks.filter(
          (link) =>
            link.source !== selectedNode.id && link.target !== selectedNode.id
        )
      );
      setSelectedNode(null);
    }
    setIsDeleteOpen(false);
  };

  const addNode = () => {
    if (newNodeId.trim()) {
      const newNode = {
        id: newNodeId.trim(),
        x: Math.random() * 700 + 50,
        y: Math.random() * 500 + 50,
        vx: 0,
        vy: 0,
        color: pastelColors[Math.floor(Math.random() * pastelColors.length)],
        info: "",
      };
      setNodes((prevNodes) => [...prevNodes, newNode]);
    }
  };

  const editNode = () => {
    if (selectedNode && newNodeId.trim()) {
      const oldId = selectedNode.id;
      const newId = newNodeId.trim();

      // Update node ID
      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === oldId ? { ...node, id: newId } : node
        )
      );

      // Update links to reflect new ID
      setLinks((prevLinks) =>
        prevLinks.map((link) => ({
          source: link.source === oldId ? newId : link.source,
          target: link.target === oldId ? newId : link.target,
        }))
      );

      setSelectedNode(null);
    }
  };

  // ====== Info saving ======
  const saveNodeInfo = () => {
    if (selectedNode) {
      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === selectedNode.id ? { ...node, info: nodeInfo } : node
        )
      );
    }
    setIsInfoDialogOpen(false);
  };

  // ====== Link creation ======
  const openLinkDialog = () => {
    setLinkSource("");
    setLinkTarget("");
    setIsLinkDialogOpen(true);
  };

  const addLink = () => {
    if (linkSource && linkTarget && linkSource !== linkTarget) {
      const exists = links.some(
        (link) =>
          (link.source === linkSource && link.target === linkTarget) ||
          (link.source === linkTarget && link.target === linkSource)
      );
      if (!exists) {
        setLinks((prevLinks) => [
          ...prevLinks,
          { source: linkSource, target: linkTarget },
        ]);
      }
    }
    setIsLinkDialogOpen(false);
  };

  // ====== Color change ======
  const changeNodeColor = (color) => {
    if (selectedNode) {
      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === selectedNode.id ? { ...node, color: color } : node
        )
      );
    }
    setIsColorPickerOpen(false);
  };

  // ====== Save / Load map ======
  const saveMap = () => {
    const data = {
      nodes: nodes.map(({ id, color, x, y, info }) => ({
        id,
        color,
        x,
        y,
        info,
      })),
      links,
    };
    const dataStr = JSON.stringify(data);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = "node_map.json";

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const loadMap = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        try {
          const loadedData = JSON.parse(content);
          const nodesWithInfo = loadedData.nodes.map((node) => ({
            ...node,
            vx: 0,
            vy: 0,
            info: node.info || "",
          }));
          setNodes(nodesWithInfo);
          setLinks(loadedData.links);
        } catch (error) {
          console.error("Error loading file:", error);
        }
      };
      reader.readAsText(file);
    }
  };

  // ====== Text file -> Node ======
  const handleTextFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        const fileName = file.name.split(".")[0] || "NewNode";
        const newNode = {
          id: fileName,
          x: Math.random() * 700 + 50,
          y: Math.random() * 500 + 50,
          vx: 0,
          vy: 0,
          color: pastelColors[Math.floor(Math.random() * pastelColors.length)],
          info: content,
        };
        setNodes((prevNodes) => [...prevNodes, newNode]);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <ControlPanel
        onAdd={() => openAddEditDialog("add")}
        onEdit={() => openAddEditDialog("edit")}
        onDelete={openDeleteDialog}
        onCreateLink={openLinkDialog}
        onSave={saveMap}
        onLoad={() => fileInputRef.current.click()}
        onUploadText={() => textFileInputRef.current.click()}
        fileInputRef={fileInputRef}
        selectedNode={selectedNode}
      />
      <div
        style={{
          position: "relative",
          border: "2px solid #ccc",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <MapCanvas
          nodes={nodes}
          links={links}
          svgRef={svgRef}
          onNodeClick={handleNodeClick}
          onNodeMouseDown={handleNodeMouseDown}
          onNodeMouseEnter={handleNodeMouseEnter}
          onNodeMouseLeave={handleNodeMouseLeave}
          onContextMenu={handleContextMenu}
        />
        {tooltip.visible && <Tooltip tooltip={tooltip} />}
      </div>

      {/* Context Menu */}
      <ContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={() => setContextMenu((prev) => ({ ...prev, visible: false }))}
        onEdit={() => handleContextMenuAction("edit")}
        onChangeColor={() => handleContextMenuAction("changeColor")}
      />

      {/* Info Dialog */}
      <InfoDialog
        open={isInfoDialogOpen}
        onClose={() => setIsInfoDialogOpen(false)}
        nodeInfo={nodeInfo}
        setNodeInfo={setNodeInfo}
        onSave={saveNodeInfo}
        selectedNode={selectedNode}
      />

      {/* Link Dialog */}
      <LinkDialog
        open={isLinkDialogOpen}
        onClose={() => setIsLinkDialogOpen(false)}
        linkSource={linkSource}
        setLinkSource={setLinkSource}
        linkTarget={linkTarget}
        setLinkTarget={setLinkTarget}
        onCreateLink={addLink}
        nodes={nodes}
      />

      {/* Delete Dialog */}
      <DeleteDialog
        open={isDeleteOpen && dialogAction === "delete"}
        onClose={() => setIsDeleteOpen(false)}
        selectedNode={selectedNode}
        onDelete={deleteNode}
      />

      {/* Color Picker */}
      <ColorPickerDialog
        open={isColorPickerOpen}
        onClose={() => setIsColorPickerOpen(false)}
        pastelColors={pastelColors}
        onSelectColor={changeNodeColor}
        selectedNode={selectedNode}
      />

      {/* Add/Edit Dialog (NEW) */}
      <AddEditDialog
        open={
          isAddEditOpen && (dialogAction === "add" || dialogAction === "edit")
        }
        onClose={() => setIsAddEditOpen(false)}
        dialogAction={dialogAction}
        newNodeId={newNodeId}
        setNewNodeId={setNewNodeId}
        selectedNode={selectedNode}
        onConfirm={handleAddEditConfirm}
      />

      {/* Hidden file inputs */}
      <input
        type="file"
        onChange={loadMap}
        accept=".json"
        ref={fileInputRef}
        style={{ display: "none" }}
      />
      <input
        type="file"
        onChange={handleTextFileUpload}
        accept="text/plain"
        ref={textFileInputRef}
        style={{ display: "none" }}
      />
    </div>
  );
};

export default InteractiveNodeMap;
