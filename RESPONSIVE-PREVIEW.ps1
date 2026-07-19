$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
node .\tools\responsive-preview\server.mjs --open
