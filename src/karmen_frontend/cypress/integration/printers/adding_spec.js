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

/**
 * Fills device addition form
 *
 * @param {Object=}  user - user to use for authentication refresh (null for no refresh)
 * @param {string=}  address - address to fill to the printer
 */
const testFillPillForm = (user, address) => {
  const name = chance.string();
  cy.get("input#name").type(name);
  if (address) {
    cy.get("input#address").type(address);
  }
  submitForm();
  if (user) {
    cy.reLogin(user);
  }
  // now check that the printer is present
  cy.get(".list-item-title", {timeout: 8000}).contains(name);
};

describe("Printers: Adding", function () {
  let user;

  before(() => {
    cy.prepareAppWithUser().then((data) => {
      user = data;
    });
  });
  beforeEach(() => {
    cy.login(user.email, user.password).then(() => { });
    cy.visit('/');
    cy.findByText("+ Add a printer", {timeout: 8000}).click();
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

  it("Add new device", function () {
    cy.determineCloudInstall().then((IS_CLOUD_INSTALL) => {
      if (IS_CLOUD_INSTALL) {
        cy.log('Testing invalid inputs');
        selectDeviceType(optionDevicePill);
        testWithNoName();
        selectDeviceType(optionOtherDevice);
        testWithNoName();


        selectDeviceType(optionDevicePill);
        testWithNoAddress();
        selectDeviceType(optionOtherDevice);
        cy.get("form").should(
          "not.contain",
          "Printer address is required in a proper format"
        );

        cy.log('Adding pill device.');
        selectDeviceType(optionDevicePill);
        testFillPillForm(user, "XPrinterCodeX");

        cy.log('Adding non-pill device.');
        cy.findByText("+ Add a printer", {timeout: 8000}).click();
        selectDeviceType(optionOtherDevice);
        testFillPillForm(null, null);

      } else {
        cy.log('Testing invalid inputs');
        testWithNoName();
        testWithNoAddress();

        cy.log('Adding pill device.');
        testFillPillForm(user, "172.16.236.11:8080");
      }
    });
  });
});
