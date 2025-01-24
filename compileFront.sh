#! /bin/bash
#
# Usage: compile STAGING ou PROD
# Tag des fichiers style date de compil
# Inclusion des pages ayant été désactivées sur le DEV si besoin
# Compilation des sources svelte du client
# Copy des fichiers dans la directory du serveur static
# Commit de la version pour vérification par le serveur de synchro multi-joueur
#
#
if [ "$1" = "PROD" ] 
then
  echo "COMPILE PROD !!!!!!!!!!!!!!!!!!!!!!!!!"
  echo "COMPILE PROD !!!!!!!!!!!!!!!!!!!!!!!!!"
  echo "COMPILE PROD !!!!!!!!!!!!!!!!!!!!!!!!!"
  echo "COMPILE PROD !!!!!!!!!!!!!!!!!!!!!!!!!"
  webpath="enjoy"
  apitype=""
	datastore="/home/ec2-user/prod/inframain/datastore"
  urlApi="http://localhost:7070"
else
if [ "$1" = "STAGING" ]
then 
  echo "COMPILE STAGING !!!!!!!!!!!!!!!!!!!!!!!!!"
  webpath="enjoyTest"
  apitype="test"
	datastore="/home/ec2-user/dev/inframain/datastore"
  urlApi="http://localhost:7072"
else
  echo "ERREUR indiquer STAGING OU PROD"
  exit 1;
fi
fi

dir="/var/www/static/$webpath"
addr="ff14.adhoc.click"
subdir="transition"

cd /home/ec2-user/dev/front

echo "================================="
echo "Verifier:"
echo "Version npm 16"
echo "source dans src/$subdir"
echo "target web dans $dir"
echo "apiPourCommit version: $urlApi"
echo "================================="
 

echo "copy sources src/$subdir to src/routes"
cp src/$subdir/* src/routes

version="$1 `date +'%y.%m.%d.%H.%M'`"
echo "update version in +page.svelte to $version"
sed "s/let version=null/let version='$version'/g" < src/$subdir/+page.svelte > tmp.svelte

regexp='s,// ONLYCOMPILED,,g'
echo "update $regexp in +page.svelte"
sed "$regexp" < tmp.svelte  > src/routes/+page.svelte

echo "update WEBPATH to $webpath in svelte.config.js" 
sed "s/WEBPATH/$webpath/" < svelte.config.js.template > svelte.config.js

echo "update APITYPE in storage.js to $apitype"
sed "s/APITYPE='test'/APITYPE='$apitype'/" < src/$subdir/storage.js  > src/routes/storage.js

echo "update subdir z files"
for i in src/$subdir/z/*; do
	f=`basename $i`
	echo "fichier:" $f
	sed "s/\.\/storage.js/\.\.\/storage.js/g" < src/$subdir/z/$f > tmp.svelte
	sed "s/\.\/z\//\.\.\/z\//g" < tmp.svelte > src/routes/z/$f
done

npm install
npm audit fix
npm run build

sudo echo rm -R $dir
sudo mkdir -p $dir
sudo cp -R build/* $dir

echo "Commiting version entre client/server"
echo "{ \"name\": \"clientVersion\", \"version\": \"$version\" }" > $datastore/clientVersion.object

echo "${urlApi}/adminTest/forceClientVersion?u=&p="
curl "$urlApi/adminTest/forceClientVersion?u=&p="
echo 
echo Done

