import React from "react";
import ControlsTab from "../controls-tab";
import { render } from "@testing-library/react";

require("jest-fetch-mock").enableMocks();

const createPrinter = (accessLevel, connected, state) => {
  return {
    client: {
      access_level: accessLevel,
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
    hostname: "karmen_fake_printer1_1.karmen_printers.local",
    ip: "172.16.236.11",
    job: {
      completion: 66.666,
      name: "fake-file-being-printed.gcode",
      printTime: 63296,
      printTimeLeft: 12723,
    },
    lights: "off",
    name: "fake 1",
    path: "",
    port: 8080,
    printer_props: {
      bed_type: "Powder coated PEI",
      filament_color: "black",
      filament_type: "PETG",
      tool0_diameter: 0.25,
    },
    protocol: "http",
    status: {
      state: state,
      temperature: {
        bed: {
          actual: 24.7,
          target: 24.7,
        },
        tool0: {
          actual: 16.2,
          target: 16.2,
        },
      },
    },
    token: null,
    uuid: "20e91c14-c3e4-4fe9-a066-e69d53324a20",
    webcam: {
      flipHorizontal: false,
      flipVertical: false,
      rotate90: false,
      url:
        "/organizations/b3060e41-e319-4a9b-8ac4-e0936c75f275/printers/20e91c14-c3e4-4fe9-a066-e69d53324a20/webcam-snapshot",
    },
  };
};

const renderControlTabs = (printer) => {
  return render(
    <ControlsTab
      printer={printer}
      available={undefined}
      temperatures={printer.status.temperature}
      movePrinthead={() => {}}
      changeFanState={() => {}}
      changeMotorsState={() => {}}
      changeLights={() => {}}
      changeCurrentJobState={() => {}}
      extrude={() => {}}
      setTemperature={() => {}}
    />
  );
};

const expectTextInTheDocument = (getByText) => {
  expect(getByText("Print")).toBeInTheDocument();
  expect(getByText("Fan")).toBeInTheDocument();
  expect(getByText("Motors")).toBeInTheDocument();
  expect(getByText("Lights")).toBeInTheDocument();
  expect(getByText("Move material by")).toBeInTheDocument();
  expect(getByText("Tool temperature")).toBeInTheDocument();
  expect(getByText("Bed temperature")).toBeInTheDocument();
};

const expectTextNotInTheDocument = (queryByText) => {
  expect(queryByText("Print")).not.toBeInTheDocument();
  expect(queryByText("Fan")).not.toBeInTheDocument();
  expect(queryByText("Motors")).not.toBeInTheDocument();
  expect(queryByText("Move material by")).not.toBeInTheDocument();
  expect(queryByText("Tool temperature")).not.toBeInTheDocument();
  expect(queryByText("Bed temperature")).not.toBeInTheDocument();
};

it("Check unlocked connected printer - printing", async () => {
  const printer = createPrinter("unlocked", true, "Printing");
  const { getByText } = renderControlTabs(printer);
  expectTextInTheDocument(getByText);
});

it("Check locked connected printer - printing", async () => {
  const printer = createPrinter("locked", true, "Printing");
  const { queryByText } = renderControlTabs(printer);
  expectTextNotInTheDocument(queryByText);
  expect(queryByText("Lights")).not.toBeInTheDocument();
});

it("Check unlocked disconnected printer - printing", async () => {
  const printer = createPrinter("unlocked", false, "Printing");
  const { queryByText } = renderControlTabs(printer);
  expectTextNotInTheDocument(queryByText);
});

it("Check locked disconnected printer - printing", async () => {
  const printer = createPrinter("locked", false, "Printing");
  const { queryByText } = renderControlTabs(printer);
  expectTextNotInTheDocument(queryByText);
  expect(queryByText("Lights")).not.toBeInTheDocument();
});

it("Check locked disconnected printer - Printer is not connected to Octoprint", async () => {
  const printer = createPrinter(
    "unlocked",
    true,
    "Printer is not connected to Octoprint"
  );
  const { queryByText } = renderControlTabs(printer);
  expectTextNotInTheDocument(queryByText);
});
