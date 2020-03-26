import { Chance } from "chance";
const chance = new Chance();

describe("Printers: Adding", function () {
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
        return cy.visit(`/${organizationUuid}/add-printer`);
      });
  });

  // TODO this depends on window.env.IS_CLOUD_MODE - cypress should be run twice
  // against both modes or more precisely the different paths should be run separately
  it("fails with no name", function () {
    cy.get('button[type="submit"]').click();
    cy.get("form").contains("Name is required");
  });

  it("fails with no addres", function () {
    cy.get("input#name").type(chance.string());
    cy.get('button[type="submit"]').click();
    cy.get("form").contains("Printer address is required");
  });

  it("fails with bad addres", function () {
    cy.get("input#name").type(chance.string());
    cy.get("input#address").type(chance.string());
    cy.get('button[type="submit"]').click();
    cy.get("form").contains("Printer address is required");
  });

  it("adds printer", function () {
    const name = chance.string();
    cy.get("input#name").type(name);
    cy.get("input#address").type("172.16.236.11:8080");
    cy.get('button[type="submit"]')
      .click()
      .wait(3000)
      .then(() => {
        cy.location().then((loc) => {
          expect(loc.pathname).to.eq(
            `/${organizationUuid}/settings/tab-printers`
          );
          cy.get(".list-item-title").then((items) => {
            let foundPrinter = false;
            for (let i of items) {
              if (i.innerText.indexOf(name) > -1) {
                foundPrinter = true;
              }
            }
            expect(foundPrinter).to.eq(true);
          });
        });
      });
  });
});
