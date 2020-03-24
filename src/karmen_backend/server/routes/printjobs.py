import uuid as guid
from flask import jsonify, request, abort, make_response
from flask_cors import cross_origin
from flask_jwt_extended import get_current_user
from server import app, clients
from server.database import printjobs, printers, gcodes, users, network_clients
from . import jwt_force_password_change, validate_org_access, validate_uuid


def make_printjob_response(printjob, fields=None, user_mapping=None):
    flist = [
        "uuid",
        "started",
        "gcode_data",
        "printer_data",
        "printer_uuid",
        "user_uuid",
        "username",
    ]
    fields = fields if fields else flist
    response = {}
    for field in flist:
        if field in fields:
            if field == "username" and user_mapping:
                response[field] = user_mapping.get(printjob.get("user_uuid"), None)
            else:
                response[field] = printjob.get(field, None)
    if "started" in response:
        response["started"] = response["started"].isoformat()
    return response


@app.route("/organizations/<org_uuid>/printjobs", methods=["POST"])
@jwt_force_password_change
@validate_org_access()
@cross_origin()
def printjob_create(org_uuid):
    data = request.json
    if not data:
        return abort(make_response(jsonify(message="Missing payload"), 400))
    gcode_uuid = data.get("gcode", None)
    printer_uuid = data.get("printer", None)
    if not gcode_uuid or not printer_uuid:
        return abort(
            make_response(jsonify(message="Missing gcode_uuid or printer_uuid"), 400)
        )
    validate_uuid(gcode_uuid)
    validate_uuid(printer_uuid)
    printer = printers.get_printer(printer_uuid)
    if printer is None or printer["organization_uuid"] != org_uuid:
        return abort(make_response(jsonify(message="Not found"), 404))
    gcode = gcodes.get_gcode(gcode_uuid)
    if gcode is None:
        return abort(make_response(jsonify(message="Not found"), 404))
    try:
        network_client = network_clients.get_network_client(
            printer["network_client_uuid"]
        )
        printer_data = dict(network_client)
        printer_data.update(dict(printer))
        printer_inst = clients.get_printer_instance(printer_data)
        uploaded = printer_inst.upload_and_start_job(
            gcode["absolute_path"], gcode["path"]
        )
        if not uploaded:
            return abort(
                make_response(
                    jsonify(message="Cannot upload the g-code to the printer"), 500
                )
            )
        printjob_uuid = guid.uuid4()
        printjobs.add_printjob(
            uuid=printjob_uuid,
            gcode_uuid=gcode["uuid"],
            organization_uuid=org_uuid,
            printer_uuid=printer["uuid"],
            user_uuid=get_current_user()["uuid"],
            gcode_data={
                "uuid": gcode["uuid"],
                "filename": gcode["filename"],
                "size": gcode["size"],
                "available": True,
            },
            printer_data={
                "ip": printer_inst.ip,
                "port": printer_inst.port,
                "hostname": printer_inst.hostname,
                "name": printer_inst.name,
                "client": printer_inst.client,
            },
        )
        return (
            jsonify({"uuid": printjob_uuid, "user_uuid": get_current_user()["uuid"]}),
            201,
        )
    except clients.utils.PrinterClientException as e:
        app.logger.error(e)
        return abort(
            make_response(
                jsonify(message="Cannot schedule a printjob: %s" % str(e)), 409
            )
        )


@app.route("/organizations/<org_uuid>/printjobs", methods=["GET"])
@jwt_force_password_change
@validate_org_access()
@cross_origin()
def printjobs_list(org_uuid):
    printjob_list = []
    order_by = request.args.get("order_by", "")
    if "," in order_by:
        return abort(
            make_response(jsonify(message="order_by supports only one data field"), 400)
        )
    if order_by in ["gcode_data", "printer_data"]:
        order_by = ""
    try:
        limit = int(request.args.get("limit", 200))
        if limit and limit < 0:
            limit = 200
    except ValueError:
        limit = 200
    try:
        start_with = (
            guid.UUID(request.args.get("start_with"), version=4)
            if request.args.get("start_with")
            else None
        )
        # There is a hidden side effect in uuid module. When version is specified,
        # it does not break, but instead silently modifies the content. Ugly!
        if str(start_with) != request.args.get("start_with"):
            start_with = None
    except ValueError:
        start_with = None
    fields = [f for f in request.args.get("fields", "").split(",") if f]
    filter_crit = request.args.get("filter", None)
    printjobs_record_set = printjobs.get_printjobs(
        org_uuid,
        order_by=order_by,
        limit=limit,
        start_with=start_with,
        filter=filter_crit,
    )
    response = {"items": printjob_list}
    next_record = None
    if len(printjobs_record_set) > int(limit):
        next_record = printjobs_record_set[-1]
        printjobs_record_set = printjobs_record_set[0:-1]
    # get user mapping so we can send usernames to frontend
    uuids = list(
        set(
            [
                p.get("user_uuid")
                for p in printjobs_record_set
                if p.get("user_uuid") != None
            ]
        )
    )
    uuid_mapping = {u["uuid"]: u["username"] for u in users.get_users_by_uuids(uuids)}
    for printjob in printjobs_record_set:
        printjob_list.append(make_printjob_response(printjob, fields, uuid_mapping))
    next_href = "/organizations/%s/printjobs" % org_uuid
    parts = ["limit=%s" % limit]
    if order_by:
        parts.append("order_by=%s" % order_by)
    if fields:
        parts.append("fields=%s" % ",".join(fields))
    if filter_crit:
        parts.append("filter=%s" % filter_crit)
    if next_record:
        parts.append("start_with=%s" % next_record["uuid"])
        response["next"] = (
            "%s?%s" % (next_href, "&".join(parts)) if parts else next_href
        )

    return jsonify(response), 200


@app.route("/organizations/<org_uuid>/printjobs/<uuid>", methods=["GET"])
@jwt_force_password_change
@validate_org_access()
@cross_origin()
def printjob_detail(org_uuid, uuid):
    validate_uuid(uuid)
    printjob = printjobs.get_printjob(uuid)
    if printjob is None or printjob["organization_uuid"] != org_uuid:
        return abort(make_response(jsonify(message="Not found"), 404))
    user = users.get_by_uuid(printjob.get("user_uuid"))
    user_mapping = {}
    user_mapping[printjob.get("user_uuid")] = user.get("username")
    return jsonify(make_printjob_response(printjob, None, user_mapping))
