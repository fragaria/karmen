import { Chance } from "chance";
const chance = new Chance();

describe("No Organization: Adding", function () {
  let email, password, user_uuid, org_uuid;
  beforeEach(() => {
    email = chance.email();
    password = chance.string();
    cy.prepareTestUser(email, password).then( (response) => {
      user_uuid = response.body.user_uuid;
      org_uuid = response.body.organizations[0].uuid;
      console.log(user_uuid, org_uuid);
      cy.removeUserFromOrg(org_uuid, user_uuid)
      return cy.fullLogin(email, password)
      });
  });

  it("created new org", function () {
    const name = chance.string();
    cy.findByRole("menu").should("not.exist")
    cy.findByText("Create new organization").click()
      .then(() => {
        cy.findByLabelText("Name").type(name);
        cy.findByText("Add organization").click()
          .then(() =>{
          cy.get("body").contains("Add your first printer")
        })
      })
  });


});
