from textwrap import dedent

from server import app

from .mail_template import BrandedMailTemplate


class OrganizationInvitation(BrandedMailTemplate):
    def subject(self):
        return "You've been invited to Karmen"

    def prepare_variables(self, variables={}):
        self.variables = variables
        # TODO Actually deeplink into organization - does it survive frontend login though?
        self.variables["organization_link"] = "%s" % (self.get_base_url())

    def textbody(self):
        return dedent(
            f"""
            Hi there!

            {self.variables["inviter_username"]} has invited you to join the {self.variables["organization_name"]} on Karmen—a cloud 3D printer management service.

            See it here: {self.variables["organization_link"]}.
            """
        )

    def htmlbody(self):
        return dedent(
            f"""
            <h1>Hi there!</h1>
            <p><strong>{self.variables["inviter_username"]}</strong> has invited you to join the <strong>{self.variables["organization_name"]}</strong> on Karmen—a cloud 3D printer management service.</p>
            <p>See it here:</p>
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="btn btn-primary">
                <tbody>
                <tr>
                    <td align="center">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                        <tbody>
                        <tr>
                            <td><a href="{self.variables["organization_link"]}" target="_blank">Open Karmen</a> </td>
                        </tr>
                        </tbody>
                    </table>
                    </td>
                </tr>
                </tbody>
            </table>
            """
        )

    def excerpt(self):
        return f"You've been invited to join {self.variables['organization_name']}"
