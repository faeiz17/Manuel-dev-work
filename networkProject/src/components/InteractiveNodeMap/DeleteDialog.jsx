import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";

const DeleteDialog = ({ open, onClose, selectedNode, onDelete }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>Delete Node</DialogTitle>
    <DialogContent>
      <DialogContentText>
        Are you sure you want to delete the node "{selectedNode?.id}"?
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button onClick={onDelete} color="error">
        Delete
      </Button>
    </DialogActions>
  </Dialog>
);

export default DeleteDialog;
