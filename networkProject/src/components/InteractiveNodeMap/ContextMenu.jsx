import React from "react";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

const ContextMenu = ({ visible, x, y, onClose, onEdit, onChangeColor }) => {
  return (
    <Menu
      open={visible}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={{ top: y, left: x }}
    >
      <MenuItem onClick={onEdit}>Add / Edit Info</MenuItem>
      <MenuItem onClick={onChangeColor}>Change Color</MenuItem>
    </Menu>
  );
};

export default ContextMenu;
