import json
import requests

from server import app


class Dummy:
    def send(self, sender, recipients, subject, textbody, htmlbody, **kwargs):
        try:
            config = json.loads(
                app.config.get(
                    "MAILER_CONFIG", '{"url": "http://dummymailserver:8088/mail"}'
                )
            )
            url = config.get("url")
            if not url:
                raise RuntimeError(
                    "Cannot send mail with dummy: Missing url in MAILER_CONFIG"
                )
            app.logger.info("Sending %s via dummy" % subject)
            req = requests.post(
                url,
                json={
                    "from": sender,
                    "to": recipients,
                    "subject": subject,
                    "text": textbody,
                    "html": htmlbody,
                },
            )
            if req.status_code != 200:
                raise RuntimeError("Cannot send mail with dummy", req.status_code)
        except (json.JSONDecodeError, TypeError) as e:
            raise RuntimeError("Cannot configure mailer:", e)
