import psycopg2
import psycopg2.extras
from server.database import get_connection

def get_network_devices(ip=None):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        if ip:
            cursor.execute("SELECT ip, retry_after, disabled FROM network_devices where ip = %s", (ip,))
        else:
            cursor.execute("SELECT ip, retry_after, disabled FROM network_devices")
        data = cursor.fetchall()
        cursor.close()
        return data

def upsert_network_device(**kwargs):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            "INSERT INTO network_devices (ip, retry_after, disabled) values (%s, %s, %s) ON CONFLICT ON CONSTRAINT network_devices_ip_pkey DO UPDATE SET retry_after = %s, disabled = %s",
            (
                kwargs["ip"], kwargs["retry_after"], kwargs["disabled"],
                kwargs["retry_after"], kwargs["disabled"]
            )
        )
        cursor.close()
