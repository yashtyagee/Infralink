$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot\backend2\backend2\entitynet-backend
$env:PYTHONPATH = "..\venv\Lib\site-packages"
py -3.12 run.py
