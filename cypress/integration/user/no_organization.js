import { Chance } from "chance";
const chance = new Chance();

describe("Organizations: Adding", function () {
  let email, password, user_id, org_id;
  beforeEach(() => {
    email = chance.email();
    password = chance.string();
    cy.makeUser(email, password).then( ({email, password, body}) => {
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
