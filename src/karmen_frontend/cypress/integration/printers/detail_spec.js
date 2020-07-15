const testStableLabels = () => {
  cy.findByText("Tool:").should("exist");
  cy.findByText("Bed:").should("exist");

  cy.findByText("Controls").should("exist");
  cy.findByText("Jobs").should("exist");
  cy.findByText("Connection").should("exist");
  cy.findByText("Settings").should("exist");

  cy.findByText("Fan").should("exist");
  cy.findByText("Motors").should("exist");
  cy.findByText("Lights").should("exist");
  cy.findByText("Move material by").should("exist");

  cy.findByText("Tool temperature").should("exist");
  cy.findByText("Bed temperature").should("exist");
};

describe("Printers: Detail - State", function () {
  let printingEnvironment;

  beforeEach(() => {
    cy.preparePrintingEnvironment().then((printingEnv) => {
      printingEnvironment = printingEnv;
    });
  });

  it("oprational state", function () {
    const { organizationUuid, printerUuid, printerName, gCodeUuid } =
      printingEnvironment;
    cy.visit(
      `/${organizationUuid}/printers/${printerUuid}`
    );

    cy.findByText(printerName).should("exist");

    cy.determineCloudInstall().then((IS_CLOUD_INSTALL) => {
      if (IS_CLOUD_INSTALL) {
        this.skip()
        return cy.log(
          "SKIPPED - Environment is not currently prepared for adding a printer in cloud mode due to missing token handshake in fake printer"
        );
      } else {
        cy.findByText("connected").should("exist");
        cy.findByText("Operational").should("exist");
        testStableLabels();
      }
    });
  });

  it("State printing", function () {

    cy.determineCloudInstall().then((IS_CLOUD_INSTALL) => {
      if (IS_CLOUD_INSTALL) {
        return cy.log(
          "SKIPPED - Environment is not currently prepared for adding a printer in cloud mode due to missing token handshake in fake printer"
        );
        this.skip();
      } else {
        const { organizationUuid, printerUuid, gCodeUuid } = printingEnvironment;
        simulatePrintGCode(organizationUuid, printerUuid, gCodeUuid);
        cy.visit(`/${organizationUuid}/printers/${printerUuid}`);
        cy.findByText(printingEnvironment.printerName).should("exist");
        cy.findByText("connected").should("exist");
        cy.findByText("Printing", { timeout: 100000 });
        testStableLabels();
      }
    });
  });
});

describe("Printers: Detail - Tabs", function () {
  let printingEnvironment;
  beforeEach(() => {
    cy.preparePrintingEnvironment().then((printEnv) => {
      printingEnvironment = printEnv;
      const { organizationUuid, printerUuid, gCodeUuid } = printingEnvironment;
      cy.visit(`/${organizationUuid}/printers/${printerUuid}`);
    });
  });

  it("Check Tabs", function () {
    cy.determineCloudInstall().then((IS_CLOUD_INSTALL) => {
      cy.log(`IS_CLOUD_INSTALL ${IS_CLOUD_INSTALL}`);
        if (IS_CLOUD_INSTALL) {
          cy.findByText("Controls", {timeout: 10000}).click();
          cy.contains(
            "div.tabs-content-message",
            "Controls are not available for a disconnected printer",
            {timeout: 10000}
          );
          cy.findByText("Jobs").click();
          cy.get("p.list-item").contains("No items found!");
          cy.findByText("Connection").click();
          cy.findByText("Client:").should("exist");
          cy.findByText("Settings").click();
          cy.findByText("Printer's name").should("exist")
        } else {
          this.skip();
        }

    });
  });
});


function simulatePrintGCode(organizationUuid, printerUuid, gcodeUuid) {
  cy.log(`start print`)
  return cy
    .getCookie("csrf_access_token")
    .then((token) => {
      return cy
        .request({
          method: "POST",
          url: `/api/organizations/${organizationUuid}/printjobs`,
          body: {
            gcode: gcodeUuid,
            printer: printerUuid,
          },
          headers: {
            "X-CSRF-TOKEN": token.value,
          },
        })
        .then(({ body }) => {
          return body;
        });
    });
};
