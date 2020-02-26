import requests

from server import app


class Mailgun:
    def send(self, sender, recipients, subject, textbody, htmlbody, **kwargs):
        domain = app.config.get("MAILGUN_DOMAIN")
        apikey = app.config.get("MAILGUN_API_KEY")
        if not domain or not apikey:
            raise Exception(
                "Cannot send mail with mailgun: Missing MAILGUN_URI or MAILGUN_API_KEY in app.config"
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
            raise Exception(
                "Cannot send mail with mailgun", req.status_code, req.raw_data
            )
