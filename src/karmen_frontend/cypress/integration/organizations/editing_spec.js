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
      .then((data) => {
        organizationUuid = Object.keys(data.organizations)[0];
        return cy.visit(`/organizations/${organizationUuid}/settings`);
      });
  });

  it("fails with no name", function () {
    cy.get("input#name").clear();
    cy.get('button[type="submit"]').click();
    cy.get("form").contains("Name cannot be empty");
  });

  it("changes organization name", function () {
    const name = chance.string();
    cy.get("input#name").clear().type(name);
    cy.get('button[type="submit"]')
      .click()
      .then(() => {
        cy.location().then((loc) => {
          expect(loc.pathname).to.eq("/organizations");
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
