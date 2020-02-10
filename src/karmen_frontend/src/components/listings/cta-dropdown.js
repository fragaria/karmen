import React from "react";

const CtaDropdown = ({ children, onToggle, expanded }) => {
  return (
    <div className="list-dropdown list-cta">
      <button
        className="list-dropdown-toggle btn-reset"
        onClick={e => {
          e.preventDefault();
          onToggle && onToggle();
        }}
      >
        <span className="icon-kebab"></span>
      </button>

      {expanded && (
        <div className="list-dropdown-items">
          {children}
          <div className="list-dropdown-backdrop" onClick={onToggle}></div>
        </div>
      )}
    </div>
  );
};

export default CtaDropdown;
