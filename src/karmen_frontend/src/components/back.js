import React from 'react';
import { Link } from 'react-router-dom';

const Back = ({ to }) => {
  return (
      <p class="back">
        <Link to={to}><i class="icon icon-arrow-left"></i></Link>
      </p>
    );
}

export default Back;
