import { Chance } from "chance";
const chance = new Chance();

const attachFile = (file) => cy.get("input[name=file]").attachFile(file);
const submitForm = () => cy.get('button[type="submit"]').click();

const testGCodeIsAdded = (organizationUuid) => {
  cy.location().then((loc) => {
    expect(loc.pathname).to.contains(`/${organizationUuid}/gcodes`);
  });
};

describe("G-codes: Adding", function () {
  let email, password, organizationUuid;
  beforeEach(() => {
    email = chance.email();
    password = chance.string();
    return cy
      .logout()
      .createUser(email, password)
      .login(email, password)
      .then((data) => {
        organizationUuid = Object.keys(data.organizations)[0];
        cy.get('button[id="navigation-menu-toggle"]').click();
        cy.get('a[id="navigation-gcodes"]').click();
        return cy.get('a[id="btn-add_gcode"]').click();
      });
  });

  it("fails with no file", function () {
    cy.get('button[type="submit"]').click();
    cy.get("form").contains("You need to select a file!");
  });

  it.skip("fails with corrupted file", function () {
    // test is skipped due to absence of checking file content
    attachFile("invalid-content.gcode");
    submitForm();
    cy.get("form").contains("This G-Code file seems to be corrupted.");
  });

  it("fails with invalid file", function () {
    attachFile("text-sample.txt");
    submitForm();
    cy.get("form").contains("This does not seem like a G-Code file.");
  });

  it("adds gcode", function () {
    attachFile("S_Release.gcode");
    submitForm()
      .wait(3000)
      .then(() => testGCodeIsAdded(organizationUuid));
  });

  it("adds gcode with path", function () {
    attachFile("S_Release.gcode");
    cy.get("input[name=path]").type("some path");
    submitForm()
      .wait(3000)
      .then(() => testGCodeIsAdded(organizationUuid));
  });

  it.skip("adds gcode with a very long path", function () {
    // skipped due to API returns 500
    attachFile("S_Release.gcode");
    cy.get("input[name=path]").type(chance.string({ length: 500 }));
    submitForm()
      .wait(3000)
      .then(() => testGCodeIsAdded(organizationUuid));
  });

  it("adds gcode - cancel form", function () {
    cy.findByText("Cancel").click();
    cy.location().then((loc) => {
      expect(loc.pathname).to.eq(`/${organizationUuid}/gcodes`);
    });
  });
});
