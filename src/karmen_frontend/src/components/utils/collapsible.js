import React, { useState } from "react";

const Collapsible = ({ children, collapsedStateText, expandedStateText }) => {
  const [expanded, setExpanded] = useState();
  return (
    <React.Fragment>
      {!expanded && (
        <button onClick={() => setExpanded(true)}>{collapsedStateText}</button>
      )}

      {expanded && children}

      {expanded && (
        <button onClick={() => setExpanded(false)}>{expandedStateText}</button>
      )}
    </React.Fragment>
  );
};

export default Collapsible;
