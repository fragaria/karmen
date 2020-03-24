describe("Login flow", function () {
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
    cy.get("input#username").type("karmen");
    cy.get("input#password").type("not a password");
    cy.get("button[type=submit]").click();
    cy.get("form").contains("Login unsuccessful");
  });

  it("logs in with username", function () {
    cy.visit("/login");
    cy.get("input#username").type("test-user");
    cy.get("input#password").type("user-password");
    cy.get("button[type=submit]").click();
    cy.get("main .content").should("have.class", "printer-list");
  });

  it("logs in with e-mail", function () {
    cy.visit("/login");
    cy.get("input#username").type("test-user@karmen.local");
    cy.get("input#password").type("user-password");
    cy.get("button[type=submit]").click();
    cy.get("main .content").should("have.class", "printer-list");
  });
});
