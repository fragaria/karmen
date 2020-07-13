import { Chance } from "chance";
const chance = new Chance();

const attachFile = (file) => cy.get("input[name=file]").attachFile(file);
const submitForm = () => cy.get('button[type="submit"]').click();

describe("G-codes: Adding", function () {
  let user;
  beforeEach(() => {
    return cy.prepareAppWithUser().then((data) => {
      user = data;
    });
  });

  it("upload gcode file", function () {
    cy.contains("G-Codes").click();

    cy.log("Cancelling the upload");
    cy.findByText("+ Upload a g-code").click();
    cy.findByText("Cancel").click();
    cy.contains("h1", "G-Codes")

    cy.log("Submitting without an upload file");
    cy.findByText("+ Upload a g-code").click();
    cy.get('button[type="submit"]').click();
    cy.get("form").contains("You need to select a file!");

    cy.log("Upload unsupported file");
    attachFile("text-sample.txt");
    submitForm();
    cy.get("form").contains("This does not seem like a G-Code file.");

    cy.log("Adding file")
    attachFile("S_Release.gcode");
    submitForm()
    cy.contains("h1", "S_Release.gcode");

    cy.log("Adding a file with path")
    cy.contains("G-Codes").click();
    const gcodePath = "some g-code path",
          gcodeName = "GCodeWithPath.gcode";
    cy.findByText("+ Upload a g-code").click();
    attachFile(gcodeName);
    cy.get("input[name=path]").type(gcodePath);
    submitForm()
    cy.contains('.main-title', gcodeName);

  });

  it.skip("fails with corrupted file", function () {
    // test is skipped due to absence of checking file content
    attachFile("invalid-content.gcode");
    submitForm();
    cy.get("form").contains("This G-Code file seems to be corrupted.");
  });

  it.skip("adds gcode with a very long path", function () {
    // skipped due to API returns 500
    attachFile("S_Release.gcode");
    cy.get("input[name=path]").type(chance.string({ length: 500 }));
    submitForm()
    cy.contains("Print g-code");
    cy.get('.main-title').contains("S_Release.gcode");
  });

});
