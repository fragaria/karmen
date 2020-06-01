describe.only("Unauthorized: Registration flow", function () {
  it("fails on bad email", function () {
    cy.visit("/register");
    cy.get("input#realemail").type("not an email");
    cy.get("button[type=submit]").click();
    cy.get("form").contains("That does not seem like an email address");
  });

  it("will send an email", function () {
    cy.visit("/register");
    cy.get("input#realemail").type("test@example.com");
    cy.get("button[type=submit]").click();
    cy.get("form").contains("We've sent you an email to test@example.com with the instructions on how to proceed next.");
  });
});
