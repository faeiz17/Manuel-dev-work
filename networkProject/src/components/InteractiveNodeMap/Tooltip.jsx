import React from "react";

const Tooltip = ({ tooltip }) => {
  return (
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
  );
};

export default Tooltip;
