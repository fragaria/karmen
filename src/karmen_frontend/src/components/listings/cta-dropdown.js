import React from "react";

const CtaDropdown = ({ children, onToggle, expanded }) => {
  return (
    <div className="dropdown list-cta">
      <button
        className="dropdown-toggle btn-reset"
        onClick={e => {
          e.preventDefault();
          onToggle && onToggle();
        }}
      >
        <span className="icon-kebab"></span>
      </button>

      {expanded && (
        <div className="dropdown-items">
          <div className="dropdown-items-content">
            {children}
          </div>
          <div className="dropdown-backdrop" onClick={onToggle}></div>
        </div>
      )}
    </div>
  );
};

export default CtaDropdown;
