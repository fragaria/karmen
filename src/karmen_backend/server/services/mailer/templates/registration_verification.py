import base64
import json
from textwrap import dedent

from server import app
from .mail_template import BrandedMailTemplate


class RegistrationVerification(BrandedMailTemplate):
    def subject(self):
        return "Verify your Karmen account email"

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
        return dedent(
            f"""
            Welcome to Karmen!

            Please verify your email address by opening the link below in order to get started:

            {self.variables["activation_link"]}
            """
        )

    def htmlbody(self):
        return dedent(
            f"""
            <h1>Welcome to Karmen!</h1>
            <p>Please verify your email address in order to get started:</p>
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="btn btn-primary">
                <tbody>
                <tr>
                    <td align="center">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                        <tbody>
                        <tr>
                            <td><a href="{self.variables["activation_link"]}" target="_blank">Verify my email</a> </td>
                        </tr>
                        </tbody>
                    </table>
                    </td>
                </tr>
                </tbody>
            </table>
            """
        )
