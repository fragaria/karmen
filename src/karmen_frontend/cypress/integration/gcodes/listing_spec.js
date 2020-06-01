import { Chance } from "chance";
const chance = new Chance();

const visitGCodes = () => {
  cy.get('button[id="navigation-menu-toggle"]').click();
  return cy.get('a[id="navigation-gcodes"]').click();
};

describe("G-codes: Listing - no G-codes uploaded", function () {
  let email, password, organizationUuid;
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
        cy.logout()
          .login(email, password)
          .then(() => {
            return visitGCodes();
          });
      });
  });

  it("search", function () {
    cy.get(".list-item").findByText("No items found!").should("exist");

    cy.get("#filter").type("Non existing Gcode");
    cy.get(".list-item").findByText("Non existing Gcode").should("not.exist");
    cy.get(".list-item").findByText("No items found!").should("exist");
  });
});

describe("G-codes: Listing", function () {
  let email, password, organizationUuid;
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
      .then(() => {
        cy.logout()
          .login(email, password)
          .then(() => {
            return visitGCodes();
          });
      });
  });

  it("search", function () {
    cy.get("#filter").type("S_Release");
    cy.get(".list-item").findByText("S_Release.gcode").should("exist");
    cy.get(".list-item").findByText("No items found!").should("not.exist");

    cy.get("#filter").type("Non existing Gcode");
    cy.get(".list-item").findByText("Non existing Gcode").should("not.exist");
    cy.get(".list-item").findByText("S_Release.gcode").should("not.exist");

    cy.get(".list-item").findByText("No items found!").should("exist");
  });

  it("has the create button", function () {
    cy.get("#btn-add_gcode").should(
      "have.attr",
      "href",
      `/${organizationUuid}/add-gcode`
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
        cy.get("div.modal-content button.modal-close").click();
      });

    cy.get(".list-item .list-cta")
      .click()
      .then(() => {
        cy.get(".dropdown-item.text-secondary")
          .findByText("Delete g-code")
          .click();
        cy.get("div.modal-content").findByText("Cancel").click();
      });

    cy.get(".list-item .list-cta")
      .click()
      .then(() => {
        cy.get(".dropdown-item.text-secondary")
          .findByText("Delete g-code")
          .click();

        cy.get("div.modal-content").findByText("Yes, delete it").click();
        cy.findByText("No items found!");
      });
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
