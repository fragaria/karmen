import React from "react";
import * as Sentry from "@sentry/browser";

const Page404 = () => {
  Sentry.captureMessage("Page 404 was hit");
  return (
    <div className="content">
      <div className="container">
        <h1 className="main-title">404: Page not found</h1>
      </div>
    </div>
  );
};

export default Page404;
