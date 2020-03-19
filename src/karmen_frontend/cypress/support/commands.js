// TODO We should be doing test-run-specific users to not be dependent on a specific env setup here
// but that needs mails and those need special overridden configuration
Cypress.Commands.add("loginAsSuperadmin", () => {
  return cy
    .log("logging in as karmen")
    .request("POST", `/api/users/me/authenticate`, {
      username: "karmen",
      password: "karmen3D"
    })
    .then(({ body }) => {
      localStorage.setItem("karmen_profile", JSON.stringify(body));
      return {};
    });
});
