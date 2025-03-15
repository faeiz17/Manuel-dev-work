import React from "react";

const MapCanvas = ({
  nodes,
  links,
  svgRef,
  onNodeClick,
  onNodeMouseDown,
  onNodeMouseEnter,
  onNodeMouseLeave,
  onContextMenu,
}) => {
  return (
    <svg
      width="800"
      height="600"
      ref={svgRef}
      style={{ backgroundColor: "#f5f5f5" }}
      onContextMenu={onContextMenu}
    >
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
      {nodes.map((node) => (
        <g key={node.id}>
          <circle
            cx={node.x + 2}
            cy={node.y + 2}
            r="22"
            fill="rgba(0,0,0,0.2)"
          />
          <circle
            cx={node.x}
            cy={node.y}
            r="20"
            fill={node.color}
            stroke="#fff"
            strokeWidth="2"
            onClick={(e) => onNodeClick(node, e)}
            onMouseDown={(e) => onNodeMouseDown(e, node)}
            onMouseEnter={() => onNodeMouseEnter(node)}
            onMouseLeave={onNodeMouseLeave}
            style={{ cursor: "move" }}
          />
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
            {node.id.length > 12 ? node.id.substring(0, 10) + "..." : node.id}
          </text>
        </g>
      ))}
    </svg>
  );
};

export default MapCanvas;
