import { Chance } from "chance";

const chance = new Chance();

describe("Printers: Listing", function () {
  let user, printerUuid;
  beforeEach(() => {
    return cy
      .prepareAppWithUser()
      .then((data) => {
        user = data;
        return cy.determineCloudInstall().then((IS_CLOUD_INSTALL) => {
          if (IS_CLOUD_INSTALL) {
            return cy.addPrinter(
              IS_CLOUD_INSTALL,
              user.organizationUuid,
              chance.string(),
              chance.string()
            );
          } else {
            return cy.addPrinter(
              IS_CLOUD_INSTALL,
              user.organizationUuid,
              chance.string(),
              "172.16.236.13",
              8080
            );
          }
        });
      })
      .then((printer) => {
        printerUuid = printer.uuid;
        cy.logout()
          .login(user.email, user.password)
          .then((data) => {
            user = Object.assign(user, data);
          });
      });
  });

  it("has the create button", function () {
    cy.findByText("+ Add a printer").click();
    cy.location().then((loc) => {
      expect(loc.pathname).to.eq(`/${user.organizationUuid}/add-printer`);
    });
  });

  it("has link to printer settings", function () {
    cy.findByRole("listitem")
      .click()
      .then(() => {
        cy.get(".dropdown-item:first")
          .should("be.visible")
          .contains("Printer settings");
      });
  });
});
