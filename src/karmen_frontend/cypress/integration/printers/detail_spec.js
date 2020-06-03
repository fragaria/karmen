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

describe("Printers: Detail - State operational", function () {
  let printingEnvironment;
  beforeEach(() => {
    cy.preparePrintingEnvironment().then((printEnv) => {
      printingEnvironment = printEnv;
      cy.visit(
        `/${printingEnvironment.organizationUuid}/printers/${printingEnvironment.printerUuid}`
      );
    });
  });

  it("Check Controls tab", function () {
    cy.findByText(printingEnvironment.printerName).should("exist");

    cy.determineCloudInstall().then((IS_CLOUD_INSTALL) => {
      if (IS_CLOUD_INSTALL) {
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
});

describe("Printers: Detail - State Printing", function () {
  let printingEnvironment;
  beforeEach(() => {
    cy.preparePrintingEnvironment().then((printEnv) => {
      printingEnvironment = printEnv;
      const { organizationUuid, printerUuid, gCodeUuid } = printingEnvironment;

      cy.determineCloudInstall().then((IS_CLOUD_INSTALL) => {
        if (IS_CLOUD_INSTALL) {
          return cy.log(
            "SKIPPED - Environment is not currently prepared for adding a printer in cloud mode due to missing token handshake in fake printer"
          );
        } else {
          cy.simulatePrintGCode(organizationUuid, printerUuid, gCodeUuid);
          cy.visit(`/${organizationUuid}/printers/${printerUuid}`);
        }
      });
    });
  });

  it("Check Controls tab", function () {
    cy.determineCloudInstall().then((IS_CLOUD_INSTALL) => {
      if (IS_CLOUD_INSTALL) {
        return cy.log(
          "SKIPPED - Environment is not currently prepared for adding a printer in cloud mode due to missing token handshake in fake printer"
        );
      } else {
        cy.findByText(printingEnvironment.printerName).should("exist");
        cy.findByText("connected").should("exist");
        cy.findByText("Printing", { timeout: 100000 });
        testStableLabels();
      }
    });
  });
});
