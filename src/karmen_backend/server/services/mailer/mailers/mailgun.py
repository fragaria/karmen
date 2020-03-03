import json
import requests

from server import app


class Mailgun:
    def send(self, sender, recipients, subject, textbody, htmlbody, **kwargs):
        try:
            config = json.loads(app.config.get("MAILER_CONFIG", "{}"))
            domain = config.get("mailgun_domain")
            apikey = config.get("mailgun_api_key")
            if not domain or not apikey:
                raise Exception(
                    "Cannot send mail with mailgun: Missing mailgun_domain or mailgun_api_key in MAILER_CONFIG"
                )
            app.logger.info("Sending %s via mailgun" % subject)
            req = requests.post(
                "https://api.mailgun.net/v3/%s/messages" % (domain),
                auth=("api", apikey),
                data={
                    "from": sender,
                    "to": recipients,
                    "subject": subject,
                    "text": textbody,
                    "html": htmlbody,
                },
            )
            if req.status_code != 200:
                raise Exception("Cannot send mail with mailgun", req.status_code)
        except json.JSONDecodeError as e:
            raise RuntimeError("Cannot configure mailer:", e)
