#!/bin/bash

echo "Setting node permissions"
sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)


echo "Linking directory"
dir=$(cd ../ && pwd)
sudo ln -s $dir /usr/lib/rfparty-monitor

echo "Linking executables"
sudo ln -s $dir/bin/rfparty-info /usr/sbin/
sudo ln -s $dir/bin/rfparty-monitor /usr/sbin/

echo "Installing service files"
sudo cp $dir/systemd/rfparty-monitor.service /etc/systemd/system/

echo "Starting service 🤘"
sudo systemctl daemon-reload
sudo systemctl enable rfparty-monitor.service
sudo systemctl start rfparty-monitor.service
