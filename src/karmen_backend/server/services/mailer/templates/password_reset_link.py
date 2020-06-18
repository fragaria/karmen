import base64
import json
from textwrap import dedent

from server import app
from .mail_template import BrandedMailTemplate


class PasswordResetLink(BrandedMailTemplate):
    def subject(self):
        return "Have you requested Karmen password reset?"

    def prepare_variables(self, variables={}):
        self.variables = variables
        self.variables["pwd_reset_link"] = "%s/reset-password?reset=%s" % (
            self.get_base_url(),
            base64.b64encode(
                json.dumps(
                    {
                        "pwd_reset_key": variables["pwd_reset_key"],
                        "pwd_reset_key_expires": variables["pwd_reset_key_expires"],
                        "email": variables["email"],
                    }
                ).encode("utf-8")
            ).decode("utf-8"),
        )

    def textbody(self):
        return dedent(
            f"""
            Hi!

            Someone has requested a link to reset your Karmen password. This is the link you're after':

            {self.variables["pwd_reset_link"]}

            If you didn't request this, you can safely ignore this email. Your password will not be changed.
            """
        )

    def htmlbody(self):
        return dedent(
            f"""
            <h1>Hi!</h1>
            <p>Someone has requested a <strong>password reset</strong> for your account. You can set your new password by clicking below:</p>
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="btn btn-primary">
                <tbody>
                <tr>
                    <td align="center">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                        <tbody>
                        <tr>
                            <td><a href="{self.variables["pwd_reset_link"]}" target="_blank">Set new password</a> </td>
                        </tr>
                        </tbody>
                    </table>
                    </td>
                </tr>
                </tbody>
            </table>

            <p>If you didn't request this, you can <strong>safely ignore this email</strong>. Your password will not be changed.</p>
            """
        )

    def excerpt(self):
        return f"Your password reset link"
