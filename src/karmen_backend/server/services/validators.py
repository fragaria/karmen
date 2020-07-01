import re
from server import app
from email_validator import validate_email, EmailNotValidError


def is_email(email):
    # return re.match(r"(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$)", email)

    try:
        valid = validate_email(email, check_deliverability=False)
        return True, ""
    except EmailNotValidError as e:
        app.logger.debug(e)
        return False, str(e)
