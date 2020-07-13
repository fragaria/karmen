import { Chance } from "chance";
const chance = new Chance();

describe("Organizations: Adding", function () {
  beforeEach(() => {
    return cy.prepareAppWithUser().then((user) => {
      cy.toggleMenu("Organizations");
      return cy.findByText("+ Create new organization").click().reLogin(user);
    });
  });

  it("adds organization", function () {
    const name = "Interesting Organization";

    cy.findByText("Add organization").click()
    cy.log("Trying without organization name.");
    cy.get("form").contains("Name is required");

    cy.findByLabelText("Name").type(name);
    cy.findByText("Add organization")
      .click();
    cy.contains(".main-title", "Organizations")
    cy.contains('.list-item-title', name);
  });
});
