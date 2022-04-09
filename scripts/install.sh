#!/bin/bash

echo "Setting node permissions"
setcap cap_net_raw+eip $(eval readlink -f `which node`)


echo "Linking directory"

dir=$(dirname "$(readlink -f "$0")")
ln -s $(dirname $dir) /usr/lib/rfparty-monitor

echo "Linking executables"
ln -s $dir/../bin/rfparty-info /usr/sbin/
ln -s $dir/../bin/rfparty-monitor /usr/sbin/

echo "Installing service files"
cp $dir/systemd/rfparty-monitor.service /etc/systemd/system/

echo "Starting service 🤘"
systemctl daemon-reload
systemctl enable rfparty-monitor.service
systemctl start rfparty-monitor.service
