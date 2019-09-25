import abc

class PrinterClientInfo:
    def __init__(self, version={}, connected=False, read_only=False):
        self.version = version
        self.connected = connected
        self.read_only = read_only

class PrinterDriver(abc.ABC):
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
    def webcam(self):
        pass

    @abc.abstractmethod
    def job(self):
        pass

    @abc.abstractmethod
    def start_job(self, gcode_path):
        pass
