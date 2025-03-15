import React, { useState, useEffect, useRef, useCallback } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Grid from "@mui/material/Grid";

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

  // State for nodes and links
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState("");
  const [newNodeId, setNewNodeId] = useState("");
  const [nodeInfo, setNodeInfo] = useState("");
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkSource, setLinkSource] = useState("");
  const [linkTarget, setLinkTarget] = useState("");
  const [tooltip, setTooltip] = useState({
    visible: false,
    content: "",
    x: 0,
    y: 0,
  });

  // Context menu state (using MUI Menu)
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    nodeId: null,
  });

  // Color picker state
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  // Refs
  const svgRef = useRef();
  const isDragging = useRef(false);
  const draggedNodeId = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const animationFrameId = useRef(null);
  const fileInputRef = useRef();
  const tooltipTimerRef = useRef(null);
  const clickTimeoutRef = useRef(null);
  const lastClickTimeRef = useRef(0);

  // Force simulation function
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
              const force = (1 / (distance * distance)) * 600;
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

        // Soft attraction to the center
        fx += (400 - node.x) * 0.005;
        fy += (300 - node.y) * 0.005;

        // Update velocity and position with damping
        const vx = (node.vx + fx) * 0.7;
        const vy = (node.vy + fy) * 0.7;
        const x = Math.max(30, Math.min(770, node.x + vx));
        const y = Math.max(30, Math.min(570, node.y + vy));

        return { ...node, x, y, vx, vy };
      });
    });

    animationFrameId.current = requestAnimationFrame(applyForces);
  }, [links]);

  // Start the physics simulation
  useEffect(() => {
    applyForces();
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [applyForces]);

  // Handle mouse events for dragging
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

    // Close context menu on any global click
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

  // Handle double-click on nodes
  const handleNodeDoubleClick = useCallback((node, event) => {
    event.stopPropagation();
    setSelectedNode(node);
    setNodeInfo(node.info || "");
    setIsInfoDialogOpen(true);
  }, []);

  // Distinguish single vs. double clicks
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
          // Do nothing on single click
        }, 300);
      }

      lastClickTimeRef.current = currentTime;
    },
    [handleNodeDoubleClick]
  );

  const handleNodeMouseDown = useCallback((event, node) => {
    event.stopPropagation();

    // Handle right-click to show context menu
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

    // Handle left-click for dragging
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
    // Clear any existing tooltip timer
    if (tooltipTimerRef.current) {
      clearTimeout(tooltipTimerRef.current);
    }

    // Set a new timer to show the tooltip after 1.5 seconds
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

  // Prevent default context menu
  const handleContextMenu = useCallback((event) => {
    event.preventDefault();
  }, []);

  // Handle context menu actions
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

  // Dialog handling
  const openDialog = (action) => {
    setDialogAction(action);
    setIsDialogOpen(true);
    if (action === "edit" && selectedNode) {
      setNewNodeId(selectedNode.id);
    } else {
      setNewNodeId("");
    }
  };

  const handleDialogConfirm = () => {
    switch (dialogAction) {
      case "add":
        addNode();
        break;
      case "edit":
        editNode();
        break;
      case "delete":
        deleteNode();
        break;
      default:
        break;
    }
    setIsDialogOpen(false);
  };

  // Change node color
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

  // Node/Link manipulation
  const addNode = () => {
    if (newNodeId) {
      const newNode = {
        id: newNodeId,
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
    if (selectedNode && newNodeId) {
      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === selectedNode.id ? { ...node, id: newNodeId } : node
        )
      );
      setLinks((prevLinks) =>
        prevLinks.map((link) => ({
          source: link.source === selectedNode.id ? newNodeId : link.source,
          target: link.target === selectedNode.id ? newNodeId : link.target,
        }))
      );
      setSelectedNode(null);
    }
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
  };

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

  const openLinkDialog = () => {
    setLinkSource("");
    setLinkTarget("");
    setIsLinkDialogOpen(true);
  };

  const addLink = () => {
    if (linkSource && linkTarget && linkSource !== linkTarget) {
      // Check if the link already exists
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

  // Save/Load the map
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

  return (
    <div style={{ padding: 16 }}>
      {/* Top controls */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <Button
          variant="contained"
          onClick={() => openDialog("add")}
          style={{ backgroundColor: "#1976d2" }}
        >
          Add Node
        </Button>
        <Button
          variant="contained"
          onClick={() => openDialog("edit")}
          disabled={!selectedNode}
          style={{ backgroundColor: "#388e3c" }}
        >
          Edit Node
        </Button>
        <Button
          variant="contained"
          onClick={() => openDialog("delete")}
          disabled={!selectedNode}
          style={{ backgroundColor: "#d32f2f" }}
        >
          Delete Node
        </Button>
        <Button
          variant="contained"
          onClick={openLinkDialog}
          style={{ backgroundColor: "#7b1fa2" }}
        >
          Create Link
        </Button>
        <Button
          variant="contained"
          onClick={saveMap}
          style={{ backgroundColor: "#fbc02d" }}
        >
          Save Map
        </Button>
        <Button
          variant="contained"
          onClick={() => fileInputRef.current.click()}
          style={{ backgroundColor: "#ff9800" }}
        >
          Load Map
        </Button>
        <input
          type="file"
          onChange={loadMap}
          accept=".json"
          ref={fileInputRef}
          style={{ display: "none" }}
        />
      </div>

      {/* SVG container */}
      <div
        style={{
          position: "relative",
          border: "2px solid #ccc",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <svg
          width="800"
          height="600"
          ref={svgRef}
          style={{ backgroundColor: "#f5f5f5" }}
          onContextMenu={handleContextMenu}
        >
          {/* Links */}
          {links.map((link, index) => {
            const sourceNode = nodes.find((node) => node.id === link.source);
            const targetNode = nodes.find((node) => node.id === link.target);
            return sourceNode && targetNode ? (
              <g key={`link-${index}`}>
                <line
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke="#999"
                  strokeWidth="2"
                  strokeOpacity="0.6"
                />
                {/* Directional arrow */}
                <polygon
                  points="0,-6 12,0 0,6"
                  fill="#999"
                  opacity="0.6"
                  transform={`
                    translate(${targetNode.x},${targetNode.y})
                    rotate(${
                      (Math.atan2(
                        targetNode.y - sourceNode.y,
                        targetNode.x - sourceNode.x
                      ) *
                        180) /
                      Math.PI
                    })
                    translate(-12,0)
                  `}
                />
              </g>
            ) : null;
          })}

          {/* Nodes */}
          {nodes.map((node) => (
            <g key={node.id}>
              {/* Node shadow */}
              <circle
                cx={node.x + 2}
                cy={node.y + 2}
                r="22"
                fill="rgba(0,0,0,0.2)"
              />
              {/* Actual node */}
              <circle
                cx={node.x}
                cy={node.y}
                r="20"
                fill={node.color}
                stroke="#fff"
                strokeWidth="2"
                onClick={(e) => handleNodeClick(node, e)}
                onMouseDown={(e) => handleNodeMouseDown(e, node)}
                onMouseEnter={() => handleNodeMouseEnter(node)}
                onMouseLeave={handleNodeMouseLeave}
                style={{ cursor: "move" }}
              />
              {/* Node text */}
              <text
                x={node.x}
                y={node.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="12"
                fontWeight="bold"
                fill="#333"
                style={{ pointerEvents: "none" }}
              >
                {node.id.length > 12
                  ? node.id.substring(0, 10) + "..."
                  : node.id}
              </text>
            </g>
          ))}
        </svg>

        {/* Tooltip */}
        {tooltip.visible && (
          <div
            style={{
              position: "absolute",
              backgroundColor: "#fff",
              padding: 8,
              border: "1px solid #ccc",
              borderRadius: 4,
              boxShadow: "0px 2px 8px rgba(0,0,0,0.2)",
              zIndex: 10,
              maxWidth: 200,
              left: tooltip.x,
              top: tooltip.y,
              transform: "translate(-50%, -100%)",
            }}
          >
            <span style={{ fontSize: 14 }}>{tooltip.content}</span>
          </div>
        )}
      </div>

      {/* MUI Context Menu */}
      <Menu
        open={contextMenu.visible}
        onClose={() => setContextMenu((prev) => ({ ...prev, visible: false }))}
        anchorReference="anchorPosition"
        anchorPosition={{
          top: contextMenu.y,
          left: contextMenu.x,
        }}
      >
        <MenuItem onClick={() => handleContextMenuAction("edit")}>
          Add / Edit Info
        </MenuItem>
        <MenuItem onClick={() => handleContextMenuAction("changeColor")}>
          Change Color
        </MenuItem>
      </Menu>

      {/* Dialog for add/edit/delete node */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogTitle>
          {dialogAction === "add"
            ? "Add Node"
            : dialogAction === "edit"
            ? "Edit Node"
            : "Delete Node"}
        </DialogTitle>
        <DialogContent>
          {dialogAction !== "delete" ? (
            <TextField
              autoFocus
              margin="dense"
              label="Node ID"
              type="text"
              fullWidth
              variant="standard"
              value={newNodeId}
              onChange={(e) => setNewNodeId(e.target.value)}
            />
          ) : (
            <DialogContentText>
              Are you sure you want to delete the node "{selectedNode?.id}"?
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDialogConfirm}>
            {dialogAction === "delete" ? "Delete" : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for node info */}
      <Dialog
        open={isInfoDialogOpen}
        onClose={() => setIsInfoDialogOpen(false)}
      >
        <DialogTitle>
          {selectedNode ? `Info: "${selectedNode.id}"` : "Node Info"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Add or modify additional information for this node.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Node Information"
            type="text"
            multiline
            rows={6}
            fullWidth
            variant="outlined"
            value={nodeInfo}
            onChange={(e) => setNodeInfo(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsInfoDialogOpen(false)}>Cancel</Button>
          <Button onClick={saveNodeInfo}>Save Info</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for creating links */}
      <Dialog
        open={isLinkDialogOpen}
        onClose={() => setIsLinkDialogOpen(false)}
      >
        <DialogTitle>Create Link</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Select the nodes you want to link.
          </DialogContentText>
          <TextField
            margin="dense"
            select
            label="Source Node"
            fullWidth
            variant="standard"
            value={linkSource}
            onChange={(e) => setLinkSource(e.target.value)}
            SelectProps={{ native: true }}
          >
            <option value="">Select a node...</option>
            {nodes.map((node) => (
              <option key={`source-${node.id}`} value={node.id}>
                {node.id}
              </option>
            ))}
          </TextField>
          <TextField
            margin="dense"
            select
            label="Target Node"
            fullWidth
            variant="standard"
            value={linkTarget}
            onChange={(e) => setLinkTarget(e.target.value)}
            SelectProps={{ native: true }}
          >
            <option value="">Select a node...</option>
            {nodes.map((node) => (
              <option key={`target-${node.id}`} value={node.id}>
                {node.id}
              </option>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsLinkDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={addLink}
            disabled={!linkSource || !linkTarget || linkSource === linkTarget}
          >
            Create Link
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for color picker */}
      <Dialog
        open={isColorPickerOpen}
        onClose={() => setIsColorPickerOpen(false)}
      >
        <DialogTitle>Select Color</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Pick a color for the node "{selectedNode?.id}".
          </DialogContentText>
          <Grid container spacing={2} style={{ marginTop: 16 }}>
            {pastelColors.map((color, index) => (
              <Grid item key={index}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    backgroundColor: color,
                    border: "2px solid transparent",
                    cursor: "pointer",
                  }}
                  onClick={() => changeNodeColor(color)}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.borderColor = "gray")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.borderColor = "transparent")
                  }
                ></div>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsColorPickerOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default InteractiveNodeMap;
