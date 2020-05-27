import dayjs from "dayjs";
import "cypress-file-upload";
import "@testing-library/cypress/add-commands";

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

Cypress.Commands.add("login", function loginCommand(email, password) {
  //Cypress. Not supporting fetch since 2016 https://github.com/cypress-io/cypress/issues/95.
  Cypress.on("window:before:load", (win) => {
    delete win.fetch;
  });

  cy.visit("/");

  cy.server();
  cy.route("POST", "/api/users/me/authenticate").as("login-post");
  cy.get("input#username").type(email);
  cy.get("input#password").type(password);
  return cy
    .get('button[type="submit"]')
    .click()
    .wait(3000)
    .then(() => {
      let profile = JSON.parse(window.localStorage.getItem("karmen_profile"));
      return cy.wrap(profile);
    });
});
Cypress.Commands.add("reLogin", (cy, email, password) => {
  cy.get("input#username").type(email);
  cy.get("input#password").type(password);
  return cy.get('button[type="submit"]').click();
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

// Performs an XMLHttpRequest instead of a cy.request (able to send data as FormData - multipart/form-data)
Cypress.Commands.add("form_request", (method, url, formData, token, done) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.setRequestHeader("X-CSRF-TOKEN", token);
    xhr.onload = function () {
      resolve(done(xhr));
    };
    xhr.onerror = function () {
      reject(done(xhr));
    };
    xhr.send(formData);
  });
});

Cypress.Commands.add("addGCode", (organizationUuid, path) => {
  const filename = "S_Release.gcode";
  cy.fixture(filename, "binary").then((gcodeBin) => {
    Cypress.Blob.binaryStringToBlob(gcodeBin, "application/g-code").then(
      (blob) => {
        const data = new FormData();
        data.append("file", blob, filename);
        data.append("path", path);
        return cy
          .log(`adding gcode`)
          .getCookie("csrf_access_token")
          .then((token) => {
            return cy
              .form_request(
                "POST",
                `/api/organizations/${organizationUuid}/gcodes`,
                data,
                token.value,
                function (response) {
                  expect(response.status).to.eq(201);
                  //expect(expectedAnswer).to.eq(response.response);
                  return response;
                }
              )
              .then(({ response }) => {
                return response;
              });
          });
      }
    );
  });
});
