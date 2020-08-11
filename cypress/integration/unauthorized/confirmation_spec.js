import { Chance } from "chance";
const chance = new Chance();

describe("Unauthorized: Activation flow", function () {
  let token = null;
  let email = null;
  let url = null;

  const checkLocation = (loc) => {
    expect(loc.pathname + loc.search).to.eq(url);
  };

  beforeEach(() => {
    email = chance.email();
    return cy
      .log(`getting activation token for ${email}`)
      .request({
        method: "POST",
        url: `/api/tests-admin/users/register`,
        body: {
          email: email,
        },
        headers: {
          "X-local-tests-token": Cypress.env("apiAdminToken"),
        },
      })
      .then((data) => {
        token = data.body.activation_key;
        url = `/confirmation/?activate=${token}`;
      });
  });

  it("bad activation token", function () {
    cy.visit("/confirmation/?activate=1234");
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq("/login");
    });
  });

  it("good activation token", function () {
    cy.visit(url);
    cy.location().then((loc) => {
      checkLocation(loc);
      cy.get("form").contains("New password");
    });
  });

  it("password set mismatch", function () {
    cy.visit(url);
    cy.location().then((loc) => {
      checkLocation(loc);
      cy.get("input#password").type("password");
      cy.get("input#passwordConfirmation").type("not a password");
      cy.get("button[type=submit]").click();
      cy.get("form").contains("Passwords do not match");
    });
  });

  it("password set success", function () {
    cy.visit(url);
    cy.location().then((loc) => {
      checkLocation(loc);
      cy.get("input#password").type("password");
      cy.get("input#passwordConfirmation").type("password");
      cy.get("button[type=submit]").click();
      cy.get("form").contains("Your account has been activated");
    });
  });
});
