# D:\kikiPublish\publish.ps1
cd D:\kikiPublish

$DebugPreference = "SilentlyContinue"
# $DebugPreference = "Continue"

# versions des pools de médias
$Global:VER="V10a"
$Global:DIRSRC="D:\CDN\$VER"
$Global:DIRPUB="P:\Public Folder\$VER"
$Global:URLREF="https://filedn.eu/lxYwBeV7fws8lvi48b3a3TH/$VER"
$Global:URLCDN="https://cdn.adhoc.click/$VER"
$Global:DIRFETCH=".\FETCH"
$Global:DIRTMP=".\TMP"

# verif intégrité du fichier $dir\\$filename - si fail=1 exit
function CheckIntegrite {
	param ($dir, $fileName, $fail)
	$file1="$dir\$filename"
	Write-Debug "CheckIntegrite $file1 (fail=$fail)"
	# uniquement si le fichier existe
	if (-not (Test-Path -Path "$file1") ) { Write-Warning "introuvable $file1"; exit 10 }
	$corrupt=0
	if ( $file1.IndexOf(".mp4") -gt 0 ) {
		Write-Debug "Verification structure mp4 $file1"
		& "ffmpeg.exe" -v error -i $file1 -f null - -xerror 2> $DIRTMP/stderr.txt
		$corrupt = $LastExitCode
	}
	elseif ( $file1.IndexOf(".mp3") -gt 0 ) {
		Write-Debug "Verification structure mp3 $file1"
		# mpck renvoi toujours rc=1, donc grep du stdout
		# & ".\mpck-0.21.exe" -q "$file1"
		& ".\mpck-0.21.exe" -q "$file1" > $DIRTMP/stdout.txt
		if ((Select-String -Path "$DIRTMP/stdout.txt" -Pattern ": ok").LineNumber -eq 1) {
			$corrupt = 0
		}
		else {
			$corrupt = 1
		}
	}
	elseif ( ($file1.IndexOf(".png") -gt 0) -or ($file1.IndexOf(".jpg") -gt 0) -or ($file1.IndexOf(".jpeg") -gt 0) -or ($file1.IndexOf(".gif") -gt 0) ) {
		Write-Debug "Verification structure image $file1"
		& "C:\Program Files\ImageMagick-7.1.1-Q16-HDRI\magick.exe" $file1 $DIRTMP/pipo.bmp
		$corrupt = $LastExitCode
	}
	else {
		Write-Debug "Pas de test intégrité de $file1"
		return 0
	}
	# Write-Host "last $corrupt $LastExitCode"
	if ($corrupt -ne 0) {
		Write-Warning "CORRUPT: $file1"
		Add-Content -Path $DIRTMP/fileCorrupt.txt -Value "Corruption dans $file1 $corrupt"
		if ($fail -ne 0) { Write-Warning "exit"; exit 1 }
		return 1
	}
	else {
		# Write-Host "Integre: $file1"
		return 9
	}
}

# verifie que 2 fichiers sont identiques $dir1 $dir2 $ filename
function CheckDifference {
	param ($dir1, $dir2, $fileName, $fail)
	$file1 = "$dir1\$filename"
	$file2 = "$dir2\$filename"
	if (-not (Test-Path -Path $file1)) {
		Write-Warning "Missing: $file1"
		Add-Content -Path $DIRTMP/fileNotFound.txt -Value "$file1"
		if ($fail -ne 0) { Write-Warning "exit"; exit 1 }
	}
	if (-not (Test-Path -Path $file2)) {
		Write-Warning "Missing: $file2"
		Add-Content -Path $DIRTMP/fileNotFound.txt -Value "$file2"
		if ($fail -ne 0) { Write-Warning "exit"; exit 1 }
	}
	Write-Debug "compare:$file1 $file2"
	fc.exe /B $file1 $file2 2> $DIRTMP/stderr.txt | Out-null
	# Write-Output 'Rc' $LastExitCode
	# cat stderr.txt
	switch ($LastExitCode) {
		0 { Add-Content -Path $DIRTMP/fileOk.txt -Value "ok sur $file1 $file2"
				return
		}
		1 { Add-Content -Path $DIRTMP/fileDiff.txt -Value "diff sur $file1 $file2"
				Add-Content -Path $DIRTMP/fileReport.txt -Value "$fileName @@ diff error $file1 $file2"
				Write-Warning "diff sur $file1 $file2"
				if ($fail -ne 0) { Write-Warning "exit"; exit 1 }
		}
		2 { Add-Content -Path $DIRTMP/fileError.txt -Value "error sur $file1 $file2"
				Add-Content -Path $DIRTMP/fileError.txt -Value (Get-Content -Path $DIRTMP/stderr.txt)
				Add-Content -Path $DIRTMP/fileReport.txt -Value "$fileName @@ fileCompare error $file1 $file2"
				Write-Warning "error sur $file1 $file2"
				if ($fail -ne 0) { Write-Warning "exit"; exit 1 }
		}
	}
	if ($fail -ne 0) { Write-Warning "exit"; exit 1 }
}

# Verifie le timestamp de $filename entre $DIRSRC et $DIRPUB - ajoute le fichier dans $DIRTMP/fileOutdated.txt
function ComparaisonTimeStamp {
	param ($src,$dst,$fileName)
	# si non existant en cible, outdated!
	if (-not (Test-Path -Path "$dst\$fileName") ) { Write-Warning "MISSING $dst\$fileName";Add-Content -Path "$DIRTMP/fileOutdated.txt" -Value "$fileName"; return 0 }
	$dthSrc = ((Get-Item "$src\$filename").LastWriteTime | Get-Date -UFormat "%s")
	$dthDst = ((Get-Item "$dst\$filename").LastWriteTime | Get-Date -UFormat "%s")
	Write-Debug "Timestamp $fileName $dthSrc $dthDst"
	if ($dthSrc -gt $dthDst)  { Write-Warning "OUTDATED $fileName $dthSrc $dthDst"; Add-Content -Path "$DIRTMP/fileOutdated.txt" -Value "$fileName"; return 0 }
	return 1
}

# Verification et Publication d'un fichier $filename depuis $src vers $dst
function Publication {
	param ($src,$dst,$fileName)
	Write-Debug "Publication $fileName - $src vers $dst"
	CheckIntegrite "$src" "$fileName" 1 | Out-Null
	$dstDir= Split-Path -Path "$dst\$filename" -Parent
	Write-Debug "Create dir si besoin: $dstDir"
	if (!(Test-Path -PathType container $dstDir)) { Write-Host "Creation: $dstDir"; New-Item -ItemType Directory -Force -Path "$dstDir" }
	Write-Debug "Copy $src\$fileName $dst\$fileName"
	Copy-Item -Path "$src\$fileName" -Destination "$dst\$fileName"
	CheckDifference "$src" "$dst" "$filename" 1 | Out-Null
	CheckIntegrite "$dst" "$fileName" 1 | Out-Null
	$dthSrc = ((Get-Item "$src\$filename").LastWriteTime | Get-Date -UFormat "%s")
	$dthDst = ((Get-Item "$dst\$filename").LastWriteTime | Get-Date -UFormat "%s")
	$lenDst = (Get-Item "$dst\$filename").Length
	Write-Debug "Timestamp $fileName $dthSrc $dthDst"
	if ($dthSrc -gt $dthDst)  { Write-Warning "OUTDATED AFTER UPDATE $filename $dthSrc $dthDst"; exit }
	Write-Host "Publication OK: $fileName ($lenDst) - $src vers $dst"
}

function getFileName {
	param ($dir)
	Write-Debug "recupération de la liste des fichiers de $dir"
	Get-ChildItem -Recurse -Path "$dir" | Where { ! $_.PSIsContainer } | Select -Expand FullName | Out-File "$DIRTMP/fileList.txt"
	Write-Debug "Recuperation des fileName de $src"
	Get-Content -Path "$DIRTMP/fileList.txt" | ForEach-Object { "$_".Replace("$dir\","") } | Set-Content -Path "$DIRTMP/fileName.txt"
}
function CmpDir {
	param ($src,$dst)
	getFileName "$src"
	Write-Debug "Comparaison des fichiers + intégrité de $src / $dst"
	Get-Content -Path "$DIRTMP/fileName.txt" | ForEach-Object { Write-Host "CmpDir" "$_"; CheckDifference "$src" "$dst" "$_" 0; CheckIntegrite "$src" "$_" 0; CheckIntegrite "$dst" "$_" 0 } | Out-null
}

function FetchUrl {
	param ($urlDir,$filename)
	# Escape uri puis replace les "/" %5C --> "/"
	$fileEncode=[uri]::EscapeUriString($filename).replace("%5C", "/")
	$urlPath = "$urlDir/$fileEncode"
	Write-Debug "Fetch url: $urlPath"
	curl -s -k --create-dirs -o "$DIRFETCH/$filename" "$urlPath"
	if ($LastExitCode -ne 0) { Write-Warning "ERREUR Fetch url: $urlPath $LastExitCode" }
}

function CmpUrl {
	param ($src,$url)
	getFileName "$src"
	Write-Debug "Comparaison des fichiers + intégrité de $src / $url"
	Get-Content -Path "$DIRTMP/fileName.txt" | ForEach-Object { Write-Host "CmpUrl" "$_"; FetchUrl "$url" "$_"; CheckDifference "$src" "$DIRFETCH" "$_" 0; CheckIntegrite "$DIRFETCH" "$_" 0 } | Out-null
	
}

function SyncDir {
	param ($src,$dst)
	Write-Host "Calcul de synchro $src avec $dst"
	getFileName "$src"
	Write-Debug "Vérification des timestamps de $src / $dst"
	Get-Content -Path "$DIRTMP/fileName.txt" | ForEach-Object { ComparaisonTimeStamp "$src" "$dst" "$_" } | Out-null
	Write-Host "Synch files:"
	Get-Content -Path "$DIRTMP/fileOutdated.txt"
	Write-Debug "Publish files:"
	Get-Content -Path "$DIRTMP/fileOutdated.txt" | ForEach-Object { Publication "$src" "$dst" "$_" }
}

Write-Debug ("DEBUG MODE ACTIF")
Remove-Item -Path $DIRFETCH -Recurse  | Out-Null
New-Item -Path $DIRFETCH -ItemType Directory | Out-Null
Remove-Item -Path $DIRTMP -Recurse  | Out-Null
New-Item -Path $DIRTMP -ItemType Directory | Out-Null
New-Item $DIRTMP/fileOutdated.txt -ItemType File -Force | Out-Null
New-Item $DIRTMP/fileList.txt -ItemType File -Force | Out-Null
New-Item $DIRTMP/fileName.txt -ItemType File -Force | Out-Null
New-Item $DIRTMP/fileCorrupt.txt -ItemType File -Force | Out-Null


switch ($args[0]) {
	"sync" {
		# Sync les fichier de $DIRSRC avec $DIRPUB
		SyncDir "$DIRSRC" "$DIRPUB"
	}
	"checkDir" {
		# Comparaison des fichier de $DIRSRC avec $DIRPUB
		Write-Host "Comparaison/intégrité depuis $DIRSRC avec $DIRPUB"
		CmpDir "$DIRSRC" "$DIRPUB"
	}
	"checkRef" {
		# Comparaison des fichier de $DIRSRC vers $URLREF
		Write-Host "Comparaison/intégrité depuis $DIRSRC vers $URLREF"
		CmpUrl "$DIRSRC" "$URLREF"
	}
	"checkCdn" {
		# Comparaison des fichier de $DIRSRC vers $URLCDN
		Write-Host "Comparaison/intégrité depuis $DIRSRC vers $URLCDN"
		CmpUrl "$DIRSRC" "$URLCDN"
	}
	"cloneDir" {
		$pSrc = $args[1]
		$pDst = $args[2]
		$src = "D:\CDN\$pSrc"
		$dst = "D:\CDN\$pDst"
		if (-not (Test-Path -Path "$src")) { Write-Warning "Impossible, $src n'existe pas"; exit 1 }
		if (Test-Path -Path "$dst") { Write-Warning "Impossible, $dst existe deja"; exit 1 }
		$ok = Read-Host "ATTENTION: Taper oui pour confirmation de la copie de la reference $src vers $dst"
		if ($ok -ne "oui") { Write-Host "abandon"; exit 1 }
		# Sync les fichier de $DIROLD avec $DIRSRC
		SyncDir "$src" "$dst"
	}
	"test" {
		# FetchUrl "$URLREF" "restaurationDuTemps\Tuto2.png"
	}
	default {
		Write-Warning ("Mauvaise commande $args")
	}
}

