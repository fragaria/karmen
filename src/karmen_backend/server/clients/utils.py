import abc


class PrinterClientInfo:
    def __init__(
        self,
        version={},
        connected=False,
        read_only=False,
        protected=False,
        api_key=None,
    ):
        self.version = version
        self.connected = connected
        self.read_only = read_only
        self.protected = protected
        self.api_key = api_key


class PrinterClient(abc.ABC):
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


class PrinterClientException(Exception):
    pass
