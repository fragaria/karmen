import re
import datetime
import uuid as guid

from flask import jsonify, request, abort, send_file, make_response
from flask_cors import cross_origin
from flask_jwt_extended import get_current_user
from server import app, __version__
from server.database import gcodes, printjobs, users, organizations, organization_roles
from server.services import files
from server.tasks.analyze_gcode import analyze_gcode
from . import jwt_force_password_change, validate_org_access, validate_uuid


def make_gcode_response(gcode, fields=None, user_mapping=None):
    flist = [
        "uuid",
        "path",
        "filename",
        "display",
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
                response["data"] = "/organizations/%s/gcodes/%s/data" % (
                    gcode["organization_uuid"],
                    gcode["uuid"],
                )
                continue
            response[field] = gcode.get(field, None)
    if "uploaded" in response:
        response["uploaded"] = response["uploaded"].isoformat()
    return response


# /organizations/<org_uuid>/gcodes, GET
@jwt_force_password_change
@validate_org_access()
@cross_origin()
def gcodes_list(org_uuid):
    gcode_list = []
    order_by = request.args.get("order_by", "")
    if "," in order_by:
        return abort(
            make_response(jsonify(message="order_by supports only one data field"), 400)
        )

    limit = int(request.args.get("limit", 200))

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

    search = request.args.get("search", None)
    if search:
        search = [search, ["display", "path"]]

    gcodes_record_set = gcodes.get_gcodes(
        org_uuid,
        order_by=order_by,
        limit=limit,
        start_with=start_with,
        fulltext_search=search,
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
    uuid_mapping = {u["uuid"]: u["username"] for u in users.get_users_by_uuids(uuids)}
    for gcode in gcodes_record_set:
        gcode_list.append(make_gcode_response(gcode, fields, uuid_mapping))

    next_href = "/organizations/%s/gcodes" % org_uuid
    parts = ["limit=%s" % limit]
    if order_by:
        parts.append("order_by=%s" % order_by)
    if fields:
        parts.append("fields=%s" % ",".join(fields))
    if next_record:
        parts.append("start_with=%s" % next_record["uuid"])
        response["next"] = (
            "%s?%s" % (next_href, "&".join(parts)) if parts else next_href
        )

    return jsonify(response)


# /organizations/<org_uuid>/gcodes/<gcode_uuid>, GET
@jwt_force_password_change
@validate_org_access()
@cross_origin()
def gcode_detail(org_uuid, gcode_uuid):
    validate_uuid(gcode_uuid)
    gcode = gcodes.get_gcode(gcode_uuid)
    if gcode is None or gcode["organization_uuid"] != org_uuid:
        return abort(make_response(jsonify(message="Not found"), 404))
    user = users.get_by_uuid(gcode.get("user_uuid"))
    user_mapping = {}
    if user is not None:
        user_mapping[gcode.get("user_uuid")] = user.get("username")
    return jsonify(make_gcode_response(gcode, None, user_mapping))


# /organizations/<org_uuid>/gcodes, POST
@jwt_force_password_change
@validate_org_access()
@cross_origin()
def gcode_create(org_uuid):
    if "file" not in request.files:
        return abort(make_response(jsonify(message="No file uploaded"), 400))
    incoming = request.files["file"]
    if incoming.filename == "":
        return abort(
            make_response(jsonify(message="Uploaded file has to have a name"), 400)
        )

    if not re.search(r"\.gco(de)?$", incoming.filename):
        return abort(
            make_response(
                jsonify(message="Uploaded file does not look like gcode"), 415
            )
        )

    saved = files.save(org_uuid, incoming, request.form.get("path", "/"))
    gcode_id = gcodes.add_gcode(
        uuid=guid.uuid4(),
        path=saved["path"],
        filename=saved["filename"],
        display=saved["display"],
        absolute_path=saved["absolute_path"],
        size=saved["size"],
        user_uuid=get_current_user()["uuid"],
        organization_uuid=org_uuid,
    )
    analyze_gcode.delay(gcode_id)
    return (
        jsonify(
            make_gcode_response(
                {
                    "uuid": gcode_id,
                    "organization_uuid": org_uuid,
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


# /organizations/<org_uuid>/gcodes/<gcode_uuid>/data, GET
@jwt_force_password_change
@validate_org_access()
@cross_origin()
def gcode_file(org_uuid, gcode_uuid):
    validate_uuid(gcode_uuid)
    gcode = gcodes.get_gcode(gcode_uuid)
    if gcode is None or gcode["organization_uuid"] != org_uuid:
        return abort(make_response(jsonify(message="Not found"), 404))
    try:
        return send_file(
            gcode["absolute_path"],
            as_attachment=True,
            attachment_filename=gcode["filename"],
        )
    except FileNotFoundError:
        return abort(make_response(jsonify(message="File not found"), 404))


# /organizations/<org_uuid>/gcodes/<gcode_uuid>, DELETE
@jwt_force_password_change
@validate_org_access()
@cross_origin()
def gcode_delete(org_uuid, gcode_uuid):
    validate_uuid(gcode_uuid)
    gcode = gcodes.get_gcode(gcode_uuid)
    if gcode is None or gcode["organization_uuid"] != org_uuid:
        return abort(make_response(jsonify(message="Not found"), 404))
    user = get_current_user()
    org_role = organization_roles.get_organization_role(org_uuid, user["uuid"])
    if (
        user["uuid"] != gcode["user_uuid"]
        and user["system_role"] != "admin"
        and org_role["role"] != "admin"
    ):
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
        printjobs.update_gcode_data(
            gcode_uuid,
            {
                "uuid": gcode["uuid"],
                "user_uuid": gcode["user_uuid"],
                "filename": gcode["filename"],
                "size": gcode["size"],
                "available": False,
            },
        )
        gcodes.delete_gcode(gcode_uuid)
    return "", 204
