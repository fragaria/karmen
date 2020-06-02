import { Chance } from "chance";
const chance = new Chance();

const optionDevicePill = "Karmen Pill";
const optionOtherDevice = "Other device";

const selectDeviceType = (option) => {
  return cy.get("#deviceType").select(option);
};

const submitForm = () => {
  return cy.get('button[type="submit"]').click();
};

const testWithNoName = () => {
  submitForm();
  cy.get("form").contains("Name is required");
};

const testWithNoAddress = () => {
  submitForm();
  cy.get("form").contains("Printer address is required in a proper format");
};

const testFillPillForm = (organizationUuid, address, timeout = 3000) => {
  const name = chance.string();
  cy.get("input#name").type(name);
  if (address) {
    cy.get("input#address").type(address);
  }
  submitForm()
    .wait(timeout)
    .then(() => {
      cy.location().then((loc) => {
        expect(loc.pathname).to.eq(
          `/${organizationUuid}/settings/tab-printers`
        );

        cy.get(".list-item-title").then((items) => {
          let foundPrinter = false;
          for (let i of items) {
            if (i.innerText.indexOf(name) > -1) {
              foundPrinter = true;
            }
          }
          expect(foundPrinter).to.eq(true);
        });
      });
    });
};

describe("Printers: Adding", function () {
  let user;

  beforeEach(() => {
    return cy.prepareAppWithUser().then((data) => {
      user = data;
      cy.toggleMenu("Settings");
      return cy.findByText("+ Add a printer").click();
    });
  });

  it("Test labels and inputs presence", function () {
    const testExpandable = () => {
      cy.findByText("API key").should("not.exist");
      cy.get("#apiKey").should("not.exist");
      cy.findByText("Hide advanced options").should("not.exist");

      cy.findByText("Advanced options").should("exist").click();
      cy.findByText("Advanced options").should("not.exist");

      cy.findByText("API key").should("exist");
      cy.get("#apiKey").should("exist");

      cy.findByText("Hide advanced options").should("exist").click();
      cy.findByText("Hide advanced options").should("not.exist");
      cy.findByText("API key").should("not.exist");
    };

    cy.determineCloudInstall().then((IS_CLOUD_INSTALL) => {
      cy.get("input#name").should("exist");
      cy.get("input#address").should("exist");
      cy.findByText("Add printer").should("exist");

      if (IS_CLOUD_INSTALL) {
        cy.findByText("I'm adding").should("exist");
        selectDeviceType(optionDevicePill);
        cy.findByText("Printer code").should("exist");
        cy.findByText("Connection key").should("not.exist");

        testExpandable();

        selectDeviceType(optionOtherDevice);
        cy.findByText("Printer code").should("not.exist");
        cy.findByText("Connection key").should("exist");

        testExpandable();
      } else {
        cy.findByText("I'm adding").should("not.exist");
        cy.findByText("Printer code").should("not.exist");
        cy.findByText("Connection key").should("not.exist");
        cy.findByText("Printer address").should("exist");

        testExpandable();
      }
    });
  });

  it("Fails with no name", function () {
    cy.determineCloudInstall().then((IS_CLOUD_INSTALL) => {
      if (IS_CLOUD_INSTALL) {
        selectDeviceType(optionDevicePill);
        testWithNoName();
        selectDeviceType(optionOtherDevice);
        testWithNoName();
      } else {
        testWithNoName();
      }
    });
  });

  it("Fails with no address", function () {
    cy.determineCloudInstall().then((IS_CLOUD_INSTALL) => {
      if (IS_CLOUD_INSTALL) {
        selectDeviceType(optionDevicePill);
        testWithNoAddress();
        selectDeviceType(optionOtherDevice);
        cy.get("form").should(
          "not.contain",
          "Printer address is required in a proper format"
        );
      } else {
        testWithNoAddress();
      }
    });
  });

  it("adds printer in non cloud mode", function () {
    cy.determineCloudInstall().then((IS_CLOUD_INSTALL) => {
      if (IS_CLOUD_INSTALL) {
        return cy.log(
          "SKIPPED - Test has been skipped due to it's valid only for cloud mode."
        );
      }
      testFillPillForm(user.organizationUuid, "172.16.236.11:8080");
    });
  });

  it("Pill: adds printer in cloud mode", function () {
    cy.determineCloudInstall().then((IS_CLOUD_INSTALL) => {
      if (!IS_CLOUD_INSTALL) {
        return cy.log(
          "SKIPPED - Test has been skipped due to it's valid only for non cloud mode."
        );
      }
      selectDeviceType(optionDevicePill);
      testFillPillForm(user.organizationUuid, "XPrinterCodeX");
    });
  });

  it("Other device: adds printer in cloud mode", function () {
    cy.determineCloudInstall().then((IS_CLOUD_INSTALL) => {
      if (!IS_CLOUD_INSTALL) {
        return cy.log(
          "SKIPPED - Test has been skipped due to it's valid only for non cloud mode."
        );
      }
      selectDeviceType(optionOtherDevice);
      testFillPillForm(user.organizationUuid, null, 10000);
    });
  });
});
