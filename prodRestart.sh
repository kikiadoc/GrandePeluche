#! /bin/bash
#
# redemarrage des services de prod incluant le reverse proxy
#
# creation du lien
# sudo ln -s /home/ec2-user/kikibackend.service /etc/systemd/system/kikibackend.service
#
echo "reload deamon / servers"
sudo systemctl daemon-reload
#
echo "restart services"
sudo systemctl restart httpd.service kikibackend.service kikichecksec.service
#
sleep 1
echo "service status:"
sudo systemctl status httpd.service kikibackend.service kikichecksec.service | egrep "service|active"
echo "rc=$?"
#
echo "apache listening:"
httpd -t -D DUMP_VHOSTS
