import React, { useState } from "react";

const Collapsible = ({
  children,
  collapsedStateText,
  expandedStateText,
  isInForm,
}) => {
  const [expanded, setExpanded] = useState();

  const toggle = (evt) => {
    evt.preventDefault();
    setExpanded(!expanded);
  };

  return (
    <React.Fragment>
      <button className="btn-reset anchor" onClick={toggle}>
        {expanded ? expandedStateText : collapsedStateText}
      </button>
      {isInForm && <span></span>}
      {expanded && children}
    </React.Fragment>
  );
};

export default Collapsible;
