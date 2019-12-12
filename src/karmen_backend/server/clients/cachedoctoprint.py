import pickle
import json
import redis
from urllib import parse as urlparse
import requests

from server import app, executor
from server.clients.utils import PrinterClientAccessLevel, PrinterClientException
from server.clients.octoprint import Octoprint

redisinstance = redis.Redis(
    host=app.config["REDIS_HOST"], port=app.config["REDIS_PORT"]
)


class CachedOctoprint(Octoprint):
    """
    This wraps the Octoprint client with Redis cache. Some methods (such as `_is_alive`)
    should not be cached at all as they should operate on live data at all times.
    That is why almost every method is overloaded here so we are sure that the cache got
    cleared before the calls. This is, of course, suspect to race conditions but that 
    should happen very rarely.
    """

    def get_cache_key(self, path):
        return "cache_octoprint_api_%s_%s" % (self.host, path)

    def _perform_http_get(self, uri):
        try:
            req = self.http_session.get(uri)
            if req is None:
                self.client_info.connected = False
            elif bool(self.client_info.api_key):
                if req.status_code == 403:
                    self.client_info.access_level = PrinterClientAccessLevel.PROTECTED
                if req.status_code == 200:
                    self.client_info.access_level = PrinterClientAccessLevel.UNLOCKED
            return req
        except (
            requests.exceptions.ConnectionError,
            requests.exceptions.ReadTimeout,
        ) as e:
            app.logger.debug("Cannot call %s because %s" % (uri, e))
            self.client_info.connected = False
            return None

    def _http_get(self, path, force=False):
        """
        Use the force if you want to skip caching and local state checking altogether
        """
        if not self.client_info.connected and not force:
            return None
        uri = urlparse.urljoin("%s://%s" % (self.protocol, self.host), path)
        result = redisinstance.get(self.get_cache_key(uri))
        if result and not force:
            return pickle.loads(result)
        response = self._perform_http_get(uri)
        if not force:
            redisinstance.set(self.get_cache_key(uri), pickle.dumps(response), ex=13)
        return response
