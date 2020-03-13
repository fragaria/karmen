import requests
import boto3
import json
from botocore.exceptions import ClientError


from server import app

AWS_CLIENT = None


def get_client():
    global AWS_CLIENT
    try:
        config = json.loads(app.config.get("MAILER_CONFIG", "{}"))
        if (
            not config.get("aws_access_key")
            or not config.get("aws_secret_key")
            or not config.get("aws_region")
        ):
            raise RuntimeError(
                "Cannot send mail with SES: Missing aws_access_key or aws_secret_key or aws_region in MAILER_CONFIG"
            )
        if not AWS_CLIENT:
            AWS_CLIENT = boto3.client(
                "ses",
                aws_access_key_id=config.get("aws_access_key"),
                aws_secret_access_key=config.get("aws_secret_key"),
                region_name=config.get("aws_region"),
            )
        return AWS_CLIENT
    except (json.JSONDecodeError, TypeError) as e:
        raise RuntimeError("Cannot configure mailer:", e)


class Ses:
    def send(self, sender, recipients, subject, textbody, htmlbody, **kwargs):
        client = get_client()
        app.logger.info("Sending %s via ses" % subject)

        try:
            response = client.send_email(
                Destination={"ToAddresses": recipients},
                Message={
                    "Body": {
                        "Html": {"Charset": "UTF-8", "Data": htmlbody,},
                        "Text": {"Charset": "UTF-8", "Data": textbody,},
                    },
                    "Subject": {"Charset": "UTF-8", "Data": subject,},
                },
                Source=sender,
            )
        except ClientError as e:
            raise RuntimeError(
                "Cannot send mail with SES", e.response["Error"]["Message"]
            )
