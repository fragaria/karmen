import base64
import json
from textwrap import dedent

from server import app
from .mail_template import MailTemplate


class RegistrationVerification(MailTemplate):
    def subject(self):
        return "Karmen - Registration verification"

    def prepare_variables(self, variables={}):
        # TODO handle organization_name and organization_uuid in activation_link and mail contents
        self.variables = variables
        self.variables["activation_link"] = "%s/confirmation?activate=%s" % (
            self.get_base_url(),
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

            Please verify your email address by opening the link below in order to get started:

            %s

            ---

            © 2020 Fragaria s.r.o.
            """
            )
            % (self.variables["activation_link"])
        )

    def htmlbody(self):
        return (
            dedent(
                """
                <h1>Welcome to Karmen!</h1>

                <p>Please verify your email address by <a href="%s" target="_blank">clicking here</a> in order to get started.</p>

                © 2020 Fragaria s.r.o.
                """
            )
            % self.variables["activation_link"]
        )
