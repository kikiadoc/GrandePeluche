#!/bin/bash
#
# Creation d'un json selon les regles actuelles du firewall iptables
# Merge des regles des autres firewall
# Publication du json sur pCloud.com
# hourly via cron non root
#
rootpath="/home/ec2-user/checksec"
datastore="$rootpath/datastore"
fwJson="$datastore/gp-firewall.json"
awsrules="$rootpath/awsRules.txt"

sudo iptables -L -vn | awk '/tcp dpt:443/ {if ($3=="DROP" && $4=="tcp") print $8 " " substr($0,index($0,"/*" )) } ' > $datastore/tmp_1

awk '{ idxSlash=index($1,"/");
			 if (idxSlash>0)
				{ printf("%s.%s. ",substr($1,0,idxSlash-1),substr($1,idxSlash+1)) ; }
			 else
				{ printf("%s.32. ", $1) ; }
			 printf("%s\n",substr($0,index($0,$2))) 
		}'  $datastore/tmp_1 $awsrules | 
awk -F '.' '
			{
				decimalIp=$1*256*256*256+$2*256*256+$3*256+$4;
				printf("%s ",decimalIp);
				printf("%s ",2**(32-$5));
				printf("%s.%s.%s.%s / %s : %s",$1,$2,$3,$4,$5,substr($0,index($0,$6)) )
				printf("\n");
			}
		' |
sort -n | 
awk -v current_date="$(date '+%s')" '
			BEGIN {
				nbBan=0;
				printf("{\n\"name\": \"fwrules\", \"dth\": \"%s\", \n\"ipRanges\": [\n", current_date)
		  }
			{
				if (nbBan>0) printf(", ");
				nbBan = nbBan+$2;
				printf("{ \"ip\":\"%s\", \"range\":%s, \"from\":%s, \"to\":%s, \"comment\":\"%s\" }\n",$3, $5, $1, $1+$2-1, substr($0,index($0,$7)));
			}
			END {
				printf("],\n\"nbBan\":%s \n}\n",nbBan);
		  }
		'  > $fwJson


cat $fwJson

curl -v "http://localhost:7070/adminTest/pCloudUploadFirewallRules" --upload-file $fwJson
echo
echo Done

