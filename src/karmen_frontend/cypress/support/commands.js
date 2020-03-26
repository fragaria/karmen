const getActivationToken = (email) => {
  cy.log(`requesting last mail contents for ${email}`)
    .request(`http://localhost:8088/mail/${email}`)
    .then(({ body }) => {
      if (!body || !body.to) {
        return getActivationToken(email);
      } else {
        const matched = body.text.match(/http:\/\/.*confirmation.*/i);
        const url = new URL(matched);
        return Promise.resolve(url.searchParams.get("activate"));
      }
    });
};

Cypress.Commands.add("createUser", (email, password) => {
  return cy
    .log(`creating user ${email} with password ${password}`)
    .request("POST", `/api/users/me`, { email })
    .then(() => {
      return getActivationToken(email);
    })
    .then((token) => {
      const tokenData = JSON.parse(atob(token));
      return cy.request("POST", `/api/users/me/activate`, {
        email,
        password,
        activation_key: tokenData.activation_key,
        password_confirmation: password,
      });
    })
    .then(() => {
      return {
        email,
        password,
      };
    });
});

Cypress.Commands.add("login", (email, password) => {
  return cy
    .log(`logging in as ${email} with ${password}`)
    .request("POST", `/api/users/me/authenticate`, {
      username: email,
      password: password,
    })
    .then(({ body }) => {
      localStorage.setItem("karmen_profile", JSON.stringify(body));
      return body;
    });
});
