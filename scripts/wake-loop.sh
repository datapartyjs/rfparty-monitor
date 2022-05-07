#!/bin/bash

while [ true ]
do
    echo "setting timer for 25min"
	sudo rtcwake --mode no -s 300
	sleep 30
done
