import "react-app-polyfill/ie11";
import "core-js/es/promise";
import "core-js/es/object";
import "core-js/es/array";
import "core-js/proposals/url";

import React from "react";
import ReactDOM from "react-dom";

import App from "./app";
import { installSentry } from "./sentry";

import "./assets/styles.scss";

installSentry();

ReactDOM.render(<App />, document.getElementById("root"));
