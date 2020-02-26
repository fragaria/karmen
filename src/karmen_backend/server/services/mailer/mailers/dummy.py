from server import app


class Dummy:
    def send(self, sender, recipients, subject, textbody, htmlbody, **kwargs):
        app.logger.info("===SENDING EMAIL START===")
        app.logger.info(
            "  From: %s, To: %s, Subject: %s" % (sender, recipients, subject)
        )
        app.logger.info("---Text version follows---")
        app.logger.info(textbody)
        app.logger.info("---HTML version follows---")
        app.logger.info(htmlbody)
        app.logger.info("===SENDING EMAIL END===")
