param([Parameter(Mandatory=$true)][string]$Directory)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$manifest=Get-Content -LiteralPath (Join-Path $Directory 'manifest.json') -Raw | ConvertFrom-Json
foreach($file in $manifest){
    $path=Join-Path $Directory $file.file
    if((Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLower() -ne $file.sha256){throw "Hash mismatch: $path"}
}
foreach($kind in @('plugin','theme')){
    $zip=[IO.Compression.ZipFile]::OpenRead((Join-Path $Directory "art-alexis-$kind.zip"))
    try{
        $names=@($zip.Entries | ForEach-Object {$_.FullName})
        foreach($name in $names){if($name.Contains('\')){throw "Non-portable ZIP path: $name"}}
        $required=if($kind -eq 'plugin'){'art-alexis/art-alexis.php'}else{'art-alexis/style.css'}
        if($names -notcontains $required){throw "Missing entry: $required"}
        foreach($name in $names){
            if(!$name.StartsWith('art-alexis/') -or $name.Contains('..') -or $name -match '(?i)(seed/|uploads/|\.env|\.(jpg|jpeg|png|webp|sql|key|pem|zip)$)'){throw "Unexpected entry: $name"}
        }
        Write-Output "PASS $kind ZIP ($($names.Count) entries)"
    }finally{$zip.Dispose()}
}
$imageZip=Join-Path $Directory 'initial-artwork.zip'
if(Test-Path -LiteralPath $imageZip){
    $zip=[IO.Compression.ZipFile]::OpenRead($imageZip)
    try{
        $expected=@('early-explorations.jpg','finding-my-style.jpg','creative-experiments.jpg','current-works.jpg')
        if($zip.Entries.Count -ne 4){throw 'Expected four initial images'}
        foreach($entry in $zip.Entries){if($expected -notcontains $entry.FullName){throw 'Unexpected initial image'}}
        Write-Output 'PASS private initial artwork ZIP (4 images; not a database backup)'
    }finally{$zip.Dispose()}
}
Write-Output 'PASS archive checksums'
