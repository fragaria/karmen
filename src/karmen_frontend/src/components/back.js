import React from 'react';
import { Link } from 'react-router-dom';

export const BackLink = ({ to, onClick, text }) => {
  onClick = onClick || function () {};
  return (
    <Link to={to} onClick={onClick} className="back-link">{text || 'Cancel'}</Link>
  );
}

export const BackButton = ({ onClick, text }) => {
  onClick = onClick || function () {};
  return (
    <button className="plain link" onClick={onClick}>{text || 'Cancel'}</button>
  );
}

export default BackLink;
