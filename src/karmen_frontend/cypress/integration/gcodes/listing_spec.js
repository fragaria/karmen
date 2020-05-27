import { Chance } from "chance";
// draft
const chance = new Chance();

describe("G-codes: Listing", function () {
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
        return cy.addGCode(organizationUuid, "");
      })
      .then((response) => {
        gCodeUuid = response.uuid;
        cy.logout()
          .login(email, password)
          .then(() => {
            cy.get('button[id="navigation-menu-toggle"]').click();
            return cy.get('a[id="navigation-gcodes"]').click();
          });
      });
  });

  it("has the create button", function () {
    cy.get("#btn-add_gcode").should(
      "have.attr",
      "href",
      `/${organizationUuid}/add-gcode`
    );
  });

  it("check dropdown menu", function () {
    cy.get(".list-item .list-cta")
      .its("length")
      .should("eq", 1);
    cy.get(".list-item .list-cta")
      .click()
      .then(() => {
        cy.get(".dropdown-item:first").findByText("Print g-code").click();
        cy.get("div.modal-content").findByText("Print G-Code");
        cy.get("div.modal-content").findByText("No available printers found.");
        cy.get("div.modal-content").findByText("Close").click();
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
