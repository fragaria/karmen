import { Chance } from "chance";
const chance = new Chance();

const attachFile = (file) => cy.get("input[name=file]").attachFile(file);
const submitForm = () => cy.get('button[type="submit"]').click();

describe("G-codes: Adding", function () {
  let user;
  beforeEach(() => {
    return cy.prepareAppWithUser().then((data) => {
      user = data;
      cy.contains("G-Codes").click();
      return cy.findByText("+ Upload a g-code").click();
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
    cy.contains("Print g-code");
    cy.get('.main-title').contains("S_Release.gcode");
  });

  it("adds gcode with path", function () {
    attachFile("S_Release.gcode");
    cy.get("input[name=path]").type("some path");
    submitForm()
    cy.contains("Print g-code");
    cy.get('.main-title').contains("S_Release.gcode");
  });

  it.skip("adds gcode with a very long path", function () {
    // skipped due to API returns 500
    attachFile("S_Release.gcode");
    cy.get("input[name=path]").type(chance.string({ length: 500 }));
    submitForm()
    cy.contains("Print g-code");
    cy.get('.main-title').contains("S_Release.gcode");
  });

  it("adds gcode - cancel form", function () {
    cy.findByText("Cancel").click();
    cy.location().then((loc) => {
      expect(loc.pathname).to.eq(`/${user.organizationUuid}/gcodes`);
    });
  });
});
