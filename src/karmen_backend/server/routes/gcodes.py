import re
import datetime

from flask import jsonify, request, abort, send_file, make_response
from flask_cors import cross_origin
from server import app, __version__
from server.database import gcodes, printjobs, users
from server.services import files
from server.tasks.analyze_gcode import analyze_gcode
from . import jwt_force_password_change, validate_org_access
from flask_jwt_extended import get_current_user


def make_gcode_response(gcode, fields=None, user_mapping=None):
    flist = [
        "id",
        "path",
        "filename",
        "display",
        "absolute_path",
        "uploaded",
        "size",
        "data",
        "analysis",
        "user_uuid",
        "username",
    ]
    fields = fields if fields else flist
    response = {}
    for field in flist:
        if field in fields:
            if field == "username" and user_mapping:
                response[field] = user_mapping.get(gcode.get("user_uuid"), None)
                continue
            if field == "data":
                response["data"] = "/organizations/<org_uuid>/gcodes/%s/data" % (
                    gcode["id"],
                )
                continue
            response[field] = gcode.get(field, None)
    if "uploaded" in response:
        response["uploaded"] = response["uploaded"].isoformat()
    return response


@app.route("/organizations/<org_uuid>/gcodes", methods=["GET"])
@jwt_force_password_change
@validate_org_access()
@cross_origin()
def gcodes_list(org_uuid,):
    gcode_list = []
    order_by = request.args.get("order_by", "")
    if "," in order_by:
        return abort(make_response("", 400))
    try:
        limit = int(request.args.get("limit", 200))
        if limit and limit < 0:
            limit = 200
    except ValueError:
        limit = 200
    try:
        start_with = (
            int(request.args.get("start_with"))
            if request.args.get("start_with")
            else None
        )
        if start_with and start_with <= 0:
            start_with = None
    except ValueError:
        start_with = None
    fields = [f for f in request.args.get("fields", "").split(",") if f]
    filter_crit = request.args.get("filter", None)
    gcodes_record_set = gcodes.get_gcodes(
        org_uuid,
        order_by=order_by,
        limit=limit,
        start_with=start_with,
        filter=filter_crit,
    )
    response = {"items": gcode_list}
    next_record = None
    if len(gcodes_record_set) > int(limit):
        next_record = gcodes_record_set[-1]
        gcodes_record_set = gcodes_record_set[0:-1]
    # get user mapping so we can send usernames to frontend
    uuids = list(
        set(
            [
                p.get("user_uuid")
                for p in gcodes_record_set
                if p.get("user_uuid") != None
            ]
        )
    )
    uuid_mapping = {
        u["uuid"]: u["username"] for u in users.get_usernames_for_uuids(uuids)
    }
    for gcode in gcodes_record_set:
        gcode_list.append(make_gcode_response(gcode, fields, uuid_mapping))

    next_href = "/organizations/%s/gcodes" % org_uuid
    parts = ["limit=%s" % limit]
    if order_by:
        parts.append("order_by=%s" % order_by)
    if fields:
        parts.append("fields=%s" % ",".join(fields))
    if filter_crit:
        parts.append("filter=%s" % filter_crit)
    if next_record:
        parts.append("start_with=%s" % next_record["id"])
        response["next"] = (
            "%s?%s" % (next_href, "&".join(parts)) if parts else next_href
        )

    return jsonify(response)


@app.route("/organizations/<org_uuid>/gcodes/<id>", methods=["GET"])
@jwt_force_password_change
@validate_org_access()
@cross_origin()
def gcode_detail(org_uuid, id):
    gcode = gcodes.get_gcode(id)
    if gcode is None or gcode["organization_uuid"] != org_uuid:
        return abort(make_response("", 404))
    user = users.get_by_uuid(gcode.get("user_uuid"))
    user_mapping = {}
    if user is not None:
        user_mapping[gcode.get("user_uuid")] = user.get("username")
    return jsonify(make_gcode_response(gcode, None, user_mapping))


@app.route("/organizations/<org_uuid>/gcodes", methods=["POST"])
@jwt_force_password_change
@validate_org_access()
@cross_origin()
def gcode_create(org_uuid):
    if "file" not in request.files:
        return abort(make_response("", 400))
    incoming = request.files["file"]
    if incoming.filename == "":
        return abort(make_response("", 400))

    if not re.search(r"\.gco(de)?$", incoming.filename):
        return abort(make_response("", 415))

    try:
        saved = files.save(incoming, request.form.get("path", "/"))
        gcode_id = gcodes.add_gcode(
            path=saved["path"],
            filename=saved["filename"],
            display=saved["display"],
            absolute_path=saved["absolute_path"],
            size=saved["size"],
            user_uuid=get_current_user()["uuid"],
            organization_uuid=org_uuid,
        )
        analyze_gcode.delay(gcode_id)
    except (IOError, OSError) as e:
        return abort(make_response(jsonify(message=str(e)), 500))
    return (
        jsonify(
            make_gcode_response(
                {
                    "id": gcode_id,
                    "user_uuid": get_current_user()["uuid"],
                    "username": get_current_user()["username"],
                    "path": saved["path"],
                    "filename": saved["filename"],
                    "display": saved["display"],
                    "absolute_path": saved["absolute_path"],
                    "uploaded": datetime.datetime.now(),
                    "size": saved["size"],
                }
            )
        ),
        201,
    )


@app.route("/organizations/<org_uuid>/gcodes/<id>/data", methods=["GET"])
@jwt_force_password_change
@validate_org_access()
@cross_origin()
def gcode_file(org_uuid, id):
    gcode = gcodes.get_gcode(id)
    if gcode is None or gcode["organization_uuid"] != org_uuid:
        return abort(make_response("", 404))
    try:
        return send_file(
            gcode["absolute_path"],
            as_attachment=True,
            attachment_filename=gcode["filename"],
        )
    except FileNotFoundError:
        return abort(make_response("", 404))


@app.route("/organizations/<org_uuid>/gcodes/<id>", methods=["DELETE"])
@jwt_force_password_change
@validate_org_access()
@cross_origin()
def gcode_delete(org_uuid, id):
    gcode = gcodes.get_gcode(id)
    if gcode is None or gcode["organization_uuid"] != org_uuid:
        return abort(make_response("", 404))
    user = get_current_user()
    # TODO scope to organization_uuid admin
    if user["uuid"] != gcode["user_uuid"] and user["system_role"] not in ["admin"]:
        return abort(
            make_response(
                jsonify(message="G-Code does not belong to %s" % user["uuid"]), 401
            )
        )
    try:
        files.remove(gcode["absolute_path"])
    except IOError:
        pass
    finally:
        gcodes.delete_gcode(id)
        printjobs.update_gcode_data(
            gcode["id"],
            {
                "id": gcode["id"],
                "user_uuid": gcode["user_uuid"],
                "filename": gcode["filename"],
                "size": gcode["size"],
                "available": False,
            },
        )
    return "", 204
