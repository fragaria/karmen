# Description of Karmen API endpoints

This describes all API endpoints in Karmen. Unless said otherwise, all endpoints require fresh auth token 
(more in `users_me.md`, and return responses as JSON. HTTP 401 will be returned if you are unauthorized to do so. 
Failed requests (not HTTP 200) will return JSON containing `message` field with error message. 
It could look like this:

```json
{
  "message": "Missing cookie \"access_token_cookie\""
}
```

Most endpoints URL starts with `/organization/<organization-uuid>`. Organization UUID of organization user is a member of
must be supplied. More on organizations can be found in `organizations.md`.