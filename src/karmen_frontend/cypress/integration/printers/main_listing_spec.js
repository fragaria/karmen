import { Chance } from "chance";
const chance = new Chance();

describe("Printers: Main listing", function () {
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
      });
  });

  it("redirects root to printers list", function () {
    cy.visit("/");
    cy.get("main h1").contains("Printers");
  });

  it("redirects organization root to printers list", function () {
    cy.visit(`/${organizationUuid}`);
    cy.get("main h1").contains("Printers");
  });
});
