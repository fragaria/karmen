import { Chance } from "chance";
const chance = new Chance();

const getActivationLink = (email) => {
  cy.log(`requesting mail contents for ${email}`)
    .request(`http://localhost:8088/mail/${email}`)
    .then(({ body }) => {
      if (!body || !body.to) {
        return getActivationLink(email);
      } else {
        return Promise.resolve(body);
      }
    });
};

describe("Activation flow", function () {
  let token = null;
  let email = null;
  beforeEach(() => {
    email = chance.email();
    return cy
      .log(`getting activation token for ${email}`)
      .request("POST", `/api/users/me`, {
        email: email,
      })
      .then(() => {
        return getActivationLink(email);
      })
      .then((body) => {
        const url = new URL(body.text.match(/http:\/\/.*confirmation.*/i));
        token = url.searchParams.get("activate");
      });
  });

  it("bad activation token", function () {
    cy.visit("/confirmation/?activate=1234");
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq("/login");
    });
  });

  it("good activation token", function () {
    cy.visit(`/confirmation/?activate=${token}`);
    cy.get("form").contains("New password");
  });

  it("password set mismatch", function () {
    cy.visit(`/confirmation/?activate=${token}`);
    cy.get("input#password").type("password");
    cy.get("input#passwordConfirmation").type("not a password");
    cy.get("button[type=submit]").click();
    cy.get("form").contains("Passwords do not match");
  });

  it("password set success", function () {
    cy.visit(`/confirmation/?activate=${token}`);
    cy.get("input#password").type("password");
    cy.get("input#passwordConfirmation").type("password");
    cy.get("button[type=submit]").click();
    cy.get("form").contains("Account activated");
  });
});
