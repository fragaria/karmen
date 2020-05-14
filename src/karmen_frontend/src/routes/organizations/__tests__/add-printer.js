import React from "react";
import { render, waitFor, fireEvent } from "@testing-library/react";

import { AddPrinterForm } from "../add-printer";

const renderForm = ({ isCloudInstall = true } = {}) => {
  const origIsCloudInstall = window.env.IS_CLOUD_INSTALL;

  window.env.IS_CLOUD_INSTALL = isCloudInstall;

  const issueToken = () => {
    return new Promise((resolve, reject) => {
      resolve("testtoken");
    });
  };

  const createPrinter = () => {
    return new Promise((resolve, reject) => {
      resolve();
    });
  };

  const result = render(
    <AddPrinterForm
      issueToken={issueToken}
      createPrinter={createPrinter}
      orguuid="orguuid"
    />
  );

  window.IS_CLOUD_INSTALL = origIsCloudInstall;

  return result;
};

// require("jest-fetch-mock").enableMocks();

test("IS_CLOUD_INSTALL=false shows printer address and no device selection", () => {
  const { getByLabelText, queryByLabelText } = renderForm({
    isCloudInstall: false,
  });
  expect(getByLabelText("Printer address")).toBeInTheDocument();
  expect(queryByLabelText("I'm adding")).toBeNull();
});

test("IS_CLOUD_INSTALL=true shows device selection", () => {
  const { getByLabelText } = renderForm();
  expect(getByLabelText("I'm adding")).toBeInTheDocument();
});

test("When Pill is selected, form presents the Printer code field", () => {
  const { getByLabelText } = renderForm();
  const deviceSelect = getByLabelText("I'm adding");
  fireEvent.change(deviceSelect, { target: { value: "pill" } });
  expect(getByLabelText("Printer code")).toBeInTheDocument();
});

test("When Other device is selected, form presents the Connection key field", () => {
  const { getByLabelText } = renderForm();
  const deviceSelect = getByLabelText("I'm adding");
  fireEvent.change(deviceSelect, { target: { value: "other" } });
  expect(getByLabelText("Connection key")).toBeInTheDocument();
});

/**
 * Token is populated using async call.
 */
test("When Other device is selected, Connection key field gets populated with a token", async () => {
  const { getByLabelText } = renderForm();
  const deviceSelect = getByLabelText("I'm adding");
  fireEvent.change(deviceSelect, { target: { value: "other" } });
  const connectionKeyField = getByLabelText("Connection key");
  await waitFor(() => expect(connectionKeyField.value).toBe("testtoken"));
});

test("When Pill is re-selected, the printer code is blank again", async () => {
  const { getByLabelText } = renderForm();
  const deviceSelect = getByLabelText("I'm adding");
  fireEvent.change(deviceSelect, { target: { value: "other" } });
  fireEvent.change(deviceSelect, { target: { value: "pill" } });
  const codeField = getByLabelText("Printer code");
  expect(codeField.value).toBe("");
});

test("When Other device is re-selected, the printer code is populated again", async () => {
  const { getByLabelText } = renderForm();
  const deviceSelect = getByLabelText("I'm adding");
  fireEvent.change(deviceSelect, { target: { value: "other" } });
  fireEvent.change(deviceSelect, { target: { value: "pill" } });
  fireEvent.change(deviceSelect, { target: { value: "other" } });
  const connectionKeyField = getByLabelText("Connection key");
  await waitFor(() => expect(connectionKeyField.value).toBe("testtoken"));
});
