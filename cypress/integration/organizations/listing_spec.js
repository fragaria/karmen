describe("Organizations: Listing", function () {
  let user;
  beforeEach(() => {
    return cy.prepareAppWithUser().then((data) => {
      user = data;
      cy.toggleMenu("My organizations");
    });
  });

  it("has default organization in the list", function () {
    cy.get(".list-item-content").then((items) => {
      let foundDefaultOrganization = false;
      for (let i of items) {
        if (i.getAttribute("href").indexOf(user.organizationUuid) > -1) {
          foundDefaultOrganization = true;
        }
      }
      expect(foundDefaultOrganization).to.eq(true);
    });
  });

  it("has the create button", function () {
    cy.get(".main-title a").should("have.attr", "href", "/add-organization");
  });

  it("has link to organization settings", function () {
    cy.get(".list-item .list-cta")
      .click()
      .then(() => {
        cy.get(".dropdown-item").should("be.visible").click();
        cy.location().then((loc) => {
          expect(loc.pathname).to.eq(
            `/organizations/${user.organizationUuid}/settings`
          );
        });
      });
  });
});
