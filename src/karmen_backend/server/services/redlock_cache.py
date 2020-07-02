import pickle
from contextlib import contextmanager
import redis
import functools
from hashlib import md5
from redlock import Redlock, MultipleRedlockException

class LockFailed(RuntimeError): pass


class RedisLock(object):

    def __init__(self, redis_host='127.0.0.1', redis_port=6379):
        self._lock_manager = Redlock([{
            "host": redis_host,
            "port": redis_port,
            "db": 0,
        }])


    @contextmanager
    def lock(self, lock_id, timeout=10000):
        '''
        Context manager to acquire global distributed lock across all applications
        using the same redis.

        Uses implementation of redis distlock
        @see https://redis.io/topics/distlock

        @lock_id string  uniq id of the lock
        @timeout integer  timeout after which the lock will be released (in milliseconds)
        '''
        lock = self._lock_manager.lock(lock_id, timeout)
        if lock is False:
            raise LockFailed()
        try:
            yield lock
        finally:
            self._lock_manager.unlock(lock)


class SharedLockingCache(object):
    '''
    Stores function result in redis. Uses lock to allow only one process /
    thread to update the cache item_lifespan.

    The cache key is full function path including module and string
    representation of arguments.

    Example usage:

    def get_my_data(url):
        return requests.get(url).content

    getter = SharedLockingCache(item_lifespan=10)

    cached_content = getter(geet_my_data, url)
    '''

    PUBLISH_CHANNEL = 'SharedLockingCache'

    def __init__(self, redis_host='127.0.0.1', redis_port=6379, item_lifespan=10, lock_lifespan=None):
        '''
        item_lifespan in seconds
        lock_lifespan in seconds
        '''
        self._item_lifespan = int(item_lifespan * 1000)
        if lock_lifespan is None:
            lock_lifespan = item_lifespan
        self._lock_timeout = int(lock_lifespan * 1000)
        self._redis = redis.Redis(host=redis_host, port=redis_port, db=0)
        self._lock_manager = RedisLock(redis_host, redis_port)

    def _store(self, key, value):
        value = pickle.dumps(value)
        return self._redis.set(key, value, px=self._item_lifespan)

    def _load(self, key):
        value = self._redis.get(key)
        if value is not None:
            value = pickle.loads(value)
        return value

    def __call__(self, callable_, *args, **kwargs):
        # kwargs_hashable = tuple(sorted(kwargs.items()))
        #key = hash( (callable_.__module__, callable_.__name__, args) )
        key = '%s:%s:%s:%s' % (callable_.__module__, callable_.__name__, args, kwargs.items())
        # key = md5(key.encode('utf-8')).hexdigest()
        channel = f'{SharedLockingCache.PUBLISH_CHANNEL}/{key}'
        value = self._load(key)
        if value is None:
            try:
                with self._lock_manager.lock('%s/lock' % key, timeout=self._lock_timeout):
                    value = callable_(*args, **kwargs)
                    self._store(key, value)
                    self._redis.publish(channel, 'set')
            except (MultipleRedlockException, LockFailed):
                receiver = self._redis.pubsub()
                receiver.subscribe(channel)
                message = {'type': None}
                while message['type'] != 'message':
                    message = receiver.get_message(timeout=self._lock_timeout)
                value = self._load(key)
        return value

def make_caching_wrapper(item_lifespan):
    'Returns cacher initiated connected to redis from `app.config` settings'
    from server import app   # importing here to prevent cyclic imports
    return SharedLockingCache(
        redis_host=app.config['REDIS_HOST'],
        redis_port=app.config['REDIS_PORT'],
        item_lifespan=item_lifespan)

class redlock_cached(object):
    '''
    Decorator to cache function calls in redis

    Usage:

        @redlock_cached(item_lifespan=10)
        def my_function(a, b=None):
            ...
    '''

    def __init__(self, item_lifespan):
        if hasattr(item_lifespan, '__call__'):
            # if the only argument to decorator constructor is a callable it
            # was called without any arguments
            raise ValueError("Missing item_lifespan argument.")
        self._cache_wrapper = make_caching_wrapper(item_lifespan)

    def __call__(self, function):
        @functools.wraps(function)
        def wrapper(*args, **kwargs):
            return self._cache_wrapper(function, *args, **kwargs)
        return wrapper
