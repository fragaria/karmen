describe("Printers listing", function () {
  beforeEach(() => {
    return cy.loginAsTestAdmin().visit("/");
  });

  it("shows printers", function () {
    cy.visit("/b3060e41-e319-4a9b-8ac4-e0936c75f275/printers");
    cy.get("main h1").contains("Printers");
  });
});
