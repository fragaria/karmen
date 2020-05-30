import dayjs from "dayjs";
import "cypress-file-upload";
import "@testing-library/cypress/add-commands";
import { Chance } from "chance";
const chance = new Chance();

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

Cypress.Commands.add(
  "addPrinter",
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

Cypress.Commands.add("cancelPrint", (organizationUuid, printerUuid) => {
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
});

Cypress.Commands.add(
  "simulatePrintGCode",
  (organizationUuid, printerUuid, gcodeUuid) => {
    return cy
      .log(`start print`)
      .getCookie("csrf_access_token")
      .then((token) => {
        return cy
          .request({
            method: "POST",
            url: `/api/organizations/${organizationUuid}/printjobs`,
            body: {
              gcode: gcodeUuid,
              printer: printerUuid,
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
    .createUser(email, password)
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
