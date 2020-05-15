import React from "react";
import { render, waitFor, fireEvent } from "@testing-library/react";

import { AddPrinterForm } from "../add-printer";

const issueTokenDefault = () => {
  return new Promise((resolve, reject) => {
    resolve("testtoken");
  });
};

const createPrinterDefault = () => {
  return new Promise((resolve, reject) => {
    resolve();
  });
};

const renderForm = ({
  isCloudInstall = true,
  issueToken = issueTokenDefault,
  createPrinter = createPrinterDefault,
} = {}) => {
  const result = render(
    <AddPrinterForm
      issueToken={issueToken}
      createPrinter={createPrinter}
      orguuid="orguuid"
    />
  );

  return result;
};

describe("Cloud install disabled", () => {
  const origIsCloudInstall = window.env.IS_CLOUD_INSTALL;

  beforeAll(() => {
    window.env.IS_CLOUD_INSTALL = false;
  });

  afterAll(() => {
    window.IS_CLOUD_INSTALL = origIsCloudInstall;
  });

  test("Shows printer address and no device selection", () => {
    const { getByLabelText, queryByLabelText } = renderForm({
      isCloudInstall: false,
    });
    expect(getByLabelText("Printer address")).toBeInTheDocument();
    expect(queryByLabelText("I'm adding")).toBeNull();
  });
});

describe("Cloud install enabled", () => {
  const origIsCloudInstall = window.env.IS_CLOUD_INSTALL;

  beforeAll(() => {
    window.env.IS_CLOUD_INSTALL = true;
  });

  afterAll(() => {
    window.IS_CLOUD_INSTALL = origIsCloudInstall;
  });

  test("Shows device selection", () => {
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

  test("When app fails getting the token, error message is shown to let user know", async () => {
    const failingIssueToken = jest.fn().mockImplementation(() => {
      return new Promise((resolve, reject) => {
        reject(new Error());
      });
    });

    const { getByLabelText, getByText } = renderForm({
      issueToken: failingIssueToken,
    });
    const deviceSelect = getByLabelText("I'm adding");
    fireEvent.change(deviceSelect, { target: { value: "other" } });
    await waitFor(() =>
      expect(
        getByText(
          "Could not retreive a new connection key for you, please try refreshing this page."
        )
      ).toBeInTheDocument()
    );
  });
});
