describe("Organizations: Listing", function () {
  let user;
  beforeEach(() => {
    return cy.prepareAppWithUser().then((data) => {
      user = data;
      cy.toggleMenu("Organizations");
    });
  });

  it("has default organization in the list", function () {
    cy.log('Has link to the default organization.');
    cy.get(".list-item-content").then((items) => {
      let foundDefaultOrganization = false;
      for (let i of items) {
        if (i.getAttribute("href").indexOf(user.organizationUuid) > -1) {
          foundDefaultOrganization = true;
        }
      }
      expect(foundDefaultOrganization).to.eq(true);
    });

    cy.log('Has link to settings');
    cy.get(".list-item .list-cta").click()
    cy.get(".dropdown-item").should("be.visible").click();
    cy.reLogin(user);
    cy.location().then((loc) => {
      expect(loc.pathname).to.eq(
        `/organizations/${user.organizationUuid}/settings`
      );
    });
  });
});
