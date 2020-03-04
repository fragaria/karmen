import abc
from server import app


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

    def get_base_url(self):
        if app.config["FRONTEND_BASE_URL"][-1] == "/":
            return app.config["FRONTEND_BASE_URL"][:-1]
        return app.config["FRONTEND_BASE_URL"]
