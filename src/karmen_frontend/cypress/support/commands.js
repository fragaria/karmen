import dayjs from "dayjs";

const getActivationToken = (email) => {
  cy.log(`requesting last mail contents for ${email}`)
    .request(`http://localhost:8088/mail/${email}`)
    .then(({ body }) => {
      if (!body || !body.to) {
        return cy.wait(2000).then(() => {
          return getActivationToken(email);
        });
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
      localStorage.setItem(
        "karmen_profile",
        JSON.stringify({
          currentState: body.force_pwd_change
            ? "pwd-change-required"
            : "logged-in",
          identity: body.identity,
          username: body.username,
          email: body.email,
          systemRole: body.system_role,
          hasFreshToken: body.fresh,
          accessTokenExpiresOn: body.expires_on
            ? dayjs(body.expires_on)
            : undefined,
          organizations: body.organizations,
        })
      );
      return body;
    });
});

Cypress.Commands.add("logout", () => {
  return cy
    .log(`logging out`)
    .request("POST", `/api/users/me/logout`)
    .then(() => {
      localStorage.removeItem("karmen_profile");
    });
});

Cypress.Commands.add("addPrinter", (organizationUuid, name, ip, port) => {
  return cy
    .log(`adding printer`)
    .getCookie("csrf_access_token")
    .then((token) => {
      return cy
        .request({
          method: "POST",
          url: `/api/organizations/${organizationUuid}/printers`,
          body: {
            ip,
            port,
            name,
            protocol: "http",
          },
          headers: {
            "X-CSRF-TOKEN": token.value,
          },
        })
        .then(({ body }) => {
          return body;
        });
    });
});
