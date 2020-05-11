## printers

### printer_response
Printer client object, created in `make_printer_response` function. Contains all requested data known about the printer. 
`client`, `name`, `uuid` and some other fields are always included. Aditional fields `status`, `webca,`, `job` and `lights` are 
added only if requested. Sample of this object can be seen in [Get Printer](#Get-printer)


### List printers 
#### /organizations/<org_uuid>/printers, GET
`/organizations/<org_uuid>/printers[?fields=job,status,webcam,lights]`

Requires `user` or `admin` role

Returns object with field `items` containing list of all printers in this organization as a list of `printer_response`s. `fields` parameter can be sent in URL if you want printer_resopnses
to have these fields.  

Sample response could look like this:

```json
{
  "items": [
    { //printer_response
      "client": {
        "access_level": "unlocked", 
        ...
        }, 
    }, 
    {
     //printer_response
    ...
    }
  ]
}

```

##### Possible responses
 - 200: OK
 - 400: Invalid UUID
 - 403: If you do not have permission to access this organisation or it does not exists.

### Get printer
#### /organizations/<org_uuid>/printers/<uuid>, GET
`/organizations/<org_uuid>/printers/<uuid>[?fields=job,status,webcam,lights]`

Requires `user` or `admin` role

Returns single printer_response for requested printer. 
It looks like this:
```json
{
  "client": {
    "access_level": "unlocked", 
    "api_key": null, 
    "connected": true, 
    "name": "octoprint", 
    "pill_info": {
      "karmen_version": "0.2.0", 
      "update_available": "0.2.2", 
      "update_status": null, 
      "version_number": "0.2.0"
    }, 
    "plugins": [
      "awesome_karmen_led"
    ], 
    "version": {
      "api": "0.1", 
      "server": "0.0.1", 
      "text": "octoprint fake"
    }
  }, 
  "hostname": "karmen_fake_printer1_1.karmen_printers.local", 
  "ip": "172.16.236.11", 
  "job": {
    "completion": 66.666, 
    "name": "fake-file-being-printed.gcode", 
    "printTime": 3066, 
    "printTimeLeft": 5093
  }, 
  "lights": "off", 
  "name": "fake 1", 
  "path": "", 
  "port": 8080, 
  "printer_props": {
    "bed_type": "Powder coated PEI", 
    "filament_color": "black", 
    "filament_type": "PETG", 
    "tool0_diameter": 0.25
  }, 
  "protocol": "http", 
  "status": {
    "state": "Printing", 
    "temperature": {
      "bed": {
        "actual": 24.7, 
        "target": 24.7
      }, 
      "tool0": {
        "actual": 16.2, 
        "target": 16.2
      }
    }
  }, 
  "token": null, 
  "uuid": "20e91c14-c3e4-4fe9-a066-e69d53324a20", 
  "webcam": {
    "flipHorizontal": false, 
    "flipVertical": false, 
    "rotate90": false, 
    "url": "/organizations/b3060e41-e319-4a9b-8ac4-e0936c75f275/printers/20e91c14-c3e4-4fe9-a066-e69d53324a20/webcam-snapshot"
  }
}
```
##### Possible responses:
 - 200: OK
 - 400, `{"message": "Invalid uuid"}`: Invalid printer or org. UUID. Response will contain 
 - 404, `{"message": "Not found"}`: Printer not found. It either doesn't exists or is not in this organization

### Add printer
#### /organizations/<org_uuid>/printers, POST
`/organizations/<org_uuid>/printers`

Requires `admin` role

Post to this endpoint to add a printer. Request body must contain payload with printer info. Payload could look
like this:
```json
{"protocol":"http","ip":"<ip>","port":80,"hostname": "<hostname>","path": "","name":"<printer name","api_key":""}
```
 - `protocol` - if printer API is listening on HTTP or HTTPS
 - Either `ip` or `hostname` must be supplied to identify the printer on network, but never send both
 - `port` for API, defaults to 80
 - `path`, if printer API is not found on standard path (like `192.168.1.50/printer/path/api` instead of 
 `192.168.1.50/api`), specify the extra part (`/printer/path/`) here
 - `name` is for user defined name of the printer
 - `api_key` to set API key for protected API. Send empty if none. 

In cloud mode, this endpoint has only 4 parameters, all required. `token` is WS API token from pill. The rest stays 
the same.
```json
{"protocol":"http","token":"<token>","name":"<printer name>","api_key":""}
```

If successfull, `printer_response` of the newly created printer will be returned. Aditional field will not be sent.

##### Possible responses:
 - 200, OK. 
 - 400, `{"message": "Missing token"}`: Empty token was sent
 - 400, `{"message": "Missing some network data about the printer"}`: You are trying to add printer in non-cloud mode,
 but not enough data to identify the printer in network was supplied.
 - 500, `message: "Cannot add printer without a token in CLOUD_MODE`: You are tryint to add printer in cloud mode 
 without token
 - 409, `{"message": "Printer exists"}`: Printer with this token or ip, port, path already exists in this organization 
 - 500, `message. "Cannot resolve <hostname> with mDNS"`: You are trying to add printer via hostname, but the server
 was unable to resolve that hostname to an IP.
 
 
### Delete printer
#### /organizations/<org_uuid>/printers/<uuid>, DELETE
`/organizations/<org_uuid>/printers/<uuid>`

Requires `admin` role

To delete a printer, send DELETE request to this path

##### Possible responses
 - 204: OK, deleted
 - 404, `message:"Not found"`: printer not found


### Update printer
#### organizations/<org_uuid>/printers/<uuid>, PATCH
`organizations/<org_uuid>/printers/<uuid>`

Requires `admin` role

To update printer properties (`name`, `printer_props` or `api_key`), send payload to this endpoint via PATCH method.
`name` is required, `api_key` and `printer_props` are optional. All field of `printer_props` must be present.

```json
{
"name":"fake 1",
"api_key": "XXX",
"printer_props":{
    "filament_type":"PETG",
    "filament_color":"black",
    "bed_type":"Powder coated PEI",
    "tool0_diameter":0.25,
    "note":""
  }
}
```

##### Possible responses
 - 200, OK. `printer_response` is returned
 - 400, `{"message": "Missing payload"}`: No Payload was sent
 - 400, `{"message": "Missing name"}`: name field is missing


### (Dis)connect printer
#### /organizations/<org_uuid>/printers/<uuid>/connection, POST
`/organizations/<org_uuid>/printers/<uuid>/connection`

Requires `admin` or `user` role

To change connection state (connect or disconnect printer), send payload via POST. Expected payload is
 `{"state":"online"}` to connect or `{"state":"offline"}` to disconnect.

#####Possible responses
 - 204, OK
 - 400, `{"message": "Missing payload"}`
 - 400, `{"message": "<state> is an unknown state"}`: invalid state was sent
 - 500, `{"message": "Cannot change printer's connection state to online"}`
 - 500, `{"message": "Cannot change printer's connection state to offline"}`

### Modifying current printjob
#### /organizations/<org_uuid>/printers/<uuid>/current-job, POST
`/organizations/<org_uuid>/printers/<uuid>/current-job`

Requires `user` or `admin` role

To modify current job, sent payload with action `{"action": "<action>"}`. Possible actions are 
 - `cancel` - Cancels current job
 - `pause` - pause current job
 - `resume` - Resume paused job 

##### Possible responses
 - 204, OK
 - 400, `{"message": "Missing payload"}`
 - 400, `{"message": "Missing action"}`
 - 400, `{"message": "<generic>>"}`: Generic error returned by printer control software
 - 409, `{"message": "Nothing is running"}`: There is no current job to modify
 

### Get webcam snapshot
#### /organizations/<org_uuid>/printers/<uuid>/webcam-snapshot, GET
`/organizations/<org_uuid>/printers/<uuid>/webcam-snapshot`

Requires `admin` or `user` role

To get snapshot from printer webcam, simply hit this endpoint with GET

##### Possible responses
 - 200, OK. Image is returned
 - 202: Karmen is initializing connection. Keep trying, image will be returned in following requests
 - 404, `{"message": "Not found"}`: Either requested printer does not exists, or it does not have webcam
 
 
### Set lights
#### /organizations/<org_uuid>/printers/<uuid>/lights, POST
`/organizations/<org_uuid>/printers/<uuid>/lights`

Requires `admin` or `user` role

Requires no payload. Toggles light on/off and returns current state.

##### Possible responses
 - 200, `{"status": "<status>"}`: Toggled succesfully, `on` or `off` is returned as status.
 - 500, `{"status": "unavailable"}`: Lights are not available on this printer
 

### Controlling printhead
#### /organizations/<org_uuid>/printers/<uuid>/printhead, POST
`/organizations/<org_uuid>/printers/<uuid>/printhead`

Requires `admin` or `user` role

To move or home printhead, send paylod to this endpoint via POST.

Payload needs to have `command` field. To move printhead, set `command` to `jog`. When moving printhead, you need to 
specify one axis and the distance, and if the movement is absolute, like this:

`{"command":"jog","x":10,"absolute":false}` is to move `X` axis by `10 mm`

`{"command":"jog","z":-10,"absolute":false}` is to move `Z` axis by `-10 mm`

To home any axis, set `command` to `home` and provide list of `axes` to home, like this:

`{"command":"home","axes":["x","y"]}` is to home `X` and `Y` axes. 

##### Possible responses
 - 204: OK
 - 400, `{"message": "Missing payload or command"}`
 - 400, `{"message": "Distance on <axis> must be a number"}`: Invalid distance to jog was specified
 - 400, `{"message": "<axis> is not a valid axes value"}`: You are homing other axis than `x`, `y` or `z`
 - 400, `{"message": "Unknown command"}`: command is not `home` or `jog`
 - 400, `{"message": "Missing axes"}`: No list of axes to home was sent
 - 500, `{"message": "Cannot move printhead"}`: Printer refused to move
 

### Controlling fan
#### /organizations/<org_uuid>/printers/<uuid>/fan, POST
`/organizations/<org_uuid>/printers/<uuid>/fan`

Requires `admin` or `user` role

To turn fan `on` or `off`, send payload with the desired `target` state: `{"target": "on"}` or `{"target": "off"}`

##### Possible responses
 - 204: OK
 - 400, `{"message": "Missing payload"}`
 - 400, `{"message": "Missing or invalid target"}`: `target` is not `on` or `off`
 - 500, `{"message": "Cannot control fan"}`: Printer refused to control fan
 


### Disabling motors
#### /organizations/<org_uuid>/printers/<uuid>/motors, POST
`/organizations/<org_uuid>/printers/<uuid>/fan`

Requires `admin` or `user` role

To turn motors`off`, send payload with the desired `target` state: `{"target": "off"}`

##### Possible responses
 - 204: OK
 - 400, `{"message": "Missing payload or target"}`
 - 400, `{"message": "Missing or invalid target"}`: `target` is not  `off`
 - 500, `{"message": "Cannot control motors"}`: Printer refused to control motors
 
 
### Controlling extrusion
#### /organizations/<org_uuid>/printers/<uuid>/extrusion, POST
`/organizations/<org_uuid>/printers/<uuid>/extrusion`

To extrude or retract filament, sent paylod with required `amount` in mm: `{"amount": 10}`

##### Possible responses
 - 204: OK
 - 400, `{"message": "Missing payload or amount"}`
 - 400, `{"message": "Amount must be a number"}`: Amount is not an integer
 - 500, `{"message": "Cannot extrude"}`: Printer refused to extrude.

### Controlling temperature
#### /organizations/<org_uuid>/printers/<uuid>/temperatures/<part_name>, POST
`/organizations/<org_uuid>/printers/<uuid>/temperatures/<part_name>`

Requires `admin` or `user` role

To set temperature of `part_name`, send payload containing `target` temperature as positive float. 
Part can be `tool0`, `tool1` or `bed`. Sample payload looks like `{"target": 30.5}`

##### Possible responses
 - 204: OK
 - 400, `{"message": "<part_name> is not a valid part choice"}`: Invalid part
 - 400, `{"message": "Missing paylaod or target"}`
 - 400, `{"message": "Target must be a number"}`
 - 400, `{"message": "Cannot set negative temperature"}`
 - 500, `{"message": "Cannot set temperature"}`: Printer refused to change temperature
 
 
### Updating a pill
#### /organizations/<org_uuid>/printers/<uuid>/update/, POST
`/organizations/<org_uuid>/printers/<uuid>/update/`

Requires `admin` or `user` role

To trigger an update for a Karmen pill, hit this endpoint with a POST. 

##### Possible responses:
 - 200: OK
 - 400, `{"message": "The automatic update is supported on original Pill devices only."}`
 - 400, `{"message": "Update is not available for the device."}`
 - 500, `Unable to start update`: Pill was unable to start update. 


 
 
 
 