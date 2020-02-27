from textwrap import dedent
from .mail_template import MailTemplate


class OrganizationRemoval(MailTemplate):
    def subject(self):
        return "Karmen - Organization removal"

    def textbody(self):
        return (
            dedent(
                """
            You have been removed from the %s and You will have no access to this organization anymore.

            © 2020 Fragaria s.r.o.
            """
            )
            % (self.variables["organization_name"])
        )
