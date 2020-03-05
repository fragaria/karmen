from server.services.mailer.mailers.dummy import Dummy
from server.services.mailer.mailers.mailgun import Mailgun
from server.services.mailer.mailers.ses import Ses
from server.services.mailer.mailers.smtp import Smtp


def get_mailer(key):
    mapping = {
        "DUMMY": Dummy,
        "MAILGUN": Mailgun,
        "SES": Ses,
        "SMTP": Smtp,
    }
    if key.upper() in mapping:
        return mapping[key.upper()]()

    raise RuntimeError("Unknown mailer %s" % key)
