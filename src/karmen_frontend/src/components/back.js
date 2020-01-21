import React from "react";
import { Link } from "react-router-dom";

export const BackButton = ({ onClick, text }) => {
  onClick = onClick || function() {};
  return (
    <button className="btn btn-plain" onClick={onClick}>
      {text || "Cancel"}
    </button>
  );
};

export default BackLink;
