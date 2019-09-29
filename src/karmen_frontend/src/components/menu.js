import React from 'react';
import { Link } from 'react-router-dom';

const Menu = () => {
  return (
    <nav>
      <h2 className="hidden">Navigation</h2>
      <Link to="/" className="karmen-logo">
        <img alt="Karmen logo" src="/logo.svg" />
      </Link>
      <ul className="navigation">
        <li>
          <Link to="/">Printers</Link>
        </li>
        <li>
          <Link to="/gcodes">G-Codes</Link>
        </li>
        <li>
          <Link to="/settings">Settings</Link>
        </li>
      </ul>
    </nav>
  );
}

export default Menu;