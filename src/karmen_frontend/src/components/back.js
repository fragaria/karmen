import React from 'react';
import { Link } from 'react-router-dom';

export const BackLink = ({ to, onClick }) => {
  onClick = onClick || function () {};
  return (
      <p className="back">
        <Link to={to} onClick={onClick}><i className="icon icon-arrow-left"></i></Link>
      </p>
    );
}

export const BackButton = ({ onClick }) => {
  onClick = onClick || function () {};
  return (
      <p className="back">
        <button className="plain link" onClick={onClick}><i className="icon icon-arrow-left"></i></button>
      </p>
    );
}

export default BackLink;
