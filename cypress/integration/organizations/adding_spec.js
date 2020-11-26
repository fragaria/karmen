import { Chance } from "chance";
const chance = new Chance();

describe("Organizations: Adding", function () {
  beforeEach(() => {
    return cy.prepareAppWithUser().then((data) => {
      cy.toggleMenu("My organizations");
      return cy.findByText("+ Create new organization").click();
    });
  });

  it("fails with no name", function () {
    cy.findByText("Add organization").click()
    cy.get("form").contains("Name is required");
  });

  it("adds organization", function () {
    const name = chance.string();
    cy.findByLabelText("Name").type(name);
    cy.findByText("Add organization")
      .click()
      .wait(3000)
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
