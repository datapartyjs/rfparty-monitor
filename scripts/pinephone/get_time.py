#!/usr/bin/python3
#
# load_agps_data
#
# proof of concept loading of agps data to quectel modem via AT commands

from datetime import datetime, timezone

def getTime():
    now = datetime.utcnow().replace(tzinfo=timezone.utc).strftime('%Y/%m/%d,%H:%M:%S')
    print(f"AT+QGPSXTRATIME=0,\"{now}\"")


getTime()
