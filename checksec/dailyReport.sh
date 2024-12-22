#!/bin/bash

# constantes
port=7070
sep="------------------------"
chk="!!!!!!!!!!!!!!!!!!!!!!!!"

# nom des fichiers
dir=/home/ec2-user/checksec/datastore
accessAll=${dir}/accessAll
accessFiltered=${dir}/accessFiltered
listIp=${dir}/listIp
accessAllTmpByIp=${dir}/accessAllTmpByIp
report=${dir}/report.txt
reportJson=${dir}/report.json

##########
##########
echo "Debut analyse des urls:" $lstFileAcc $lstFileSsl `date`
# sudo chmod 750 /var/log/httpd
# sudo chown root:ec2-user /var/log/httpd
# uniquement les fichiers de moins de 3 jours
lstFileAcc=`find /var/log/httpd/access_log* -mmin -4320`
lstFileSsl=`find /var/log/httpd/ssl_access_log* -mmin -4320`
# cumul des acces_log et tri par IP et date
sort $lstFileAcc $lstFileSsl > $accessAll
# Recupère la liste des access bizarres en supprimant les scanner whiteHat
grep -h -v 'GET / \|OPTIONS / \|GET /api/\|GET /enjoy\|GET /ws/\|OPTIONS /api/\|PUT /api/\|POST /api/\|GET /lodestone/character/\|GET /grimoire/deepAi-\|91.164.33.248\|13.38.154.200\|::1 - -\| "-" 408 -\|scan.leakix.org.\|scanner.ducks.party\|censys-scanner.com.\|.letsencrypt.org.\|.internet-census.org.' < $accessAll  > $accessFiltered
# recupère uniquement les adresses IP
awk '{print $1}' < $accessFiltered | sort -u > $listIp
# compte les lignes par IP
echo "** Comptage: $nbIp IP a analyser"
echo "Report.txt du " `date` > $report
cat $listIp | while read ip ; do
	# recupere uniquement les lignes associées à l'IP
	grep "$ip" $accessAll > $accessAllTmpByIp
	# determine le nom dns
	ipDns=`nslookup $ip | grep "name "`
	# comptage des lignes selon le status
	nAcc=`wc -l < $accessAllTmpByIp`
	n200=`grep -c ' 200 ' $accessAllTmpByIp`
	n400=`grep -c ' 400 ' $accessAllTmpByIp`
	n404=`grep -c ' 404 ' $accessAllTmpByIp`
	n410=`grep -c ' 410 ' $accessAllTmpByIp`
	n418=`grep -c ' 418 ' $accessAllTmpByIp`
	n500=`grep -c ' 500 ' $accessAllTmpByIp`
	let "nOth=$nAcc-$n200-$n400-$n404-$n410-$n418-$n500"
	let "nBad=$n400+$n410+$n418+$n500"
  if [ $nBad -gt 0 ]; then echo $ip $sep "********************* ALERTE *******************" >> $report; else echo $ip $sep >> $report; fi
  echo $ip "Dns:" $ipDns >> $report
  echo $ip "Total:" $nAcc "200:" $n200 "400:" $n400 "404:" $n404 "410:" $n410 "418:" $n418 "500:" $n500 "Other:" $nOth >> $report
	if [ $nBad -gt 0 ]; then
		echo $ip $chk "Url a analyser (nBad=$nBad)" >> $report
		grep "$ip" $accessFiltered | grep -v ' 200 \| 201 \| 202 \| 304 ' >> $report
		echo $ip $chk  >> $report
	fi
	cat $accessAllTmpByIp >> $report
done

# comptage
nbFiltered=`wc -l < $accessFiltered`
nbIp=`wc -l < $listIp`
nbAlert=`grep -c '* ALERTE *' $report`
nbFwRules=`sudo iptables -n -L | grep -c 'NOT_YET' `

# synthèse json
echo '{ "name":"checkSecDailyReport", "dthSecond":' `date "+%s"` ', "dateUTC": "'`date`'", "nbIp": '$nbIp', "nbAlert": '$nbAlert', "nbFiltered": '$nbFiltered', "nbFwRules": '$nbFwRules' }' > $reportJson

#menage
rm $accessAll
rm $accessFiltered
rm $listIp
rm $accessAllTmpByIp

# report
cat $reportJson

# publication du report sur pCloud
echo "début publication resultat sur pCloud"
curl "http://localhost:$port/adminTest/pCloudUploadCheckSecReport" --upload-file $report
rc=$?
echo
echo "rc upload $report = $rc"
echo
# synthèse sur discord
curl -X PUT "http://localhost:$port/adminTest/discordReport"
rc=$?
echo

#fini
echo "Report disponible dans" $report "et" $reportJson

