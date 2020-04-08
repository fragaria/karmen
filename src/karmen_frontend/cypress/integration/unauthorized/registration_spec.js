describe("Unauthorized: Registration flow", function () {
  it("fails on bad e-mail", function () {
    cy.visit("/register");
    cy.get("input#realemail").type("not an e-mail");
    cy.get("button[type=submit]").click();
    cy.get("form").contains("That does not seem like an e-mail address");
  });

  it("will send an e-mail", function () {
    cy.visit("/register");
    cy.get("input#realemail").type("test@example.com");
    cy.get("button[type=submit]").click();
    cy.get("form").contains("e-mail will be sent shortly");
  });
});
