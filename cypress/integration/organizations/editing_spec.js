import { Chance } from "chance";
const chance = new Chance();

describe("Organizations: Editing", function () {
  let user;
  beforeEach(() => {
    return cy.prepareAppWithUser().then((data) => {
      user = data;
      cy.toggleMenu("My organizations");
      return cy.findByText("+ Create new organization").click();
    });
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
          expect(loc.pathname).to.be.oneOf([
            `/organizations/${user.organizationUuid}/organizations`,
            `/organizations`,
          ]);
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
