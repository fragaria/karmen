import React from 'react';
import { Link } from 'react-router-dom';

const Menu = () => {
  return (
      <nav>
        <h2>Navigation</h2>
        <ul>
          <li><Link to="/">Printer list</Link></li>
          <li><Link to="/add-printer">Add printer</Link></li>
        </ul>
        <hr />
      </nav>
    );
}

export default Menu;