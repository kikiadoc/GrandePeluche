# D:\BUG\compare.ps1

function CheckIntegrite {
	param ($file1, $fileName)
	# uniquement si le fichier existe
	if (-not (Test-Path -Path $file1) ) { return }
	$corrupt=0
	if ( $file1.IndexOf(".mp4") -gt 0 ) {
		echo "Verification structure mp4 $file1"
		ffmpeg.exe -v error -i $file1 -f null - -xerror 2>stderr.txt
		$corrupt = $LastExitCode
	}
	if ( ($file1.IndexOf(".png") -gt 0) -or ($file1.IndexOf(".jpg") -gt 0) -or ($file1.IndexOf(".jpeg") -gt 0) -or ($file1.IndexOf(".gif") -gt 0) ) {
		echo "Verification structure image $file1"
		& "C:\Program Files\ImageMagick-7.1.1-Q16-HDRI\magick.exe" $file1 .\imgCheck\pipo.bmp
		$corrupt = $LastExitCode
	}
	# echo "last $LastExitCode"
	if ($corrupt -ne 0) {
		echo "CORRUPT: $file1"
		Add-Content -Path .\fileCorrupt.txt -Value "Corruption dans $file1 $LastExitCode"
		Add-Content -Path .\ffmpegerror.txt -Value "FILE: $file1 $LastExitCode ***************************************************************************"
		cat stderr.txt >> .\ffmpegerror.txt
		Add-Content -Path .\fileReport.txt -Value "$fileName @@ Corruption dans $file1 $LastExitCode"
	}
	else {
		echo "Integre: $file1"
	}
}
function CheckDifference {
	param ($file1, $file2, $fileName)
	if (-not (Test-Path -Path $file1)) {
		echo "Missing: $file1"
		Add-Content -Path .\fileNotFound.txt -Value "$file1"
		return
	}
	if (-not (Test-Path -Path $file2)) {
		echo "Missing: $file2"
		Add-Content -Path .\fileNotFound.txt -Value "$file2"
		return
	}
	echo "compare:$file1 $file2"
	fc.exe /B $file1 $file2 2> stderr.txt | Out-null
	# Write-Output 'Rc' $LastExitCode
	# cat stderr.txt
	switch ($LastExitCode) {
		0 { Add-Content -Path .\fileOk.txt -Value "ok sur $file1 $file2"
		}
		1 { Add-Content -Path .\fileDiff.txt -Value "diff sur $file1 $file2"
				Add-Content -Path .\fileReport.txt -Value "$fileName @@ diff error $file1 $file2"
		}
		2 { Add-Content -Path .\fileError.txt -Value "error sur $file1 $file2"
				Add-Content -Path .\fileError.txt -Value (Get-Content -Path stderr.txt)
				Add-Content -Path .\fileReport.txt -Value "$fileName @@ fileCompare error $file1 $file2"
		}
	}
}
function ComparaisonFichierSync {
	param ($fileName)
	$file1="P:\\Public Folder\\$VOLD\\$fileName"
	$file2="P:\\Public Folder\\$VNEW\\$fileName"
	CheckDifference $file1 $file2 $fileName
	CheckIntegrite $file1 $fileName
	CheckIntegrite $file2 $fileName
}
function ComparaisonFichierREF {
	param ($fileName)
	$file1="P:\\Public Folder\\$VNEW\\$fileName"
	$file2=".\refFetch\$fileName"
	$fileUrl=$fileName -replace "\\","/"
	$url="https://filedn.eu/lxYwBeV7fws8lvi48b3a3TH/$VNEW/$fileUrl" 
	echo "url: $fileName $url"
	curl -k --create-dirs -o $file2 $url | Out-null
	CheckDifference $file1 $file2 $fileName
	CheckIntegrite $file2 $fileName
}
function ComparaisonFichierCDN {
	param ($fileName)
	$file1="P:\\Public Folder\\$VNEW\\$fileName"
	$file2=".\cdnFetch\$fileName"
	$fileUrl=$fileName -replace "\\","/"
	$url="https://cdn.adhoc.click/$VNEW/$fileUrl" 
	echo "url: $fileName $url"
	curl -k --create-dirs -o $file2 $url | Out-null
	CheckDifference $file1 $file2 $fileName
	CheckIntegrite $file2 $fileName
}

cd D:\BUG
New-Item ./fileList.txt -ItemType File -Force
New-Item ./fileOk.txt -ItemType File -Force
New-Item ./fileDiff.txt -ItemType File -Force
New-Item ./fileError.txt -ItemType File -Force
New-Item ./fileCorrupt.txt -ItemType File -Force
New-Item ./fileNotFound.txt -ItemType File -Force
New-Item ./fileReport.txt -ItemType File -Force
New-Item ./ffmpegerror.txt -ItemType File -Force
Remove-Item -Path .\refFetch -Recurse
New-Item -Path .\refFetch -ItemType Directory
Remove-Item -Path .\cdnFetch -Recurse
New-Item -Path .\cdnFetch -ItemType Directory
Remove-Item -Path .\imgCheck -Recurse
New-Item -Path .\imgCheck -ItemType Directory

$Global:VOLD="V10"
$Global:VNEW="V10a"


echo "recupération de la liste des fichiers de $VOLD"
Get-ChildItem -Recurse -Path "P:\Public Folder\$VOLD" | Where { ! $_.PSIsContainer } | Select -Expand FullName | Out-File "D:\BUG\fileList.txt"

echo "Recuperation des fileName"
((Get-Content -Path "D:\BUG\fileList.txt") -replace "P:\\Public Folder\\$VOLD\\",'') | Set-Content -Path "D:\BUG\fileName.txt"

# echo "Diff/intégrité en local, en ref et sur le CDN"
# Get-Content -Path D:\BUG\fileName.txt | ForEach-Object { ComparaisonFichierSync "$_"; ComparaisonFichierREF "$_"; ComparaisonFichierCDN "$_" }

# echo "Diff/intégrité en local"
Get-Content -Path D:\BUG\fileName.txt | ForEach-Object { ComparaisonFichierSync "$_" }

# test unitaire (debug)
# Get-Content -Path D:\BUG\fileName.txt | ForEach-Object { ComparaisonFichierSync "$_" }
# ComparaisonFichierSync "Aaaa.png"
# CheckIntegrite "P:\\Public Folder\\$VOLD\\ff-6-cristal.mp4" "ff-6-cristal.mp4"
# CheckIntegrite "P:\\Public Folder\\$VNEW\\ff-6-cristal.mp4" "ff-6-cristal.mp4"
# ComparaisonFichierCDN "ff-7\ff-7-alan-decryptage.mp4"
# ComparaisonFichierCDN "ff-6-cristal.mp4"

echo "Analyse terminée résultat dans fileFinalReport.txt"
Get-Content .\fileReport.txt | Sort-Object | Out-File -FilePath .\fileFinalReport.txt


