import { Chance } from "chance";
const chance = new Chance();


describe("G-codes: Listing", function () {
  let user;
  before(() => {
    cy
      .prepareAppWithUser()
      .then((data) => {
        user = data;
        cy.addGCode("S_Release.gcode", user.organizationUuid, "");
      })
  });

  beforeEach(() => {
    cy
      .login(user.email, user.password)
      .toggleMenu("G-Codes");
  });

  it("search", function () {
    cy.log('Search for non-existing file.');
    cy.get("#filter").type("Non existing Gcode");
    cy.findByText("No items found!").should("exist");
    cy.get(".list-item").findByText("S_Release.gcode").should("not.exist");

    cy.log('Search for existing file.');
    cy.get("#filter").clear().type("S_Release");
    cy.contains(".list-item-subtitle", "S_Release.gcode").should("exist");

    cy.contains(".list-item", "No items found!").should("not.exist");

  });

  it("has the create button", function () {
    cy.get("#btn-add_gcode").should(
      "have.attr",
      "href",
      `/${user.organizationUuid}/add-gcode`
    );
  });

  it("check dropdown menu", function () {
    cy.get(".list-item .list-cta").its("length").should("eq", 1);
    cy.get(".list-item .list-cta")
      .click()
      .then(() => {
        cy.get(".dropdown-item:first").findByText("Print g-code").click();
        cy.get("div.modal-content").findByText("Print G-Code");
        cy.get("div.modal-content").findByText("No available printers found.");
        cy.get(".modal-close").click();
      });

    cy.get(".list-item .list-cta").click()
    cy.get(".dropdown-item.text-secondary")
      .findByText("Delete g-code")
      .click();

    cy.contains(".modal-content .btn", "Cancel").click();

    cy.get(".list-item .list-cta").click();
    cy.get(".dropdown-item.text-secondary")
      .findByText("Delete g-code")
      .click();
    cy.get("div.modal-content").findByText("Yes, delete it").click()

    cy.findByText("No items found!");
  });
});

describe("G-codes: Listing: Print", function () {
  let printerEnvironment;
  beforeEach(() => {
    cy.preparePrintingEnvironment().then((printEnv) => {
      printerEnvironment = printEnv;
      cy.visit(`/${printerEnvironment.organizationUuid}/gcodes`);
    });
  });

  it("print g-code", () => {
    cy.determineCloudInstall().then((IS_CLOUD_INSTALL) => {
      if (IS_CLOUD_INSTALL) {
        return cy.log(
          "SKIPPED - Test has been skipped due to it's valid only for cloud mode."
        );
      } else {
        cy.get(".list-item .list-cta")
          .click()
          .then(() => {
            cy.get(".dropdown-item:first").findByText("Print g-code").click();
            cy.printGCode(printerEnvironment.printerName);
          });
      }
    });
  });
});
