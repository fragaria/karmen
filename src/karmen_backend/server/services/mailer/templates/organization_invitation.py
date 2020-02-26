from .mail_template import MailTemplate
from textwrap import dedent
from server import app


class OrganizationInvitation(MailTemplate):
    def subject(self):
        return "Karmen - Organization invitation e-mail"

    def prepare_variables(self, variables={}):
        self.variables = variables
        self.variables["organization_link"] = "%s" % (app.config["FRONTEND_BASE_URL"])

    def textbody(self):
        return (
            dedent(
                """
            You have been invited to join %s

            %s has invited you to join the %s on Karmen.

            Visit the application on %s

            If you have any problems or questions, please feel free to reply directly to this email.

            © 2020 Fragaria s.r.o.
            Address …….
            Follow us on Twitter, LinkedIn or Facebook
            """
            )
            % (
                self.variables["organization_name"],
                self.variables["inviter_username"],
                self.variables["organization_name"],
                self.variables["organization_link"],
            )
        )
