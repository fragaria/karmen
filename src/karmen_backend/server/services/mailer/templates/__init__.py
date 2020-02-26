from server.services.mailer.templates.registration_verification import (
    RegistrationVerification,
)
from server.services.mailer.templates.organization_invitation import (
    OrganizationInvitation,
)
from server.services.mailer.templates.organization_removal import OrganizationRemoval


def get_template(key):
    mapping = {
        "REGISTRATION_VERIFICATION_EMAIL": RegistrationVerification,
        "ORGANIZATION_INVITATION": OrganizationInvitation,
        "ORGANIZATION_REMOVAL": OrganizationRemoval,
    }
    if key in mapping:
        return mapping[key]()

    raise RuntimeError("Unknown template %s" % key)
