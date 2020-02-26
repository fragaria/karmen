import abc


class MailTemplate:
    variables = {}

    @abc.abstractmethod
    def subject(self):
        pass

    def prepare_variables(self, variables={}):
        self.variables = variables

    @abc.abstractmethod
    def textbody(self):
        pass

    def htmlbody(self):
        return "<br />\n".join(self.textbody().split("\n"))
