import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";

const InfoPage = ({
  nodeInfo,
  setNodeInfo,
  onSave,
  selectedNode,
  onCancel,
}) => (
  <Box
    sx={{
      width: 300,
      p: 2,
      height: "100vh",
      borderLeft: "1px solid #ccc",
      overflowY: "auto",
      backgroundColor: "#fff",
    }}
  >
    <Typography variant="h6" gutterBottom>
      {selectedNode ? `Info: "${selectedNode.id}"` : "Node Info"}
    </Typography>
    <Typography variant="body2" gutterBottom>
      Add or modify additional information for this node.
    </Typography>
    <TextField
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
    <Box
      sx={{
        mt: 2,
        display: "flex",
        justifyContent: "flex-end",
        gap: 1,
      }}
    >
      <Button onClick={onCancel}>Cancel</Button>
      <Button variant="contained" onClick={onSave}>
        Save Info
      </Button>
    </Box>
  </Box>
);

export default InfoPage;
