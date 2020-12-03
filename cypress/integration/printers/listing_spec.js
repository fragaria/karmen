import { Chance } from "chance";

const chance = new Chance();

describe("Printers: Listing", function () {
  let user, printerUuid;
  beforeEach(() => {
    return cy
      .prepareAppWithUser()
      .then((data) => {
        user = data;
            return cy.addPrinter(
              user.organizationUuid,
              chance.string(),
              "http://172.16.236.13",
              8080
            );
      })
      .then((printer) => {
        printerUuid = printer.uuid;
      });
  });

  it("has the create button", function () {
    cy.findByText("+ Add a printer").click();
    cy.location().then((loc) => {
      expect(loc.pathname).to.eq(`/${user.organizationUuid}/add-printer`);
    });
  });

  // No organization list in menu when only single one exists anymore
  it.skip("has link to organization settings", function () {
    cy.toggleMenu("My organizations");
    cy.findByRole("listitem")
      .findByRole("menu")
      .click()
      .then(() => {
        cy.get(".dropdown-item:first")
          .should("be.visible")
          .contains("Printer settings");
      });
  });
});
