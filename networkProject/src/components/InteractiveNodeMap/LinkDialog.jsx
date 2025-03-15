import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";

const LinkDialog = ({
  open,
  onClose,
  linkSource,
  setLinkSource,
  linkTarget,
  setLinkTarget,
  onCreateLink,
  nodes,
}) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>Create Link</DialogTitle>
    <DialogContent>
      <DialogContentText>Select the nodes you want to link.</DialogContentText>
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
      <Button onClick={onClose}>Cancel</Button>
      <Button
        onClick={onCreateLink}
        disabled={!linkSource || !linkTarget || linkSource === linkTarget}
      >
        Create Link
      </Button>
    </DialogActions>
  </Dialog>
);

export default LinkDialog;
