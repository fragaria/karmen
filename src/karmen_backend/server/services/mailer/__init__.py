from server.services.mailer.templates.registration_verification import (
    RegistrationVerification,
)
from server.services.mailer.templates.organization_invitation import (
    OrganizationInvitation,
)
from server.services.mailer.templates.organization_removal import OrganizationRemoval
from server.services.mailer.templates.password_reset_link import PasswordResetLink
from server.services.mailer.templates.password_reset_confirmation import (
    PasswordResetConfirmation,
)

from server.services.mailer.mailers.dummy import Dummy
from server.services.mailer.mailers.mailgun import Mailgun
from server.services.mailer.mailers.ses import Ses
from server.services.mailer.mailers.smtp import Smtp
from server.services.mailer.mailers.console import ConsoleMailer


def get_mailer(key):
    mapping = {
        "DUMMY": Dummy,
        "MAILGUN": Mailgun,
        "SES": Ses,
        "SMTP": Smtp,
        "CONSOLE": ConsoleMailer,
    }
    if key.upper() in mapping:
        return mapping[key.upper()]()

    raise RuntimeError("Unknown mailer %s" % key)


def get_template(key):
    mapping = {
        "REGISTRATION_VERIFICATION_EMAIL": RegistrationVerification,
        "ORGANIZATION_INVITATION": OrganizationInvitation,
        "ORGANIZATION_REMOVAL": OrganizationRemoval,
        "PASSWORD_RESET_LINK": PasswordResetLink,
        "PASSWORD_RESET_CONFIRMATION": PasswordResetConfirmation,
    }
    if key.upper() in mapping:
        return mapping[key.upper()]()

    raise RuntimeError("Unknown template %s" % key)
