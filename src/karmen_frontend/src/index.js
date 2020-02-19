import "react-app-polyfill/ie11";
import "core-js/es/promise";
import "core-js/es/object";
import "core-js/es/array";
import "core-js/proposals/url";

import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import * as Sentry from "@sentry/browser";
import App from "./app";
import configureStore from "./store";

import "./assets/styles.scss";

if (window.env.SENTRY_DSN) {
  Sentry.init({
    dsn: window.env.SENTRY_DSN,
    release: `karmen@${process.env.REACT_APP_GIT_REV}`
  });
}

ReactDOM.render(
  <Provider store={configureStore()}>
    <App />
  </Provider>,
  document.getElementById("root")
);
