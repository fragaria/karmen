from server import app, celery
from server.services.mailer import get_mailer
from server.services.mailer.templates import get_template


@celery.task(name="send_mail")
def send_mail(recipients, template_key, variables={}):
    mailer = get_mailer()  # TODO config
    template = get_template(template_key)
    if template and mailer:
        template.prepare_variables(variables)
        mailer.send(
            "noreply@karen.local",
            recipients,
            template.subject(),
            template.textbody(),
            template.htmlbody(),
        )
    app.logger.error("Cannot send email %s" % template_key)
