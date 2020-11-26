import dayjs from "dayjs";
import "cypress-file-upload";
import "@testing-library/cypress/add-commands";
import {Chance} from "chance";

const chance = new Chance();

let apiBase = Cypress.env("apiBase");

const getActivationToken = (email) => {
  cy.log(`requesting last mail contents for ${email}`)
    .request(`http://localhost:8000/api-auth/login/`, {username: "admin", password: "admin"}).then(() => {
    cy.request(`http://localhost:8000/api/2/debug/mails/`)
      .then(({body}) => {
        console.log(body)
        cy.log(body)
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
  });
};

Cypress.Commands.add("getAccessToken", (email, password) => {
  return cy.request("POST", apiBase+'tokens/', {username:email, password}).then((body) => {
    return body.body.access;
  })
});

Cypress.Commands.add("createUser", (email, password) => {
  return cy
    .log(`creating user ${email} with password ${password}`)
    .getAccessToken("admin", "admin")
    .then((token) => {
      return cy.request({
        method: "POST", url: apiBase + `users/?key=` + token,
        body: {
          username: email,
          password,
        }, headers: {
          authorization: 'Bearer ' + token
        }
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
  // .request("DELETE", apiBase + `tokens/mine/`)
  // .then(() => {
  //   localStorage.removeItem("karmen_profile");
  // });
});

Cypress.Commands.add(
  "addPrinter",
  (isCloudMode, organizationUuid, name, ipOrToken, port = null) => {
    return cy
      .log(`adding printer`)
      .getCookie("access_token_cookie")
      .then((token) => {
        return cy
          .request({
            method: "POST",
            url: apiBase + `groups/${organizationUuid}/printers/`,
            body: {
              name,
              ...(isCloudMode ? {token: ipOrToken} : {ip: ipOrToken, port}),
              protocol: "http",
            },
            headers: {
              // "X-CSRF-TOKEN": token.value,
            },
          })
          .then(({body}) => {
            return body;
          });
      });
  }
);

Cypress.Commands.add("getPrinter", (organizationUuid, printerUuid) => {
  return cy
    .log(`getting printer status`)
    .getCookie("access_token_cookie")
    .then((token) => {
      return cy
        .request({
          method: "GET",
          url: apiBase + `groups/${organizationUuid}/printers/${printerUuid}/?fields=job,status,webcam,lights`,
          headers: {
            // "X-CSRF-TOKEN": token.value, // asi neni potreba
          },
        })
        .then(({body}) => {
          return body;
        });
    });
});

Cypress.Commands.add("cancelPrint", (organizationUuid, printerUuid) => {
  return cy
    .log(`cancel printing`)
    .getCookie("access_token_cookie")
    .then((token) => {
      return cy
        .request({
          method: "POST",
          url: apiBase + `groups/${organizationUuid}/printers/${printerUuid}/current-job/`,
          body: {
            action: "cancel",
          },
          headers: {
            // "X-CSRF-TOKEN": token.value,
          },
        })
        .then(({body}) => {
          return body;
        });
    });
});

Cypress.Commands.add(
  "simulatePrintGCode",
  (organizationUuid, printerUuid, gcodeUuid) => {
    return cy
      .log(`start print`)
      .getCookie("access_token_cookie")
      .then((token) => {
        return cy
          .request({
            method: "POST",
            url: apiBase + `groups/${organizationUuid}/printjobs/`,
            body: {
              gcode: gcodeUuid,
              printer: printerUuid,
            },
            headers: {
              // "X-CSRF-TOKEN": token.value,
            },
          })
          .then(({body}) => {
            return body;
          });
      });
  }
);

Cypress.Commands.add("printGCode", (printerName) => {
  cy.findByText("No available printers found.").should("not.exist").wait(1000);

  cy.get("#selectedPrinter").select(printerName);
  cy.findByText("Print").click();
  cy.findByText("Print was scheduled").should("exist");
  cy.findByText("Close").click();
});

Cypress.Commands.add("preparePrintingEnvironment", () => {
  let email, password, printerName, organizationUuid, printerUuid;

  // email = chance.email();
  // password = chance.string();
  email = "user";
  password = "user";
  printerName = chance.string();
  return cy
    .logout()
    // .prepareTestUser(email, password)
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
      .getCookie("access_token_cookie")
      .then((token) => {
        return cy.getPrinter(organizationUuid, printerUuid).then((printer) => {
          switch (printer.status.state) {
            case "Printing":
              return cy.cancelPrint(organizationUuid, printerUuid);
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
      // resolve(xhr.response);
    };
    xhr.onerror = function () {
      // reject(xhr);
    };
    xhr.open(method, url);
    xhr.setRequestHeader("x-authorization", "Bearer:");
    xhr.send(formData);
  });
});

Cypress.Commands.add("addGCode", (filename, organizationUuid, path) => {
  return cy.fixture(filename, "binary").then((gcodeBin) => {
    return Cypress.Blob.binaryStringToBlob(gcodeBin, "application/g-code").then(
      (blob) => {
        const data = new FormData();
        data.append("file", blob, filename);
        // data.append("path", path);
        return cy
          .log(`adding gcode`)
          .getCookie("access_token_cookie")
          .then((token) => {
            return cy.form_request(
              "POST",
              apiBase + `groups/${organizationUuid}/gcodes/`,
              data,
              token
            );
          })
          // .then((response) => JSON.parse(response));
      }
    );
  });
});

Cypress.Commands.add("determineCloudInstall", () => {
  return cy.window().then((win) => {
    return win.env.IS_CLOUD_INSTALL;
  });
});



Cypress.Commands.add("removeUserFromOrg", (org_uuid, uuid) => {
  return cy.log(`removing user from org`).request({
    method: "DELETE",
    url: apiBase + `tests-admin/groups/` + org_uuid + `/users/`,
    body: {
      uuid,
    },
    headers: {
      "X-local-tests-token": Cypress.env("apiAdminToken"),
    },
  });
});

Cypress.Commands.add("prepareAppWithUser", (email, password) => {
  email = email ? email : chance.email();
  password = password ? password: chance.string();
  return cy
    .logout()
    .createUser(email, password)
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
  cy.findAllByText(item).first().click();
});
