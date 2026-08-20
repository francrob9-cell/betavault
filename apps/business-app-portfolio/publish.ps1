param(
  [Parameter(Mandatory = $true)]
  [string]$BucketName
)

$ErrorActionPreference = "Stop"
$gcloud = "C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
$siteRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$bucket = "gs://$BucketName"

if (-not (Test-Path -LiteralPath $gcloud)) {
  throw "Google Cloud CLI was not found at $gcloud"
}

& $gcloud storage rsync --recursive $siteRoot $bucket
