#
# Sauvegarde quatidienn
echo "début sauvegarde quotidienne"
#
PORT=7070
UD="/home/ec2-user"
SAVETGZ="/home/ec2-user/.sauvegarde.tgz"
FILELIST="/home/ec2-user/.sauvegarde.lst"
JSON="/home/ec2-user/.sauvegarde.json"
SALT="/home/ec2-user/.sauvegarde.salt"
CRONTAB="/home/ec2-user/.crontab.lst"
#
# Menage des scories
rm -Rf $UD/dev/.git
#
# sauvegarde des configs spéciales iptables, crontab
sudo service iptables save
crontab -l > $CRONTAB
#
# creation du TGZ
salage=`date +'%y.%m.%d.%H.%M.%S'`
echo "$salage" > $SALT
rm -f $SAVETGZ
echo "making TGZ"
sudo tar cvzfP $SAVETGZ $UD/*.service $UD/*.sh $UD/dev $UD/prod/inframain/datastore $UD/checksec $UD/garland $UD/.vault.donotdelete $CRONTAB /etc/logrotate.d/httpd /etc/sysconfig/iptables /etc/httpd/conf* /var/www/static /etc/letsencrypt $SALT > $FILELIST
rcTar=$?
md5=`md5sum $SAVETGZ | awk '{print $1}'`
nbFile=`wc -l $FILELIST | awk '{print $1}'`
#
#
# // publication sur pCloud via nodeJs
# // echo "publication sauvegarde sur pCloud"
# // curl -X PUT "http://localhost:$PORT/adminTest/pCloudUploadSauvegarde" 
# // rcUpload=$?

# publication par curl seloninfo de nodeJs
url=`curl localhost:$PORT/adminTest/pCloudUrlSave | jq -r ".msg"`
# echo curl --upload-file $SAVETGZ $url
curl --upload-file $SAVETGZ $url
rcUpload=$?


# publication du json pour synthèse
echo "{ \"name\": \"makeTarSave\", \"dthSecond\": \"`date '+%s'`\", \"salageCrypto\": \"$salage\", \"md5\": \"$md5\", \"nbFile\": \"$nbFile\", \"rcTar\": \"$rcTar\", \"rcUpload\": \"$rcUpload\" }" > $JSON
echo
#
# Efface le fichier car contient des elements sensibles
rm -f $SAVETGZ
#
#fini
echo "Fin sauvegarde journaliere"
