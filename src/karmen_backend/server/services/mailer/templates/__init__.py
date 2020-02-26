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


def get_template(key):
    mapping = {
        "REGISTRATION_VERIFICATION_EMAIL": RegistrationVerification,
        "ORGANIZATION_INVITATION": OrganizationInvitation,
        "ORGANIZATION_REMOVAL": OrganizationRemoval,
        "PASSWORD_RESET_LINK": PasswordResetLink,
        "PASSWORD_RESET_CONFIRMATION": PasswordResetConfirmation,
    }
    if key in mapping:
        return mapping[key]()

    raise RuntimeError("Unknown template %s" % key)
