import abc
from enum import Enum


class PrinterClientAccessLevel(str, Enum):
    UNKNOWN = "unknown"
    PROTECTED = "protected"
    READ_ONLY = "read_only"
    UNLOCKED = "unlocked"


class PrinterClientInfo:
    def __init__(
        self,
        version={},
        connected=False,
        access_level=PrinterClientAccessLevel.UNKNOWN,
        api_key=None,
        webcam=None,
        plugins=None,
    ):
        self.version = version
        self.connected = connected
        self.access_level = access_level
        self.api_key = api_key
        self.webcam = webcam or {"message": "Webcam not accessible"}
        self.plugins = plugins or []


class PrinterClient(abc.ABC):
    @abc.abstractmethod
    def update_network_base(self):
        pass

    @abc.abstractmethod
    def client_name(self):
        pass

    @abc.abstractmethod
    def is_alive(self):
        pass

    @abc.abstractmethod
    def add_api_key(self, api_key):
        pass

    @abc.abstractmethod
    def status(self):
        pass

    @abc.abstractmethod
    def connect_printer(self):
        pass

    @abc.abstractmethod
    def disconnect_printer(self):
        pass

    @abc.abstractmethod
    def webcam(self):
        pass

    @abc.abstractmethod
    def job(self):
        pass

    @abc.abstractmethod
    def modify_current_job(self, action):
        pass

    @abc.abstractmethod
    def upload_and_start_job(self, gcode_disk_path, path=None):
        pass

    @abc.abstractmethod
    def get_printer_props(self):
        pass

    @abc.abstractmethod
    def are_lights_on(self, color=None, heartbeat=None):
        pass

    @abc.abstractmethod
    def set_lights(self, color=None, heartbeat=None):
        pass

    @abc.abstractmethod
    def move_head(self, axis, distance, absolute=False):
        pass

    @abc.abstractmethod
    def home_head(self, axis):
        pass

    @abc.abstractmethod
    def set_temperature(self, device, temp):
        pass

    @abc.abstractmethod
    def extrude(self, length):
        pass

    @abc.abstractmethod
    def set_fan(self, state):
        pass

    @abc.abstractmethod
    def motors_off(self):
        pass


class PrinterClientException(Exception):
    pass
