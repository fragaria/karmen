import dayjs from "dayjs";
import "cypress-file-upload";
import "@testing-library/cypress/add-commands";
import {Chance} from "chance";

const chance = new Chance();

let apiBase = Cypress.env("apiBase");



Cypress.Commands.add("getActivationToken", (email, pass_whole_url) => {
  return cy.log(`requesting last mail contents for ${email}`)
    .getAccessToken("admin", "admin")
    .then((token) => {
      cy.request({
        url: apiBase + `debug/mails/`,
        headers: {
          authorization: 'Bearer ' + token
        }
      })
        .then(({body}) => {
          var msg = body.filter(m => {
            return m.to[0] === email
          });
          msg = msg[0]
          const matched = msg.message.match(/http:\/\/.*confirmation\S*/);
          if(pass_whole_url){
            return matched[0]
          }
          var key = matched[0].split("?activate=")[1]
          return key;
          const url = new URL(matched[0]);
          console.log(url)
          cy.log(url)
          return Promise.resolve(url.searchParams.get("activate"));

        });
    });
});
Cypress.Commands.add("getAccessToken", (email, password) => {
  return cy.request("POST", apiBase + 'tokens/', {username: email, password}).then((body) => {
    return body.body.access;
  })
});

Cypress.Commands.add("createUser", (email, password) => {
  return cy
    .log(`registering user ${email} with password ${password}`)
    .request({
      method: "POST",
      url: apiBase + 'invitations/',
      body: {
        email
      }
    }).then(() => {
      return cy.getActivationToken(email).then((token) => {
        cy.log(token)
        return cy.request({
          method: "POST", url: apiBase + `users/`,
          body: {
            password,
            token
          }
        });
      });

    })
    .then((response) => {
      return {
        email,
        password,
        body: response.body,
      };
    });
});


Cypress.Commands.add("makeUser", (email, password) => {
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
    .then((response) => {
      return {
        email,
        password,
        body: response.body,
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

Cypress.Commands.add("addPrinter", (organizationUuid, name, ipOrToken) => {
    let bearer = 'Bearer ' + localStorage.getItem("karmen_access_token");
    return cy
      .log(`adding printer `+organizationUuid)
      .then(() => {
        return cy.request({
          method: "POST",
          url: apiBase + `printers/`,
          body: {
            name,
            token: ipOrToken,
            protocol: "http",
            groups: [organizationUuid],
            api_key: "",
          },
          headers: {
            authorization: bearer
          },
        })
          .then(({body}) => {
            return body;
          });
      });
  }
);

Cypress.Commands.add("getPrinter", (organizationUuid, printerUuid) => {
  let bearer = 'Bearer ' + localStorage.getItem("karmen_access_token");
  return cy
    .log(`getting printer status`)
    .then(() => {
      return cy
        .request({
          method: "GET",
          url: apiBase + `printers/${printerUuid}/?fields=job,status,webcam,lights`,
          headers: {
            authorization: bearer
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
      return cy.addPrinter(
        organizationUuid,
        printerName,
        "http://127.0.0.1:5050"
      );
    })
    .then((printer) => {
      cy.log(printer);
      printerUuid = printer.id;
      cy.setPrinterToOperationalState(organizationUuid, printerUuid);
    })
    .then(() => {
      return cy.addGCode("S_Release.gcode", organizationUuid,);
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
          // switch (printer.status.state) {
          //   case "Printing":
          //     return cy.cancelPrint(organizationUuid, printerUuid);
          // }
        });
      });
  }
);

Cypress.Commands.add("addGCode", (filename, organizationUuid) => {
  return cy.visit("/" + organizationUuid + "/add-gcode")
    .wait(3000)
    .log(`adding gcode`)
    .then(() => {
      cy.get('input[type=file]').attachFile(filename)
        .get('button[type=submit]').click()
        .wait(3000)
    })

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
  password = password ? password : chance.string();
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
