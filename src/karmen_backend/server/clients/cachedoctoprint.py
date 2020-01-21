import pickle
import json
import redis
from urllib import parse as urlparse
import requests
from concurrent.futures import ThreadPoolExecutor

from server import app
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

    expiration_map = {
        "/api/settings": 121,
        "/api/job": 7,
        "/api/printer?exclude=history": 13,
    }
    running_requests = {}

    def __init__(
        self,
        uuid,
        protocol="http",
        hostname=None,
        ip=None,
        port=None,
        name=None,
        client_props=None,
        printer_props=None,
        **kwargs
    ):
        super(CachedOctoprint, self).__init__(
            uuid,
            protocol,
            hostname,
            ip,
            port,
            name,
            client_props,
            printer_props,
            **kwargs
        )
        # We can't use the flask executor as that cannot work in a low-level place like this
        self.executor = ThreadPoolExecutor(max_workers=4)

    def __del__(self):
        self.executor.shutdown()

    def add_api_key(self, api_key):
        super().add_api_key(api_key)
        self.delete_cache_key("/api/printer?exclude=history")
        self.delete_cache_key("/api/settings")
        self.delete_cache_key("/api/job")

    def get_cache_key(self, path):
        return "cache_octoprint_api_%s_%s" % (self.uuid, path)

    def delete_cache_key(self, path):
        uri = urlparse.urljoin("%s://%s" % (self.protocol, self.network_host), path)
        redisinstance.delete(self.get_cache_key(uri))

    def _perform_http_get(self, uri):
        try:
            req = self.http_session.get(
                uri, timeout=app.config.get("NETWORK_TIMEOUT", 10)
            )
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
        uri = urlparse.urljoin("%s://%s" % (self.protocol, self.network_host), path)
        if force:
            return self._perform_http_get(uri)
        cache_key = self.get_cache_key(uri)
        cached = redisinstance.get(cache_key)
        if cached:
            return pickle.loads(cached)
        if CachedOctoprint.running_requests.get(cache_key):
            app.logger.debug("futures: reusing %s" % cache_key)
            future_wrap = CachedOctoprint.running_requests.get(cache_key)
            future_wrap["users"] = future_wrap["users"] + 1
        else:
            app.logger.debug("futures: newone %s" % cache_key)
            future = self.executor.submit(self._perform_http_get, uri)
            CachedOctoprint.running_requests[cache_key] = {"future": future, "users": 1}

        fut = CachedOctoprint.running_requests.get(cache_key)
        data = fut["future"].result()
        fut["users"] = fut["users"] - 1
        app.logger.debug("futures: state %s %s" % (cache_key, fut["users"]))
        if fut["users"] == 0:
            app.logger.debug("futures: cleanup %s" % cache_key)
            try:
                del CachedOctoprint.running_requests[cache_key]
            except Exception:
                app.logger.debug("futures: cleanup unsuccessful %s" % cache_key)

        try:
            redisinstance.set(
                cache_key,
                pickle.dumps(data),
                ex=CachedOctoprint.expiration_map.get(path, 13),
            )
        except pickle.PicklingError:
            # This is OK, the cache won't be hit for this
            pass
        return data

    def connect_printer(self):
        result = super().connect_printer()
        self.delete_cache_key("/api/printer?exclude=history")
        return result

    def disconnect_printer(self):
        result = super().disconnect_printer()
        self.delete_cache_key("/api/printer?exclude=history")
        return result

    def modify_current_job(self, action):
        result = super().modify_current_job(action)
        self.delete_cache_key("/api/job")
        self.delete_cache_key("/api/printer?exclude=history")
        return result
