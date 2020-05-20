import { Chance } from "chance";
const chance = new Chance();

describe("Organizations: Listing", function () {
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
          cy.get('button[id="navigation-menu-toggle"]').click()
          return cy.get('a[id="navigation-organizations"]').click()
      });
  });

  it("has default organization in the list", function () {
    cy.get(".list-item-content").then((items) => {
      let foundDefaultOrganization = false;
      for (let i of items) {
        if (i.getAttribute("href").indexOf(organizationUuid) > -1) {
          foundDefaultOrganization = true;
        }
      }
      expect(foundDefaultOrganization).to.eq(true);
    });
  });

  it("has the create button", function () {
    cy.get(".main-title a").should("have.attr", "href", "/add-organization");
  });

  it("has link to organization settings", function () {
    cy.get(".list-item .list-cta")
      .click()
      .then(() => {
        cy.get(".dropdown-item").should("be.visible").click();
        cy.location().then((loc) => {
          expect(loc.pathname).to.eq(
            `/organizations/${organizationUuid}/settings`
          );
        });
      });
  });
});
