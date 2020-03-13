import json
import smtplib, ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from server import app


class Smtp:
    def send(self, sender, recipients, subject, textbody, htmlbody, **kwargs):
        try:
            config = json.loads(app.config.get("MAILER_CONFIG", "{}"))
            host = config.get("host")
            port = config.get("port")
            login = config.get("login")
            password = config.get("password")
            use_ssl = config.get("ssl", 1)
            if not host or not port:
                raise RuntimeError(
                    "Cannot send mail with smtp: Missing host or port in MAILER_CONFIG"
                )
            app.logger.info("Sending %s via smtp" % subject)

            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = sender
            message["To"] = ", ".join(recipients)
            part_plain = MIMEText(textbody, "plain")
            part_html = MIMEText(htmlbody, "html")
            message.attach(part_plain)
            message.attach(part_html)

            # It is not exactly efficient to dis/connect for every mail
            if use_ssl:
                context = ssl.create_default_context()
                server = smtplib.SMTP_SSL(host, port, context=context)
            else:
                server = smtplib.SMTP(host, port)
            if login and password:
                server.login(login, password)
            # TODO handle errors properly
            r = server.sendmail(sender, recipients, message.as_string())
            app.logger.info(r)
            server.quit()

        except (json.JSONDecodeError, TypeError) as e:
            raise RuntimeError("Cannot configure mailer:", e)
