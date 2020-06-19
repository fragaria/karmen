import json
from server import app


class ConsoleMailer:

    def send(self, sender, recipients, subject, textbody, htmlbody, **kwargs):

        try:
            config = json.loads(app.config.get("MAILER_CONFIG", "{}"))
        except json.JSONDecodeError as exception:
            raise RuntimeError("MAILER_CONFIG is not valid json", exception)
        config['print_html'] = config.get('print_html', False)

        print(f'''
        from: {sender}
        to: {(', ').join(recipients)}
        subject: {subject}

        {textbody}

        {htmlbody if config["print_html"] else '... html ...'}
        ''');


