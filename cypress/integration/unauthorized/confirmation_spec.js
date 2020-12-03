import { Chance } from "chance";
const chance = new Chance();
let apiBase = Cypress.env("apiBase");

describe("Unauthorized: Activation flow", function () {
  let email = null;
  let url = null;


  beforeEach(() => {
    email = chance.email();
    return cy
      .log(`getting activation token for ${email}`)
      .request({
        method: "POST",
        url: apiBase + 'invitations/',
        body: {
          email
        }
      })
      .then((data) => {
        cy.getActivationToken(email, true).then((uri) => {
          url = uri;
        });
      });
  });

  it("bad activation token", function () {
    cy.visit("/confirmation/?activate=1234");
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq("/login");
    });
  });

  it("good activation token", function () {
    cy.visit(url).wait(300);
    cy.location().then((loc) => {
      cy.get("form").contains("New password");
    });
  });

  it("password set mismatch", function () {
    cy.visit(url);
    cy.location().then((loc) => {
      cy.get("input#password").type("password");
      cy.get("input#passwordConfirmation").type("not a password");
      cy.get("button[type=submit]").click();
      cy.get("form").contains("Passwords do not match");
    });
  });

  it("password set success", function () {
    cy.visit(url);
    cy.location().then((loc) => {
      cy.get("input#password").type("password");
      cy.get("input#passwordConfirmation").type("password");
      cy.get("button[type=submit]").click();
      cy.get("form").contains("Your account has been activated");
    });
  });
});
