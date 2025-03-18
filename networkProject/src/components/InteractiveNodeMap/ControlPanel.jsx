import React from "react";
import Button from "@mui/material/Button";

const ControlPanel = ({
  onAdd,
  onEdit,
  onDelete,
  onCreateLink,
  onSave,
  onLoad,
  onUploadText,
  fileInputRef,
  selectedNode,
  isLinkMode, // <-- NEW
  setIsLinkMode, // <-- NEW
}) => {
  return (
    <div
      style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}
    >
      <Button
        variant="contained"
        onClick={onAdd}
        style={{ backgroundColor: "#1976d2" }}
      >
        Add Node
      </Button>

      <Button
        variant="contained"
        onClick={onEdit}
        disabled={!selectedNode}
        style={{ backgroundColor: "#388e3c" }}
      >
        Edit Node
      </Button>

      <Button
        variant="contained"
        onClick={onDelete}
        disabled={!selectedNode}
        style={{ backgroundColor: "#d32f2f" }}
      >
        Delete Node Manuel
      </Button>

      <Button
        variant="contained"
        onClick={onCreateLink}
        style={{ backgroundColor: "#7b1fa2" }}
      >
        Create Link
      </Button>

      {/* NEW: Toggle for Pen/Link Mode */}
      <Button
        variant="contained"
        onClick={() => setIsLinkMode((prev) => !prev)}
        style={{
          backgroundColor: isLinkMode ? "#616161" : "#9ccc65",
          color: "#fff",
        }}
      >
        {isLinkMode ? "Pen Mode: ON" : "Pen Mode: OFF"}
      </Button>

      <Button
        variant="contained"
        onClick={onSave}
        style={{ backgroundColor: "#fbc02d" }}
      >
        Save Map
      </Button>

      <Button
        variant="contained"
        onClick={onLoad}
        style={{ backgroundColor: "#ff9800" }}
      >
        Load Map
      </Button>

      <Button
        variant="contained"
        onClick={onUploadText}
        style={{ backgroundColor: "#673ab7" }}
      >
        Upload Text Node
      </Button>
    </div>
  );
};

export default ControlPanel;
