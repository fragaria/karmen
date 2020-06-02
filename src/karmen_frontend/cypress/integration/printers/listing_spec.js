import {Chance} from "chance";

const chance = new Chance();

describe("Printers: Listing", function () {
  let email, password, organizationUuid, printerUuid;
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
        return cy.addPrinter(
          organizationUuid,
          chance.string(),
          "172.16.236.11",
          8080
        );
      })
      .then((response) => {
        printerUuid = response.uuid;
        cy.logout().login(email, password).then(() => {
          cy.get('button[id="navigation-menu-toggle"]').click();
          return cy.get('a[id="navigation-settings"]').click();
        });
      });
  });

  it("has the create button", function () {
    cy.get(".react-tabs__tab-panel__header a").should(
      "have.attr",
      "href",
      `/${organizationUuid}/add-printer`
    );
  });

  it("has link to printer settings", function () {
    cy.get(".list-item .list-cta")
      .click()
      .then(() => {
        cy.get(".dropdown-item:first")
          .should("be.visible")
          .contains("Printer settings");
      });
  });
});
