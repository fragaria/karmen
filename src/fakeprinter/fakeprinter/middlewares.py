'''
middlewares for fake printer
'''
import time

class ThrottlingMiddleware(object):
    '''
    delays any request 
    '''

    def __init__(self, delay_in_seconds, app):
        self.app = app
        self.delay = delay_in_seconds

    def __call__(self, environ, start_response):
        if self.delay:
            time.sleep(self.delay)
        return self.app(environ, start_response)
