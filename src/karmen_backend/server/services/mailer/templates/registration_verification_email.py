from textwrap import dedent


class RegistrationVerificationEmail:
    variables = {}

    def subject(self):
        return "Karmen - Registration verification e-mail"

    def prepare_variables(self, variables={}):
        self.variables = variables
        self.variables["activation_link"] = (
            "http://somewhere.com/registration-verification?activation_key=%s&expires=%s&email=%s"
            % (
                variables["activation_key"],
                variables["activation_key_expires"],
                variables["email"],
            )
        )

    def textbody(self):
        return (
            dedent(
                """
            Welcome to Karmen!

            Verify Email on %s

            If you have any problems or questions, please feel free to reply directly to this email.

            © 2020 Fragaria s.r.o.
            Address …….
            Follow us on Twitter, LinkedIn or Facebook
            """
            )
            % (self.variables["activation_link"])
        )

    def htmlbody(self):
        return self.textbody()
