$ErrorActionPreference = 'Stop'

$configPath = Join-Path $PSScriptRoot 'whatsapp.config.json'
$htmlPath = Join-Path $PSScriptRoot 'index.html'
$config = Get-Content -Path $configPath -Raw -Encoding UTF8 | ConvertFrom-Json
$phoneNumber = [string]$config.phoneNumber
$message = [string]$config.message

if ($phoneNumber -notmatch '^\d{11,15}$') {
  throw 'whatsapp.config.json: phoneNumber debe contener de 11 a 15 dígitos, incluido el código de país.'
}
if ([string]::IsNullOrWhiteSpace($message)) {
  throw 'whatsapp.config.json: message no puede estar vacío.'
}

$phoneDisplay = if ($phoneNumber -match '^52\d{10}$') {
  '+52 ' + $phoneNumber.Substring(2, 3) + ' ' + $phoneNumber.Substring(5, 3) + ' ' + $phoneNumber.Substring(8, 4)
} else {
  '+' + $phoneNumber
}
$encodedMessage = [System.Uri]::EscapeDataString($message)
$whatsappAppUrl = 'whatsapp://send?phone={0}&text={1}' -f $phoneNumber, $encodedMessage
$whatsappWebUrl = 'https://wa.me/{0}?text={1}' -f $phoneNumber, $encodedMessage
$escapedWhatsappAppUrl = [System.Net.WebUtility]::HtmlEncode($whatsappAppUrl)
$escapedWhatsappWebUrl = [System.Net.WebUtility]::HtmlEncode($whatsappWebUrl)
$html = [System.IO.File]::ReadAllText($htmlPath, [System.Text.Encoding]::UTF8)

$linkPattern = '(<a\b(?=[^>]*\bdata-whatsapp-link\b)[^>]*\bhref=")[^"]*(")'
$linkMatches = [System.Text.RegularExpressions.Regex]::Matches($html, $linkPattern)
if ($linkMatches.Count -ne 2) {
  throw "Se esperaban 2 enlaces data-whatsapp-link en index.html; se encontraron $($linkMatches.Count)."
}
$linkEvaluator = [System.Text.RegularExpressions.MatchEvaluator]{
  param($match)
  return $match.Groups[1].Value + $escapedWhatsappWebUrl + $match.Groups[2].Value
}
$html = [System.Text.RegularExpressions.Regex]::Replace($html, $linkPattern, $linkEvaluator)

$appLinkPattern = '(<a\b(?=[^>]*\bdata-whatsapp-link\b)[^>]*\bdata-whatsapp-app=")[^"]*(")'
$appLinkMatches = [System.Text.RegularExpressions.Regex]::Matches($html, $appLinkPattern)
if ($appLinkMatches.Count -ne 2) {
  throw "Se esperaban 2 enlaces data-whatsapp-app en index.html; se encontraron $($appLinkMatches.Count)."
}
$appLinkEvaluator = [System.Text.RegularExpressions.MatchEvaluator]{
  param($match)
  return $match.Groups[1].Value + $escapedWhatsappAppUrl + $match.Groups[2].Value
}
$html = [System.Text.RegularExpressions.Regex]::Replace($html, $appLinkPattern, $appLinkEvaluator)

$phonePattern = '(<span\b(?=[^>]*\bdata-whatsapp-phone\b)[^>]*>)[^<]*(</span>)'
$phoneMatches = [System.Text.RegularExpressions.Regex]::Matches($html, $phonePattern)
if ($phoneMatches.Count -ne 1) {
  throw "Se esperaba 1 etiqueta data-whatsapp-phone en index.html; se encontraron $($phoneMatches.Count)."
}
$phoneEvaluator = [System.Text.RegularExpressions.MatchEvaluator]{
  param($match)
  return $match.Groups[1].Value + $phoneDisplay + $match.Groups[2].Value
}
$html = [System.Text.RegularExpressions.Regex]::Replace($html, $phonePattern, $phoneEvaluator)

$utf8WithoutBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($htmlPath, $html, $utf8WithoutBom)
Write-Output 'index.html actualizado desde whatsapp.config.json.'
