import React from "react";
import { render } from "@testing-library/react";
import configureMockStore from "redux-mock-store";
import thunk from "redux-thunk";
import { Provider } from "react-redux";
import WebcamStream from "../webcam-stream";

require("jest-fetch-mock").enableMocks();
const printerUuid = "20e91c14-c3e4-4fe9-a066-e69d53324a20";
const orgUuid = "randomUuidOfOrganisation";

const createPrinter = (connected) => {
  return {
    uuid: printerUuid,
    client: {
      access_level: "unlocked",
      api_key: null,
      connected: connected,
      name: "octoprint",
      pill_info: {
        karmen_version: "0.2.0",
        update_available: "0.2.2",
        update_status: null,
        version_number: "0.2.0",
      },
      plugins: ["awesome_karmen_led"],
      version: {
        api: "0.1",
        server: "0.0.1",
        text: "octoprint fake",
      },
    },
  };
};

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

const renderWebcamStream = (store, printer) => {
  return render(
    <Provider store={store}>
      <WebcamStream
        url={undefined}
        flipHorizontal={false}
        flipVertical={false}
        rotate90={false}
        allowFullscreen={false}
        printerUuid={printer.uuid}
        orgUuid={orgUuid}
        isPrinting={false}
      />
    </Provider>
  );
};

const createStore = (printers = [], images = {}, queue = {}) => {
  return mockStore({
    printers: {
      printers,
    },
    webcams: {
      images,
      queue,
    },
  });
};

const createValidStore = (printer) => {
  return createStore(
    [printer],
    { [printerUuid]: "data-url image" },
    { [printerUuid]: { interval: 200, timeout: 20 } }
  );
};

const expectStreamUnavailable = (queryByTitle, getByText) => {
  expect(
    queryByTitle("Current state from undefined")
  ).not.toBeInTheDocument();
  expect(getByText("Stream unavailable")).toBeInTheDocument();
};

it("WebcamStream: is available", async () => {
  const printer = createPrinter(true);
  const store = createValidStore(printer);
  const { queryByText, getByTitle } = renderWebcamStream(store, printer);

  expect(getByTitle("Current state from undefined")).toBeInTheDocument();
  expect(queryByText("Stream unavailable")).not.toBeInTheDocument();
});

it("WebcamStream: is not available due to absence of image", async () => {
  const printer = createPrinter(true);
  const store = createStore();
  const { getByText, queryByTitle } = renderWebcamStream(store, printer);

  expectStreamUnavailable(queryByTitle, getByText);
});

it("WebcamStream: is not available due to client is disconnected", async () => {
  const printer = createPrinter(false);
  const store = createValidStore(printer);
  const { getByText, queryByTitle } = renderWebcamStream(store, printer);

  expectStreamUnavailable(queryByTitle, getByText);
});
