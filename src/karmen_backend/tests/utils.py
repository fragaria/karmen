class Response:
    def __init__(self, status_code, contents={}):
        self.status_code = status_code
        self.contents = contents

    def json(self):
        return self.contents
