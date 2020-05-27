from datetime import date
import pytest

from server.services.mailer import get_template


@pytest.mark.parametrize(
    "template_key,template_variables,headline",
    (
        (
            "REGISTRATION_VERIFICATION_EMAIL",
            {
                "activation_key": "key",
                "activation_key_expires": "today",
                "email": "email@example.com",
            },
            "Welcome to Karmen!",
        ),
        (
            "ORGANIZATION_INVITATION",
            {
                "organization_name": "TheOrganization",
                "inviter_username": "Somebody",
                "organization_link": "https://cloud.karmen.tech/theorganization",
            },
            "Hi there!",
        ),
        ("ORGANIZATION_REMOVAL", {"organization_name": "TheOrganization",}, "Hi!"),
        (
            "PASSWORD_RESET_LINK",
            {
                "pwd_reset_key": "key",
                "pwd_reset_key_expires": "today",
                "email": "email@example.com",
            },
            "Hi!",
        ),
        ("PASSWORD_RESET_CONFIRMATION", {"email": "email@example.com"}, "Hello"),
    ),
)
def test_mail_template_compiles(template_key, template_variables, headline):
    template = get_template(template_key)
    template.prepare_variables(template_variables)

    html = template.render("html")
    text = template.render("text")

    # Content is actually rendered
    assert text is not None
    assert html is not None

    # Content gets replaced
    assert "%%CONTENT%%" not in text
    assert "%%CONTENT%%" not in html
    assert "%%YEAR%%" not in text
    assert "%%YEAR%%" not in html

    # A little data to expect for each template
    assert f"©{date.today().year}" in html
    assert f"©{date.today().year}" in text
    assert headline in text
    assert headline in html
