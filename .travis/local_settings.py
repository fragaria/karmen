
# BASE SETTINGS
# #############

DEBUG = True

SECRET_KEY = '''DON'T LET THE ALL THE HACKERS COME IN AND CHANGE YOUR SECRET KEY!'''

SITE_URL = 'http://localhost:9090'
frontend_base_url = SITE_URL

# url for account activation after user email verification
FRONTEND_ACTIVATION_URL = f'{frontend_base_url}confirmation?activate=%s'
# url for reset of user password
FRONTEND_PASSWORD_RESET_URL = f'{frontend_base_url}reset-password?reset=%s'

WEBSOCKET_SERVER_URL = ''

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrf-token',
    'x-requested-with',
    'pragma',
    'cache-control'
]
