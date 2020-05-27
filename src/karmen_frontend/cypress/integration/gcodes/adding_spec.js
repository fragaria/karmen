import { Chance } from "chance";
const chance = new Chance();

describe("G-codes: Adding", function () {
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
        cy.get('button[id="navigation-menu-toggle"]').click();
        cy.get('a[id="navigation-gcodes"]').click();
        return cy.get('a[id="btn-add_gcode"]').click();
      });
  });

  // TODO this depends on window.env.IS_CLOUD_MODE - cypress should be run twice
  // against both modes or more precisely the different paths should be run separately
  it("fails with no file", function () {
    cy.get('button[type="submit"]').click();
    cy.get("form").contains("You need to select a file!");
  });

  it("adds gcode", function () {
    cy.get("input[name=file]").attachFile("S_Release.gcode");
    cy.get('button[type="submit"]')
      .click()
      .wait(3000)
      .then(() => {
        cy.location().then((loc) => {
          expect(loc.pathname).to.contains(`/${organizationUuid}/gcodes`);
          cy.findByText("Print g-code").click();
          cy.findByText("No available printers found.").wait(1000);
          cy.findByText("Close").click();
          cy.findByText("Download G-code").click();
          cy.findByText("Back to listing").click();
          cy.location().then((loc) => {
            expect(loc.pathname).to.eq(`/${organizationUuid}/gcodes`);
          });
        });
      });
  });
});
