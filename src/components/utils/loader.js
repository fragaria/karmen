import React from "react";

import loaderImage from "../../assets/img/loader.gif";

const Loader = ({ image }) => {
  return (
    <p className="loader">
      {image ? (
        <img src={loaderImage} alt="Loading..." />
      ) : (
        <span>Loading...</span>
      )}
    </p>
  );
};

export default Loader;
