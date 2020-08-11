import { enableFetchMocks } from "jest-fetch-mock";

import React from "react";
import { render, waitFor } from "@testing-library/react";
import { combineReducers } from "redux";
import { Provider } from "react-redux";

import configureStore from "../../store";
import heartbeatReducer from "../../reducers/hearbeat";
import Heartbeat from "../heartbeat";
enableFetchMocks();

jest.useFakeTimers();

/**
 * Full integration test where only HTTP calls are mocked.
 */
describe("heartbeat", () => {
  const originalAppRev = process.env.REACT_APP_GIT_REV;

  beforeAll(() => {
    // enableFetchMocks();
    process.env.REACT_APP_GIT_REV = "test-version";
  });

  afterAll(() => {
    process.env.REACT_APP_GIT_REV = originalAppRev;
    // disableFetchMocks();
  });

  beforeEach(() => {});

  const buildStore = (initialState = undefined) => {
    return configureStore(
      {
        heartbeat: initialState,
      },
      combineReducers({ heartbeat: heartbeatReducer })
    );
  };

  const renderHeartbeat = (store) =>
    render(
      <Provider store={store}>
        <Heartbeat />
      </Provider>
    );

  it("displays offline dialog when API connection can't be established", async () => {
    fetch.mockResponseOnce(undefined, { status: -1 });

    const store = buildStore({
      isOnline: true,
      apiVersion: "test-version",
      shouldUpgrade: false,
    });
    const { getByRole, getByText, queryByRole, queryByText } = renderHeartbeat(
      store
    );

    await waitFor(() => {
      expect.any(Error);
      expect(getByRole("dialog")).toBeInTheDocument();
      expect(getByText("Application is offline")).toBeInTheDocument();
    });

    fetch.mockResponseOnce(
      JSON.stringify({
        app: "karmen_backend",
        version: "test-version",
      }),
      { status: 200 }
    );

    // Force setTimeout to trigger.
    jest.runAllTimers();

    await waitFor(() => {
      expect(queryByRole("dialog")).not.toBeInTheDocument();
      expect(queryByText("Application is offline")).not.toBeInTheDocument();
    });
  });

  it("displays dialog when API is under maintentnace", async () => {
    fetch.mockResponseOnce(undefined, { status: 503 });

    const store = buildStore({
      isOnline: true,
      apiVersion: "test-version",
      shouldUpgrade: false,
      isMaintenance: false,
    });
    const { getByRole, getByText, queryByRole, queryByText } = renderHeartbeat(
      store
    );
    jest.runAllTimers();
    await waitFor(() => {
      expect.any(Error);
      expect(getByRole("dialog")).toBeInTheDocument();
      expect(
        getByText("Karmen is under maintenance, please try again later.")
      ).toBeInTheDocument();
    });

    fetch.mockResponseOnce(
      JSON.stringify({
        app: "karmen_backend",
        version: "test-version",
      }),
      { status: 200 }
    );

    // Force setTimeout to trigger.
    jest.runAllTimers();

    await waitFor(() => {
      expect(queryByRole("dialog")).not.toBeInTheDocument();
      expect(
        queryByText("Karmen is under maintenance, please try again later.")
      ).not.toBeInTheDocument();
    });
  });

  it("displays upgrade call when API version changes", async () => {
    fetch.once(
      JSON.stringify({
        app: "karmen_backend",
        version: "test-version",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

    const store = buildStore({
      isOnline: true,
      apiVersion: "test-version",
      shouldUpgrade: false,
    });

    const { getByRole, getByText, queryByRole, queryByText } = renderHeartbeat(
      store
    );

    expect(queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      queryByText(
        "Karmen has been updated, please reload the page to continue working."
      )
    ).not.toBeInTheDocument();

    fetch.once(
      JSON.stringify({
        app: "karmen_backend",
        version: "test-version2",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

    jest.runAllTimers();

    await waitFor(() => {
      expect(getByRole("dialog")).toBeInTheDocument();
      expect(
        getByText(
          "Karmen has been updated, please reload the page to continue working."
        )
      ).toBeInTheDocument();
    });
  });
});
