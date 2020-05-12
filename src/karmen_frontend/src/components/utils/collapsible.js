import React, { useState } from "react";

const Collapsible = ({
  children,
  collapsedStateText,
  expandedStateText,
  isInForm,
}) => {
  const [expanded, setExpanded] = useState();

  const toggleTo = (evt, val) => {
    evt.preventDefault();
    setExpanded(val);
  };

  return (
    <React.Fragment>
      {expanded ? (
        <button
          className="btn-reset anchor"
          onClick={($event) => toggleTo($event, false)}
        >
          {expandedStateText}
        </button>
      ) : (
        <button
          className="btn-reset anchor"
          onClick={($event) => toggleTo($event, true)}
        >
          {collapsedStateText}
        </button>
      )}

      {isInForm && <span></span>}

      {expanded && children}
    </React.Fragment>
  );
};

export default Collapsible;
