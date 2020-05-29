from textwrap import dedent

from .mail_template import BrandedMailTemplate


class OrganizationRemoval(BrandedMailTemplate):
    def subject(self):
        return "You've been removed from a Karmen organization"

    def textbody(self):
        return dedent(
            f"""
            Hi!

            We're just letting you know that your membership in {self.variables["organization_name"]} has been revoked. This means you won't be able to access this organization anymore.
            """
        )

    def htmlbody(self):
        return dedent(
            f"""
            <h1>Hi!</h1>
            <p>We're just letting you know that your membership in <strong>{self.variables["organization_name"]} has been revoked</strong>. This means you won't be able to access this organization anymore.</p>
            """
        )

    def excerpt(self):
        return (
            f"Your membership in {self.variables['organization_name']} has been revoked"
        )
