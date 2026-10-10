# Empacota www/ para o itch.io: index.html na raiz do zip, caminhos com "/".
#
# Nao usa Compress-Archive de proposito: no PowerShell 5.1 ele grava os
# caminhos com barra invertida (css\style.css) e alguns descompactadores
# rejeitam. ZipArchive deixa escolher o nome de cada entrada.

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$raiz = Split-Path -Parent $PSScriptRoot
$src  = Join-Path $raiz 'www'
$dist = Join-Path $raiz 'dist'
$zip  = Join-Path $dist 'ichien-web.zip'

if (-not (Test-Path $src)) { throw "nao achei $src" }
if (-not (Test-Path $dist)) { New-Item -ItemType Directory $dist | Out-Null }
if (Test-Path $zip) { Remove-Item $zip -Force }

$fs = [System.IO.File]::Open($zip, 'Create')
$ar = New-Object System.IO.Compression.ZipArchive($fs, 'Create')
try {
  Get-ChildItem $src -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($src.Length + 1).Replace('\', '/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
      $ar, $_.FullName, $rel, 'Optimal') | Out-Null
    Write-Host "  + $rel"
  }
} finally {
  $ar.Dispose(); $fs.Dispose()
}

# confere o que o itch.io exige: index.html na raiz
$r = [System.IO.Compression.ZipFile]::OpenRead($zip)
$ok = ($r.Entries | Where-Object { $_.FullName -eq 'index.html' }).Count -eq 1
$r.Dispose()
if (-not $ok) { throw 'index.html nao ficou na raiz do zip' }

Write-Host ("`n{0}  ({1:N1} KB)  index.html na raiz: ok" -f $zip, ((Get-Item $zip).Length / 1KB))
