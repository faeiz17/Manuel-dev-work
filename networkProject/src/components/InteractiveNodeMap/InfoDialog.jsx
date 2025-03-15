import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";

const InfoDialog = ({
  open,
  onClose,
  nodeInfo,
  setNodeInfo,
  onSave,
  selectedNode,
}) => (
  <Dialog open={open} onClose={onClose}>
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
      <Button onClick={onClose}>Cancel</Button>
      <Button onClick={onSave}>Save Info</Button>
    </DialogActions>
  </Dialog>
);

export default InfoDialog;
