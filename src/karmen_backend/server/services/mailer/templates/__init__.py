from server.services.mailer.templates.registration_verification_email import (
    RegistrationVerificationEmail,
)


def get_template(key):
    if key == "REGISTRATION_VERIFICATION_EMAIL":
        return RegistrationVerificationEmail()
    raise RuntimeError("Unknown template %s" % key)
