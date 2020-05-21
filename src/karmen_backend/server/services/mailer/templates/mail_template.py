import abc
import os
from textwrap import dedent
from datetime import datetime

from server import app

BRANDED_TEMPLATE_TEXT = dedent(
    """
%%CONTENT%%

---

Karmen by Fragaria
©%%YEAR%% Fragaria s.r.o.
Ječná 507/6, 120 00 Praha 2, Czech Republic
"""
)


BRANDED_TEMPLATE_HTML = ""

with open(
    os.path.join(os.path.dirname(__file__), "assets/base-inlined.html"), "r"
) as file:
    BRANDED_TEMPLATE_HTML = file.read()


class MailTemplate:
    variables = {}

    @abc.abstractmethod
    def subject(self):
        pass

    def prepare_variables(self, variables={}):
        self.variables = variables

    @abc.abstractmethod
    def textbody(self):
        """Get template raw body in textual form."""
        pass

    def htmlbody(self):
        """Get template body in HTML."""
        return "<br />\n".join(self.textbody().split("\n"))

    def render(self, content_type):
        """Render the template using stored variables as context.

        @param content_type: str, either 'text' or 'html'
        @return str
        """
        if content_type == "html":
            return self.htmlbody()

        return self.textbody()

    def get_base_url(self):
        if app.config["FRONTEND_BASE_URL"][-1] == "/":
            return app.config["FRONTEND_BASE_URL"][:-1]
        return app.config["FRONTEND_BASE_URL"]


class BrandedMailTemplate(MailTemplate):
    def render(self, content_type):
        out = ""

        if content_type == "html":
            out = BRANDED_TEMPLATE_HTML.replace("%%CONTENT%%", self.htmlbody())
        else:
            out = BRANDED_TEMPLATE_TEXT.replace("%%CONTENT%%", self.textbody())

        out = out.replace("%%YEAR%%", str(datetime.now().year))

        return out
