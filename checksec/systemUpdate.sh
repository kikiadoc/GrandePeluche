#! /bin/bash
logs=/home/ec2-user/checksec/datastore/yumUpdate.txt
reportJson=/home/ec2-user/checksec/datastore/yumUpdate.json
port=7070

echo "Début de la mise à jour système"

# update system
echo "*** Mise a jour systeme et patch securite du " `date` > $logs
sudo /usr/bin/dnf upgrade -y >> $logs
rcYumUpdate=$?
echo "*** fin de mise a jour:" `date` >> $logs

# verif synchro horloges
echo "*** Verif synchro horloge" >> $logs
chronyc tracking >> $logs 
# chronyc sources >> $logs
echo "*** Fin Verif synchro horloge" >> $logs

# affichage du rapport dans les logs systeme
cat $logs

# publication de l'update sur pCloud
echo "debut publication resultat sur pCloud"
curl "http://localhost:$port/adminTest/pCloudUploadYumUpdate" --upload-file $logs
echo
echo "fin publication resultat sur pCloud"

echo '{ "name": "systemUpdate", "dthSecond":'`date '+%s'`', "dateUTC": "'`date`'", "rc":'$rcYumUpdate'}' > $reportJson

cat $reportJson
echo "Fin de la  mise a jour système"
