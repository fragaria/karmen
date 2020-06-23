import { Chance } from "chance";
const chance = new Chance();

describe("Organizations: Adding", function () {
  let email, password, user_uuid, org_uuid;
  beforeEach(() => {
    email = chance.email();
    password = chance.string();
    cy.prepareTestUser(email, password).then( (response) => {
      user_uuid = response.body.user_uuid;
      org_uuid = response.body.organizations[0].uuid;
      console.log(user_uuid, org_uuid);
      cy.removeUserFromOrg(org_uuid, user_uuid)
      return cy.login(email, password)
      }
    );
  });

  it("has create org button", function () {
    cy.get("body").contains("Create new organization");
  });

  it("created new org", function () {
        const name = chance.string();

    cy.findByText("Create new organization").click()
      .then(() => {
        cy.findByLabelText("Name").type(name);
        cy.findByText("Add organization").click()
          .then(() =>{
          cy.get("body").contains("Add your first printer")
        })
      })
  });

  it("menu has limited items", function () {
    cy.findByRole("menu").should("not.exist")
  })

});
