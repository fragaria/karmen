from flask import jsonify, request, abort
from flask_cors import cross_origin
from server import app, clients
from server.database import printjobs, printers, gcodes


def make_printjob_response(printjob, fields=None):
    flist = ["id", "started", "gcode_data", "printer_data"]
    fields = fields if fields else flist
    response = {}
    for field in flist:
        if field in fields:
            response[field] = printjob[field]
    if "started" in response:
        response["started"] = response["started"].isoformat()
    return response


@app.route("/printjobs", methods=["POST", "OPTIONS"])
@cross_origin()
def printjob_create():
    data = request.json
    if not data:
        return abort(400)
    gcode_id = data.get("gcode", None)
    printer_host = data.get("printer", None)
    if not gcode_id or not printer_host:
        return abort(400)
    printer = printers.get_printer(printer_host)
    if printer is None:
        return abort(404)
    gcode = gcodes.get_gcode(gcode_id)
    if gcode is None:
        return abort(404)
    try:
        printer_inst = clients.get_printer_instance(printer)
        uploaded = printer_inst.upload_and_start_job(
            gcode["absolute_path"], gcode["path"]
        )
        if not uploaded:
            return abort(500, "Cannot upload the g-code to the printer")
        printjob_id = printjobs.add_printjob(
            gcode_id=gcode["id"],
            printer_host=printer["host"],
            gcode_data={
                "id": gcode["id"],
                "filename": gcode["filename"],
                "size": gcode["size"],
                "available": True,
            },
            printer_data={
                "host": printer["host"],
                "name": printer["name"],
                "client": printer["client"],
            },
        )
        return jsonify({"id": printjob_id}), 201
    except clients.utils.PrinterClientException:
        return abort(409)


@app.route("/printjobs", methods=["GET", "OPTIONS"])
@cross_origin()
def printjobs_list():
    printjob_list = []
    order_by = request.args.get("order_by", "")
    if "," in order_by:
        return abort(400)
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
    printjobs_record_set = printjobs.get_printjobs(
        order_by=order_by, limit=limit, start_with=start_with, filter=filter_crit
    )
    response = {"items": printjob_list}
    next_record = None
    if len(printjobs_record_set) > int(limit):
        next_record = printjobs_record_set[-1]
        printjobs_record_set = printjobs_record_set[0:-1]
    for printjob in printjobs_record_set:
        printjob_list.append(make_printjob_response(printjob, fields))

    next_href = "/printjobs"
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


@app.route("/printjobs/<id>", methods=["GET", "OPTIONS"])
@cross_origin()
def printjob_detail(id):
    printjob = printjobs.get_printjob(id)
    if printjob is None:
        return abort(404)
    return jsonify(make_printjob_response(printjob))


@app.route("/printjobs/<id>", methods=["DELETE", "OPTIONS"])
@cross_origin()
def printjob_delete(id):
    printjob = printjobs.get_printjob(id)
    if printjob is None:
        return abort(404)
    printjobs.delete_printjob(id)
    return "", 204
