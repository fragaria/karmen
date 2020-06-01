import { Chance } from "chance";
const chance = new Chance();

describe("G-codes: Detail", function () {
  let email, password, organizationUuid, gCodeUuid;
  beforeEach(() => {
    email = chance.email();
    password = chance.string();
    return cy
      .logout()
      .createUser(email, password)
      .login(email, password)
      .then((data) => {
        organizationUuid = Object.keys(data.organizations)[0];
      })
      .then(() => {
        return cy.addGCode("S_Release.gcode", organizationUuid, "");
      })
      .then((response) => {
        gCodeUuid = response.uuid;
        cy.visit(`/${organizationUuid}/gcodes/${gCodeUuid}`);
      });
  });

  it("Check labels and controls", () => {
    cy.findByText("Size:").should("exist");
    cy.findByText("Sliced with:").should("exist");
    cy.findByText("Uploaded by:").should("exist");
    cy.findByText("Uploaded at:").should("exist");

    cy.findByText("Print g-code").click();
    cy.findByText("No available printers found.").wait(1000);
    cy.get("div.modal-content button.modal-close").click();

    cy.findByText("Download G-code").click();

    cy.findByText("Back to listing").click();
    cy.location().then((loc) => {
      expect(loc.pathname).to.eq(`/${organizationUuid}/gcodes`);
    });
  });
});

describe("G-codes: Detail: Print", function () {
  let printingEnvironment;

  beforeEach(() => {
    cy.preparePrintingEnvironment().then((printEnv) => {
      printingEnvironment = printEnv;
      cy.visit(
        `/${printingEnvironment.organizationUuid}/gcodes/${printingEnvironment.gCodeUuid}`
      );
    });
  });

  it("Run print", () => {
    cy.determineCloudInstall().then((IS_CLOUD_INSTALL) => {
      if (IS_CLOUD_INSTALL) {
        return cy.log(
          "SKIPPED - Test has been skipped due to it's valid only for cloud mode."
        );
      } else {
        cy.findByText("Print g-code").click();
        cy.printGCode(printingEnvironment.printerName);
      }
    });
  });
});
