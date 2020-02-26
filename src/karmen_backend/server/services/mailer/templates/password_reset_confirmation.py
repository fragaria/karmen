from .mail_template import MailTemplate
from textwrap import dedent


class PasswordResetConfirmation(MailTemplate):
    def subject(self):
        return "Karmen - Password reset confirmation"

    def textbody(self):
        return (
            dedent(
                """
            Hello %s!

            We're contacting you to notify you that your Karmen password has been changed.

            © 2020 Fragaria s.r.o.
            Address …….
            Follow us on Twitter, LinkedIn or Facebook
            """
            )
            % (self.variables["email"])
        )
