from .mail_template import MailTemplate
from textwrap import dedent


class OrganizationRemoval(MailTemplate):
    def subject(self):
        return "Karmen - Organization removal"

    def textbody(self):
        return (
            dedent(
                """
            You have been removed from the %s and You will have no access to this organization anymore.

            If you have any problems or questions, please feel free to reply directly to this email.

            © 2020 Fragaria s.r.o.
            Address …….
            Follow us on Twitter, LinkedIn or Facebook
            """
            )
            % (self.variables["organization_name"])
        )
