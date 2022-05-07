#!/bin/bash

count=0

while [ "$count" -lt 2 ]
do
	count=$(sudo mmcli -m ANY | wc -l)
        sleep 5
done
