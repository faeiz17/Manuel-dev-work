// src/components/InteractiveNodeMap/AddEditDialog.jsx
import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";

const AddEditDialog = ({
  open,
  onClose,
  dialogAction, // "add" or "edit"
  newNodeId,
  setNewNodeId,
  selectedNode,
  onConfirm,
}) => {
  let title = "";
  let description = "";
  if (dialogAction === "add") {
    title = "Add Node";
    description = "Enter a unique name for the new node.";
  } else if (dialogAction === "edit") {
    title = `Edit Node "${selectedNode?.id}"`;
    description = "Enter the new ID for this node:";
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{description}</DialogContentText>
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm}>Confirm</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddEditDialog;
