import { Chance } from "chance";

const chance = new Chance();

describe("Printers: Listing", function () {
  let user, printerUuid;
  before(() => {
    return cy
      .prepareAppWithUser()
      .then((data) => {
        user = data;
        return cy.determineCloudInstall().then((IS_CLOUD_INSTALL) => {
          if (IS_CLOUD_INSTALL) {
            return addPrinter(
              IS_CLOUD_INSTALL,
              user.organizationUuid,
              chance.string(),
              chance.string()
            );
          } else {
            return addPrinter(
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
      });
  });

  beforeEach(() => {
    cy.login(user.email, user.password)
  });

  it("has the create button", function () {
    cy.findByText("+ Add a printer").click();
    cy.location().then((loc) => {
      expect(loc.pathname).to.eq(`/${user.organizationUuid}/add-printer`);
    });
  });

  it("has link to organization settings", function () {
    // click main menu
    cy.get("[data-cy=main-menu-toggle]").click()
    // open organization settings
    cy.get("[data-cy=menu-org-settings]").click()
    // find first printer and click it's submenu
    cy.reLogin(user);

    cy.findByRole("listitem")
      .findByRole("menu")
      .click()
      .contains(".dropdown-item", "Printer settings");
  });
});


function addPrinter(isCloudMode, organizationUuid, name, ipOrToken,
  port = null) {
    cy.log(`adding printer`);
    return cy
      .getCookie("csrf_access_token")
      .then((token) => {
        return cy
          .request({
            method: "POST",
            url: `/api/organizations/${organizationUuid}/printers`,
            body: {
              name,
              ...(isCloudMode ? { token: ipOrToken } : { ip: ipOrToken, port }),
              protocol: "http",
            },
            headers: {
              "X-CSRF-TOKEN": token.value,
            },
          })
          .then(({ body }) => {
            return body;
          });
      });
};
