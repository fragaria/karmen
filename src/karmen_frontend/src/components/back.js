import React from "react";
import { Link } from "react-router-dom";

export const BackLink = ({ to, onClick, text }) => {
  onClick = onClick || function() {};
  return (
    <Link to={to} onClick={onClick} className="btn btn-plain">
      {text || "Cancel"}
    </Link>
  );
};

export const BackButton = ({ onClick, text }) => {
  onClick = onClick || function() {};
  return (
    <button className="btn btn-plain" onClick={onClick}>
      {text || "Cancel"}
    </button>
  );
};

export default BackLink;
