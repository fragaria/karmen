import React from "react";
import { render } from "@testing-library/react";
import configureMockStore from "redux-mock-store";
import thunk from "redux-thunk";
import { Provider } from "react-redux";
import WebcamStream, { WebcamStreamRenderer } from "../webcam-stream";

require("jest-fetch-mock").enableMocks();

const printerId = "20e91c14-c3e4-4fe9-a066-e69d53324a20";
const orgId = "randomIdOfOrganisation";

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

const createPrinter = (connected) => {
  return {
    id: printerId,
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

const renderWebcamStreamRenderer = (printer, imageData = null) => {
  return render(
    <WebcamStreamRenderer
      printer={printer}
      url={undefined}
      flipHorizontal={false}
      flipVertical={false}
      rotate90={false}
      allowFullscreen={false}
      orgId={orgId}
      image={imageData}
    />
  );
};

it("WebcamStreamRenderer: is available", async () => {
  const printer = createPrinter(true);
  const { queryByText } = renderWebcamStreamRenderer(printer, [
    "data:image/jpg,image-data",
    202,
  ]);

  expect(queryByText("Stream unavailable")).not.toBeInTheDocument();
});

it("WebcamStreamRenderer: is not available due to absence of image", async () => {
  const printer = createPrinter(true);
  const { getByText, queryByAltText } = renderWebcamStreamRenderer(printer);

  expect(
    queryByAltText("Last screenshot from undefined")
  ).not.toBeInTheDocument();
  expect(getByText("Starting stream")).toBeInTheDocument();
});

it("WebcamStreamRenderer: is not available due to client is disconnected", async () => {
  const printer = createPrinter(false);
  const { getByText, queryByAltText } = renderWebcamStreamRenderer(printer, [
    undefined,
    404,
  ]);
  expect(
    queryByAltText("Last screenshot from undefined")
  ).not.toBeInTheDocument();
  expect(getByText("Stream unavailable")).toBeInTheDocument();
});

it("WebcamStream", async () => {
  const printer = createPrinter(false);
  const store = mockStore({
    webcams: {
      images: { [printerId]: ["data:image/jpg,image-data", 202] },
      queue: { [printerId]: { interval: 200, timeout: 20 } },
    },
  });

  return render(
    <Provider store={store}>
      <WebcamStream
        orgId={orgId}
        allowFullscreen={false}
        printer={printer}
      />
    </Provider>
  );
});
