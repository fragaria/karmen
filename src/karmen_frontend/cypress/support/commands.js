import dayjs from "dayjs";
import "cypress-file-upload";
import "@testing-library/cypress/add-commands";
import { Chance } from "chance";
const chance = new Chance();

/**
 * User profile as returned from karmen
 * @typedef {Object} UserProfile
 * @property {string} username - User an used to log in
 * @property {string} email - A user associated e-mail
 * @property {("user"|"admin")} - User systemRole
 * @property {Object} organizations  - Organizations by uuid
 */

/**
 * Quickly logs-in user bypassing login form.
 *
 * Users `KARMEN_getUserDataFromApiResponse` which is exported to main `window`
 * object from frontend when cypress is detected.
 * 
 * @param {string} email
 * @param {string} password
 * @return  {UserProfile}  user profile as returned form auth request
 */
Cypress.Commands.add("login", function loginCommand(email, password) {
  //Cypress. Not supporting fetch since 2016 https://github.com/cypress-io/cypress/issues/95.
  Cypress.on("window:before:load", (win) => {
    delete win.fetch;
  });
  cy.visit("/");
  return cy.request("POST", "/api/users/me/authenticate", {
    username: email,
    password: password,
  }).then((response) => {
    cy.window().invoke('KARMEN_getUserDataFromApiResponse', response.body).as("profile").then((profile) => {
      localStorage.setItem("karmen_profile", JSON.stringify(profile));
      // wait for initial page to become visible
      cy.visit("/")
        .get('[data-cy=authenticated-org-root]', {timeout: 20000})
      return cy.wrap(Object.assign({}, profile, {username: email, password: password}));
    });
  });
});

/**
 * Open login form and logs-in the user. It is slower than `login` but is fully compatible.
 *
 * @param {string} email
 * @param {string} password
 * @return  {UserProfile}  user profile as returned form auth request
 */
Cypress.Commands.add("fullLogin", function fullLoginCommand(email, password) {
  Cypress.on("window:before:load", (win) => {
    delete win.fetch;
  });
  cy.visit("/");
  cy.get("input#username").type(email);
  cy.get("input#password").type(password);
  cy.get('button[type="submit"]').click()
  // wait for an authenticated page
  cy.get('[data-cy=authenticated-org-root]', {timeout: 10000})
    .then(() => { // wait for the app to fill local storage
      expect(localStorage.getItem("karmen_profile")).not.to.be.null;
      // const profile = JSON.parse(window.localStorage.getItem("karmen_profile"));
      return cy
        .wrap({profile: JSON.parse(window.localStorage.getItem("karmen_profile"))})
        .its("profile");
  });
});

/**
 * Reauthenticates current user. This is used to verify the user before a
 * dangerous operation.
 */
Cypress.Commands.add("reLogin", function relogin(user) {
  cy.get("input#username", {timeout: 18000}).type(user.email);
  cy.get("input#password").type(user.password);
  return cy.get('button[type="submit"]').click();
});

Cypress.Commands.add("logout", () => {
  return cy
    .log(`logging out`)
    .request("POST", `/api/users/me/logout`)
    .then(() => {
      localStorage.removeItem("karmen_profile");
      cy.visit('/');
    });
});

Cypress.Commands.add("addPrinter",
  (isCloudMode, organizationUuid, name, ipOrToken, port = null) => {
    return cy
      .log(`adding printer`)
      .getCookie("csrf_access_token")
      .then((token) => {
        return cy
          .request({
            method: "POST",
            url: `/api/organizations/${organizationUuid}/printers`,
            body: {
              name,
              ...(isCloudMode ? { token: ipOrToken } : { ip: ipOrToken, port }),
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
  }
);

Cypress.Commands.add("getPrinter", (organizationUuid, printerUuid) => {
  return cy
    .log(`getting printer status`)
    .getCookie("csrf_access_token")
    .then((token) => {
      return cy
        .request({
          method: "GET",
          url: `/api/organizations/${organizationUuid}/printers/${printerUuid}?fields=job,status,webcam,lights`,
          headers: {
            "X-CSRF-TOKEN": token.value, // asi neni potreba
          },
        })
        .then(({ body }) => {
          return body;
        });
    });
});

function cancelPrint(organizationUuid, printerUuid) {
  return cy
    .log(`cancel printing`)
    .getCookie("csrf_access_token")
    .then((token) => {
      return cy
        .request({
          method: "POST",
          url: `/api/organizations/${organizationUuid}/printers/${printerUuid}/current-job`,
          body: {
            action: "cancel",
          },
          headers: {
            "X-CSRF-TOKEN": token.value,
          },
        })
        .then(({ body }) => {
          return body;
        });
    });
};

Cypress.Commands.add("printGCode", (printerName) => {
  cy.findByText("No available printers found.").should("not.exist").wait(1000);

  cy.get("#selectedPrinter").select(printerName);
  cy.findByText("Print").click();
  cy.findByText("Print was scheduled").should("exist");
  cy.findByText("Close").click();
});

Cypress.Commands.add("preparePrintingEnvironment", () => {
  let email, password, printerName, organizationUuid, printerUuid;

  email = chance.email();
  password = chance.string();
  printerName = chance.string();
  return cy
    .logout()
    .prepareTestUser(email, password)
    .login(email, password)
    .then((data) => {
      organizationUuid = Object.keys(data.organizations)[0];
    })
    .then(() => {
      return cy.determineCloudInstall().then((IS_CLOUD_INSTALL) => {
        if (IS_CLOUD_INSTALL) {
          return cy.addPrinter(
            IS_CLOUD_INSTALL,
            organizationUuid,
            printerName,
            chance.string()
          );
        } else {
          return cy.addPrinter(
            IS_CLOUD_INSTALL,
            organizationUuid,
            printerName,
            "172.16.236.13",
            8080
          );
        }
      });
    })
    .then((printer) => {
      printerUuid = printer.uuid;
      cy.setPrinterToOperationalState(organizationUuid, printerUuid);
    })
    .then(() => {
      return cy.addGCode("S_Release.gcode", organizationUuid, "");
    })
    .then((gCode) => {
      return {
        gCodeUuid: gCode.uuid,
        organizationUuid,
        email,
        password,
        printerName,
        printerUuid,
      };
    });
});

Cypress.Commands.add(
  "setPrinterToOperationalState",
  (organizationUuid, printerUuid) => {
    return cy
      .log(`getting printer status`)
      .getCookie("csrf_access_token")
      .then((token) => {
        return cy.getPrinter(organizationUuid, printerUuid).then((printer) => {
          switch (printer.status.state) {
            case "Printing":
              return cancelPrint(organizationUuid, printerUuid);
          }
        });
      });
  }
);

// Performs an XMLHttpRequest instead of a cy.request (able to send data as FormData - multipart/form-data)
Cypress.Commands.add("form_request", (method, url, formData, token) => {
  const xhr = new XMLHttpRequest();
  return new Promise((resolve, reject) => {
    xhr.onload = function () {
      resolve(xhr.response);
    };
    xhr.onerror = function () {
      reject(xhr);
    };
    xhr.open(method, url);
    xhr.setRequestHeader("X-CSRF-TOKEN", token);
    xhr.send(formData);
  });
});

Cypress.Commands.add("addGCode", (filename, organizationUuid, path) => {
  return cy.fixture(filename, "binary").then((gcodeBin) => {
    return Cypress.Blob.binaryStringToBlob(gcodeBin, "application/g-code").then(
      (blob) => {
        const data = new FormData();
        data.append("file", blob, filename);
        data.append("path", path);
        return cy
          .log(`adding gcode`)
          .getCookie("csrf_access_token")
          .then((token) => {
            return cy.form_request(
              "POST",
              `/api/organizations/${organizationUuid}/gcodes`,
              data,
              token.value
            );
          })
          .then((response) => JSON.parse(response));
      }
    );
  });
});

Cypress.Commands.add("determineCloudInstall", () => {
  return cy.window().then((win) => {
    return win.env.IS_CLOUD_INSTALL;
  });
});

Cypress.Commands.add("prepareTestUser", (email, password) => {
  return cy.log(`preparing test user`).request({
    method: "POST",
    url: `/api/tests-admin/users/create`,
    body: {
      email,
      password,
    },
    headers: {
      "X-local-tests-token": Cypress.env("apiAdminToken"),
    },
  });
});


Cypress.Commands.add("removeUserFromOrg", (org_uuid, uuid) => {
  return cy.log(`removing user from org`).request({
    method: "DELETE",
    url: `/api/tests-admin/organizations/`+org_uuid+`/users`,
    body: {
      uuid
    },
    headers: {
      "X-local-tests-token": Cypress.env("apiAdminToken"),
    },
  });
});


Cypress.Commands.add("prepareAppWithUser", () => {
  const email = chance.email();
  const password = chance.string();

  return cy
    .logout()
    .prepareTestUser(email, password)
    .login(email, password)
    .then((userData) => {
      return Object.assign(userData, {
        organizationUuid: Object.keys(userData.organizations)[0],
        password,
      });
    });
});

Cypress.Commands.add("toggleMenu", (item) => {
  cy.findByRole("menu").click();
  cy.contains('.navigation-items .navigation-item', item).click();
});
