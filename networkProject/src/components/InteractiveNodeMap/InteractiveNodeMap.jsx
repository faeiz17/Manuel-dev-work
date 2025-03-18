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
import InfoPage from "./InfoPage";

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

  // ----------------------
  // Existing state
  // ----------------------
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

  // Add/Edit node
  const [dialogAction, setDialogAction] = useState("");
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [newNodeId, setNewNodeId] = useState("");

  // InfoDialog
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const [nodeInfo, setNodeInfo] = useState("");

  // LinkDialog
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkSource, setLinkSource] = useState("");
  const [linkTarget, setLinkTarget] = useState("");

  // DeleteDialog
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Color picker
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  // Tooltip
  const [tooltip, setTooltip] = useState({
    visible: false,
    content: "",
    x: 0,
    y: 0,
  });

  // Context menu
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    nodeId: null,
  });

  // ----------------------
  // NEW: Pen / Link Mode
  // ----------------------
  const [isLinkMode, setIsLinkMode] = useState(false);

  // Temp link while dragging: { sourceId: string, x2: number, y2: number }
  const [tempLink, setTempLink] = useState(null);

  // Refs
  const svgRef = useRef();
  const fileInputRef = useRef();
  const textFileInputRef = useRef();
  const isDragging = useRef(false);
  const draggedNodeId = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const animationFrameId = useRef(null);
  const tooltipTimerRef = useRef(null);
  const clickTimeoutRef = useRef(null);
  const lastClickTimeRef = useRef(0);

  // Force simulation
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
              fx += dx * distance * 0.0015;
              fy += dy * distance * 0.0015;
            }
          }
        });

        // Soft attraction to center
        fx += (400 - node.x) * 0.005;
        fy += (300 - node.y) * 0.005;

        // Damping
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
      // Normal drag for moving nodes
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
      // NEW for link dragging
      else if (tempLink) {
        const svgRect = svgRef.current.getBoundingClientRect();
        const x2 = event.clientX - svgRect.left;
        const y2 = event.clientY - svgRect.top;
        setTempLink((prev) => ({ ...prev, x2, y2 }));
      }
    };

    const handleMouseUp = (event) => {
      // End normal drag
      isDragging.current = false;
      draggedNodeId.current = null;

      // If in pen mode & we have a tempLink, see if we ended on a node
      if (isLinkMode && tempLink) {
        const svgRect = svgRef.current.getBoundingClientRect();
        const mouseX = event.clientX - svgRect.left;
        const mouseY = event.clientY - svgRect.top;

        // Find if there's a node near the mouse
        let targetNode = null;
        const radius = 20; // radius tolerance for linking
        for (const node of nodes) {
          const dx = mouseX - node.x;
          const dy = mouseY - node.y;
          if (Math.sqrt(dx * dx + dy * dy) < radius) {
            targetNode = node;
            break;
          }
        }

        // If we found a node, create the link
        if (targetNode && targetNode.id !== tempLink.sourceId) {
          const alreadyExists = links.some(
            (l) =>
              (l.source === tempLink.sourceId && l.target === targetNode.id) ||
              (l.source === targetNode.id && l.target === tempLink.sourceId)
          );
          if (!alreadyExists) {
            setLinks((prevLinks) => [
              ...prevLinks,
              { source: tempLink.sourceId, target: targetNode.id },
            ]);
          }
        }

        // Clear the temp link
        setTempLink(null);
      }
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
  }, [tempLink, isLinkMode, links, nodes]);

  // Double-click => open info
  const handleNodeDoubleClick = useCallback((node, event) => {
    event.stopPropagation();
    setSelectedNode(node);
    setNodeInfo(node.info || "");
    setIsInfoDialogOpen(true);
  }, []);

  // Single-click => (or double-click detection logic)
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

  // Mouse down on a node
  const handleNodeMouseDown = useCallback(
    (event, node) => {
      event.stopPropagation();

      // 1) If we're in "pen mode", on left-click, start a temp link
      if (isLinkMode && event.button === 0) {
        setTempLink({
          sourceId: node.id,
          x2: node.x,
          y2: node.y,
        });
        return;
      }

      // 2) If user right-clicked => context menu
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

      // 3) Otherwise => normal drag with left button
      if (event.button === 0) {
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
      }
    },
    [isLinkMode]
  );

  // Hover => tooltip
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
      setNodeInfo(selectedNode.info || "");
      setIsInfoDialogOpen(true);
      setContextMenu((prev) => ({ ...prev, visible: false }));
    } else if (action === "changeColor") {
      setIsColorPickerOpen(true);
      setContextMenu((prev) => ({ ...prev, visible: false }));
    }
  };

  // ----------------------
  // Add / Edit / Delete
  // ----------------------
  const openAddEditDialog = (action) => {
    setDialogAction(action);
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

      // Update links
      setLinks((prevLinks) =>
        prevLinks.map((link) => ({
          source: link.source === oldId ? newId : link.source,
          target: link.target === oldId ? newId : link.target,
        }))
      );

      setSelectedNode(null);
    }
  };

  // ----------------------
  // Info
  // ----------------------
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

  // ----------------------
  // Link creation by Dialog
  // ----------------------
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

  // ----------------------
  // Color
  // ----------------------
  const changeNodeColor = (color) => {
    if (selectedNode) {
      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === selectedNode.id ? { ...node, color } : node
        )
      );
    }
    setIsColorPickerOpen(false);
  };

  // ----------------------
  // Save / Load
  // ----------------------
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

  // ----------------------
  // Text file -> Node
  // ----------------------
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
    <div
      style={{
        padding: 16,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
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
        isLinkMode={isLinkMode}
        setIsLinkMode={setIsLinkMode}
      />
      <div style={{ flex: 1, display: "flex", gap: 16 }}>
        <div
          style={{
            flexGrow: 1,
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
          {tempLink && (
            <svg
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                pointerEvents: "none",
                width: "100%",
                height: "100%",
              }}
            >
              {(() => {
                const sourceNode = nodes.find(
                  (n) => n.id === tempLink.sourceId
                );
                if (!sourceNode) return null;
                return (
                  <line
                    x1={sourceNode.x}
                    y1={sourceNode.y}
                    x2={tempLink.x2}
                    y2={tempLink.y2}
                    stroke="black"
                    strokeWidth="2"
                  />
                );
              })()}
            </svg>
          )}
        </div>
        <div style={{ width: 300, borderLeft: "1px solid #ccc" }}>
          {selectedNode ? (
            <InfoPage
              nodeInfo={nodeInfo}
              setNodeInfo={setNodeInfo}
              onSave={saveNodeInfo}
              onCancel={() => {}}
              selectedNode={selectedNode}
            />
          ) : (
            <div style={{ padding: 16 }}>Select a node to see its info</div>
          )}
        </div>
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

      {/* Add/Edit Dialog */}
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
