from textwrap import dedent


class OrganizationRemoval:
    variables = {}

    def subject(self):
        return "Karmen - Registration verification e-mail"

    def prepare_variables(self, variables={}):
        self.variables = variables

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

    def htmlbody(self):
        return self.textbody()
