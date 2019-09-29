import React from 'react';
import { Link } from 'react-router-dom';

export const BackLink = ({ to, onClick }) => {
  onClick = onClick || function () {};
  return (
    <Link to={to} onClick={onClick}>Cancel</Link>
  );
}

export const BackButton = ({ onClick }) => {
  onClick = onClick || function () {};
  return (
    <button className="plain link" onClick={onClick}>Cancel</button>
  );
}

export default BackLink;
