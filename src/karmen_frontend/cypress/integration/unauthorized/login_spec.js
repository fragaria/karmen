import { Chance } from "chance";
const chance = new Chance();

describe("Unauthorized: Login flow", function () {
  let email, password;
  beforeEach(() => {
    email = chance.email();
    password = chance.string();
    return cy.prepareTestUser(email, password);
  });

  it("fails on empty username", function () {
    cy.visit("/login");
    cy.get("input#password").type("not a password");
    cy.get("button[type=submit]").click();
    cy.get("form").contains("Username is required");
  });

  it("fails on empty password", function () {
    cy.visit("/login");
    cy.get("input#username").type("not a username");
    cy.get("button[type=submit]").click();
    cy.get("form").contains("Password is required");
  });

  it("fails on bad username password combo", function () {
    cy.visit("/login");
    cy.get("input#username").type(email);
    cy.get("input#password").type("not a password");
    cy.get("button[type=submit]").click();
    cy.get("form").contains("Invalid email or password");
  });

  it("logs in with username", function () {
    cy.visit("/login");
    cy.get("input#username").type(email);
    cy.get("input#password").type(password);
    cy.get("button[type=submit]").click();
    cy.get('[data-cy=authenticated-org-root]', {timeout: 15000})
  });
});
