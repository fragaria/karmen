class Response:
    def __init__(self, status_code, contents={}):
        self.status_code = status_code
        self.contents = contents

    def json(self):
        return self.contents


# Expired at 1573656402, tied to 6480fa7d-ce18-4ae2-818b-f1d200050806 account
expired_admin_token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE1NzM2NTU1MDIsIm5iZiI6MTU3MzY1NTUwMiwianRpIjoiMWIyYThkYTEtYzZmYy00YjJmLWI5NzItYzI3NjNiY2E0NzE2IiwiZXhwIjoxNTczNjU2NDAyLCJpZGVudGl0eSI6IjY0ODBmYTdkLWNlMTgtNGFlMi04MThiLWYxZDIwMDA1MDgwNiIsImZyZXNoIjp0cnVlLCJ0eXBlIjoiYWNjZXNzIiwidXNlcl9jbGFpbXMiOnsicm9sZSI6ImFkbWluIiwiZm9yY2VfcHdkX2NoYW5nZSI6ZmFsc2V9fQ.QzVBK9_0t3jcK_aUq9swMWEyl3u6pZtRZDFv-JiH9pI"
