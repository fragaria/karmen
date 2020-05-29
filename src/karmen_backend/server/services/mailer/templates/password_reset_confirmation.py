from textwrap import dedent

from .mail_template import BrandedMailTemplate


class PasswordResetConfirmation(BrandedMailTemplate):
    def subject(self):
        return "Karmen password changed"

    def textbody(self):
        return dedent(
            f"""
            Hello {self.variables["email"]}!

            We would like to let you know that your Karmen password has just been changed. Sounds suspicious? Please contact us at info@karmen.tech.
            """
        )

    def htmlbody(self):
        return dedent(
            f"""
            <h1>Hello {self.variables["email"]}!</h1>
            <p>We would like to let you know that your Karmen password <strong>has just been changed</strong>.</p>
            <p>Sounds suspicious? Please contact us at <a href="mailto:info@karmen.tech">info@karmen.tech</a>.
            """
        )

    def excerpt(self):
        return "Your password has just been changed"
