'''
Karmen server exceptions
'''
class DeviceCommunicationError(RuntimeError):
    '''
    General error when communicating with the client device (Pill or an other)
    This can be protocol a mishmash, a network error or an invalid device state.
    '''
    pass

class DeviceNetworkError(IOError, DeviceCommunicationError):
    '''
    There was a network error during communication with the device. Most common reasons are:
    the device could not be reached, network timeout, dns resolving error, ...
    '''
    def __init__(self, message, original_exception, url, method):
        super().__init__(message)
        self.original_exception = original_exception
        self.url = url
        self.method = method

class DeviceAuthorizationError(DeviceCommunicationError):
    '''
    The device is protected by but either none or invalid credentials were
    provided.
    '''
    pass

class DeviceInvalidState(DeviceCommunicationError):
    '''
    The communication was refused by the driver (e.g. octoprint client) because
    the printer is not in a state allowing the requested operation. 
    '''
    pass

class DeviceNotConnectedError(DeviceInvalidState):
    '''
    The communication has been aborted due to the device is not in a connected state.
    Reconnect the device and try again.
    '''
    pass

