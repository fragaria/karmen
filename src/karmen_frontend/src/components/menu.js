import React from 'react';
import { Link } from 'react-router-dom';

const Menu = () => {
  return (
      <nav>
        <h2 className="hidden">Navigation</h2>
        <Link to="/" className="karmen-logo">
          <img alt="Karmen logo" src="/logo.svg" />
        </Link>
        <div className="box-actions">
          <ul>
            <li><Link to="/gcodes"><i className="icon-list"></i></Link></li>
            <li><Link to="/settings"><i className="icon-cog"></i></Link></li>
          </ul>
        </div>
        <hr />
        <p>
          <a href="https://github.com/fragaria/karmen/blob/master/LICENSE.txt" target="_blank" rel="noopener noreferrer">License</a><br />
          <a href="https://github.com/fragaria/karmen" target="_blank" rel="noopener noreferrer">https://github.com/fragaria/karmen</a><br />
          2019 &copy; <a href="https://fragaria.cz">Fragaria s.r.o.</a>
        </p>
      </nav>
    );
}

export default Menu;