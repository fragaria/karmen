import { Chance } from "chance";
const chance = new Chance();

describe("Printers: Main listing", function () {
  let user;
  beforeEach(() => {
    return cy.prepareAppWithUser().then((data) => {
      user = data;
    });
  });

  it("redirects root to printers list", function () {
    cy.visit("/");
    cy.get("main h1").contains("Printers");
  });

  it("redirects organization root to printers list", function () {
    cy.visit(`/${user.organizationUuid}`);
    cy.get("main h1").contains("Printers");
  });
});
