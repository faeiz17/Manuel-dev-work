import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";

const ColorPickerDialog = ({
  open,
  onClose,
  pastelColors,
  onSelectColor,
  selectedNode,
}) => (
  <Dialog open={open} onClose={onClose}>
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
              onClick={() => onSelectColor(color)}
              onMouseOver={(e) => (e.currentTarget.style.borderColor = "gray")}
              onMouseOut={(e) =>
                (e.currentTarget.style.borderColor = "transparent")
              }
            ></div>
          </Grid>
        ))}
      </Grid>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
    </DialogActions>
  </Dialog>
);

export default ColorPickerDialog;
