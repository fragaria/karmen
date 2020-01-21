import React from "react";

const TableActionRow = ({
  children,
  onConfirm,
  onCancel,
  showConfirm = true,
  showCancel = true,
  inverse = true
}) => {
  return (
    <div className={`list-item ${inverse ? "list-item-inverse" : ""}`}>
      <div className="list-item-content">
        <span className="list-item-title">{children}</span>
      </div>
      <div className="list-item-cta">
        {showCancel && (
          <button className="btn-reset" title="Cancel" onClick={onCancel}>
            <i className={`icon-close ${!inverse ? "text-secondary" : ""}`}></i>
          </button>
        )}
        {showConfirm && (
          <button className="btn-reset" title="Confirm" onClick={onConfirm}>
            <i className={`icon-check ${!inverse ? "text-success" : ""}`}></i>
          </button>
        )}
      </div>
    </div>
  );
};

export default TableActionRow;
