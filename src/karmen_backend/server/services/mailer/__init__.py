from server.services.mailer.dummy_mailer import DummyMailer


def get_mailer():
    return DummyMailer()
