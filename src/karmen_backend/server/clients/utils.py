import abc


class PrinterClientInfo:
    def __init__(self, version={}, connected=False, read_only=False):
        self.version = version
        self.connected = connected
        self.read_only = read_only


class PrinterClient(abc.ABC):
    @abc.abstractmethod
    def client_name(self):
        pass

    @abc.abstractmethod
    def is_alive(self):
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
    def upload_and_start_job(self, gcode_path):
        pass

    @abc.abstractmethod
    def get_printer_props(self):
        pass


class PrinterClientException(Exception):
    pass
