from server import app, celery
from server.services.mailer import get_mailer
from server.services.mailer.templates import get_template


@celery.task(name="send_mail")
def send_mail(recipients, template_key, variables={}):
    try:
        mailer = get_mailer(app.config.get("MAILER", "DUMMY"))
        template = get_template(template_key)
        template.prepare_variables(variables)
        mailer.send(
            app.config.get("MAILER_FROM", "Karmen <noreply@karmen.tech>"),
            recipients,
            template.subject(),
            template.textbody(),
            template.htmlbody(),
        )
    except RuntimeError as e:
        app.logger.error("Cannot send email: %s" % e)
