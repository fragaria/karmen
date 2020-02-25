import base64
import json

from textwrap import dedent
from server import app


class RegistrationVerificationEmail:
    variables = {}

    def subject(self):
        return "Karmen - Registration verification e-mail"

    def prepare_variables(self, variables={}):
        self.variables = variables
        self.variables["activation_link"] = "%s/confirmation?token=%s" % (
            app.config["FRONTEND_BASE_URL"],
            base64.b64encode(
                json.dumps(
                    {
                        "activation_key": variables["activation_key"],
                        "activation_key_expires": variables["activation_key_expires"],
                        "email": variables["email"],
                    }
                ).encode("utf-8")
            ).decode("utf-8"),
        )

    def textbody(self):
        return (
            dedent(
                """
            Welcome to Karmen!

            Verify Email on %s

            If you have any problems or questions, please feel free to reply directly to this email.

            © 2020 Fragaria s.r.o.
            Address …….
            Follow us on Twitter, LinkedIn or Facebook
            """
            )
            % (self.variables["activation_link"])
        )

    def htmlbody(self):
        return self.textbody()
