param([switch]$IncludeInitialArtwork)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression
function New-PortableCodeZip([string]$Source, [string]$Destination) {
    $root = (Get-Item -LiteralPath $Source).FullName.TrimEnd('\','/')
    $archive = [IO.Compression.ZipFile]::Open($Destination, [IO.Compression.ZipArchiveMode]::Create)
    try {
        foreach ($file in Get-ChildItem -LiteralPath $root -File -Recurse) {
            $relative = $file.FullName.Substring($root.Length + 1).Replace('\','/')
            [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $file.FullName, ('art-alexis/' + $relative), [IO.Compression.CompressionLevel]::Optimal) | Out-Null
        }
    } finally { $archive.Dispose() }
}
$projectRoot = Split-Path -Parent $PSScriptRoot
Push-Location $projectRoot
try {
    $buildOutput = & node tools/release.mjs 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Release failed: $buildOutput" }
    $releaseLine = @($buildOutput | Where-Object { "$_" -like 'Private-image-free release: *' })
    if ($releaseLine.Count -ne 1) { throw 'Cannot identify release output.' }
    $releaseDir = ("$($releaseLine[0])").Substring('Private-image-free release: '.Length)
    $destination = Join-Path $PSScriptRoot ('dist/' + [guid]::NewGuid().ToString())
    New-Item -ItemType Directory -Path $destination | Out-Null
    New-PortableCodeZip -Source (Join-Path $releaseDir 'plugins/art-alexis') -Destination (Join-Path $destination 'art-alexis-plugin.zip')
    New-PortableCodeZip -Source (Join-Path $releaseDir 'themes/art-alexis') -Destination (Join-Path $destination 'art-alexis-theme.zip')
    if ($IncludeInitialArtwork) {
        $sourceDir = Join-Path $projectRoot 'wordpress/plugins/art-alexis/seed'
        $names = @('early-explorations','finding-my-style','creative-experiments','current-works')
        $paths = @($names | ForEach-Object { Join-Path $sourceDir ($_.ToString()+'.jpg') })
        foreach ($path in $paths) { if (!(Test-Path -LiteralPath $path -PathType Leaf)) { throw "Missing initial artwork: $path (incomplete output retained)" } }
        Compress-Archive -LiteralPath $paths -DestinationPath (Join-Path $destination 'initial-artwork.zip')
    }
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'README.md') -Destination (Join-Path $destination 'README.md')
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'VERIFICATION.md') -Destination (Join-Path $destination 'VERIFICATION.md')
    $manifest = @(Get-ChildItem -LiteralPath $destination -File | ForEach-Object {
        @{file=$_.Name; bytes=$_.Length; sha256=(Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLower()}
    })
    $manifest | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $destination 'manifest.json') -Encoding UTF8
    & (Join-Path $PSScriptRoot 'verify-package.ps1') -Directory $destination
    & node (Join-Path $PSScriptRoot 'check-zip.mjs') $destination
    if ($LASTEXITCODE -ne 0) { throw 'PHP ZIP extraction verification failed; do not upload this output.' }
    Write-Output "Managed package: $destination"
} finally { Pop-Location }
