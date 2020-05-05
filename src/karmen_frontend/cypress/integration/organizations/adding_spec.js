import { Chance } from "chance";
const chance = new Chance();

describe("Organizations: Adding", function () {
  let email, password;
  beforeEach(() => {
    email = chance.email();
    password = chance.string();
    return cy
      .logout()
      .createUser(email, password)
      .login(email, password)
      .then((data) => {
        return cy.visit("/add-organization");
      });
  });

  it("fails with no name", function () {
    cy.get("input#username").type(email);
    cy.get("input#password").type(password);
    cy.get('button[type="submit"]').click().wait(5000).then(() => {
      cy.get('button[type="submit"]').click();
      cy.get("form").contains("Name is required");
    });
  });

  it("adds organization", function () {
    const name = chance.string();
    cy.get("input#username").type(email);
    cy.get("input#password").type(password);
    cy.get('button[type="submit"]').click().wait(5000).then(() => {
      cy.get("input#name").type(name);
      cy.get('button[type="submit"]')
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
});
