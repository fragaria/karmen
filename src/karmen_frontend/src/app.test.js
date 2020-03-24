import React from "react";
import { render } from "@testing-library/react";
import App from "./app";

it("does not fail on startup", () => {
  render(<App />);
});
