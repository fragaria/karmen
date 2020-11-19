import React from "react";
import ControlsTab from "../controls-tab";
import { render } from "@testing-library/react";

require("jest-fetch-mock").enableMocks();

const createPrinter = (unlocked, connected, printing) => {
  var printer, octoprint;

  if (!unlocked) {
    //no access
    octoprint = {
      error: {
        detail:
          "The device indicates that we do not have access to the resource.",
        code: "permission-denied",
      },
    };
  } else {
    if (!connected) {
      //we have access but printer is not connected
      printer = {
        error: {
          detail: "Printer is not operational",
          code: "printer-not-operational",
        },
      };
    } else {
      printer = {
        state: {
          flags: {
            cancelling: false,
            closedOrError: false,
            error: false,
            finishing: false,
            operational: true,
            paused: false,
            pausing: false,
            printing: printing,
            ready: false,
            resuming: false,
            sdReady: false,
          },
          text: "Printing",
        },
        temperature: {
          bed: {
            actual: 60.1,
            offset: 0,
            target: 60.0,
          },
          tool0: {
            actual: 214.3,
            offset: 0,
            target: 215.0,
          },
        },
        currentJob: {
          completion: 23.76632945532669,
          printTime: 7369,
          printTimeLeft: 23637,
          name: "Splash_0.2mm_PLA_MK3S_8h54m.gcode",
        },
      };
    }

    octoprint = {
      version: { api: "0.1", server: "1.3.12", text: "OctoPrint 1.3.12" },
      plugins: [
        "action_command_prompt",
        "awesome_karmen_led",
        "discovery",
        "errortracking",
        "firmwareupdater",
        "pi_support",
        "pluginmanager",
      ],
      printer: printer,
      lights: "on",
    };
  }

  return {
    id: "rs-mia-fsh",
    name: "fraga prusa",
    url: "http://localhost:8000/api/2/printers/rs-mia-fsh/",
    users: [
      {
        url: "http://localhost:8000/api/2/users/xm-0sz-1pt/",
        id: "xm-0sz-1pt",
        username: "user",
        first_name: "",
        last_name: "",
      },
    ],
    groups: [
      {
        url: "http://localhost:8000/api/2/groups/du-np3-k1y/",
        id: "du-np3-k1y",
        name: "Group - user is admin",
      },
    ],
    client: {
      octoprint: octoprint,
      pill: {
        error: null,
        version: null,
        version_string: "",
        next_version: null,
        update_status: null,
      },
    },
    printjobs: [],
    note: "",
  };
};
const renderControlTabs = (printer) => {
  return render(
    <ControlsTab
      printer={printer}
      available={undefined}
      temperatures={printer.temperature}
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
  const printer = createPrinter(true, true, true);
  const { getByText } = renderControlTabs(printer);
  expectTextInTheDocument(getByText);
});

it("Check locked connected printer - printing", async () => {
  const printer = createPrinter(false, true, true);
  const { queryByText } = renderControlTabs(printer);
  expectTextNotInTheDocument(queryByText);
  expect(queryByText("Lights")).not.toBeInTheDocument();
});

it("Check unlocked disconnected printer - printing", async () => {
  const printer = createPrinter(true, false, true);
  const { queryByText } = renderControlTabs(printer);
  expectTextNotInTheDocument(queryByText);
});

it("Check locked disconnected printer - printing", async () => {
  const printer = createPrinter(false, false, true);
  const { queryByText } = renderControlTabs(printer);
  expectTextNotInTheDocument(queryByText);
  expect(queryByText("Lights")).not.toBeInTheDocument();
});

it("Check locked disconnected printer - Printer is not connected to Octoprint", async () => {
  const printer = createPrinter(
    true,
    false,
    "Printer is not connected to Octoprint"
  );
  const { queryByText } = renderControlTabs(printer);
  expectTextNotInTheDocument(queryByText);
});
