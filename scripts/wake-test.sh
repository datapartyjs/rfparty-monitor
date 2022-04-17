#!/bin/bash

while [ true ]
do
    echo "online for 60s $(date)"
    sleep 30

    echo "sleeping for for 30 sec $(date)"
    sudo rtcwake --mode no -s 300
    sudo systemctl suspend
    echo "offline for 30s $(date)"
    sleep 2
    echo "Johny5 Alive! $(date)"
done
