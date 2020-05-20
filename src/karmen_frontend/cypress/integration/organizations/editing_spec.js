import { Chance } from "chance";
const chance = new Chance();

describe("Organizations: Editing", function () {
  let email, password, organizationUuid;
  beforeEach(() => {
    email = chance.email();
    password = chance.string();
    return cy
      .logout()
      .createUser(email, password)
      .login(email, password)
      .then(function visitOrganization(data) {
          organizationUuid = Object.keys(data.organizations)[0];
          cy.get('button[id="navigation-menu-toggle"]').click()
          cy.get('a[id="navigation-organizations"]').click()
          return cy.get('a[id="btn-create_organization"]').click()

        }) ;
  });

  it("fails with no name", function () {

      cy.get("input#name").clear();
      cy.get('button[type="submit"]').click();
      cy.get("form").contains("Name is required!");
  });

  it("changes organization name", function () {
    const name = chance.string();

    cy.get("input#name").clear().type(name);
    cy.get('button[type="submit"]')
        .click()
        .wait(500)
        .then(() => {
          cy.location().then((loc) => {
            expect(loc.pathname).to.be.oneOf([`/organizations/${organizationUuid}/organizations`,  `/organizations`]);
            cy.get(".list-item-title").then((items) => {
              let foundOrganization = false;
              for (let i of items) {
                if (i.innerText.indexOf(name) > -1) {
                  foundOrganization = true;
                }
              }
              expect(foundOrganization).to.eq(true);
            });
          });
        });
    });
});
