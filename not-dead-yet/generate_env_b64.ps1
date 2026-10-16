$assetsDir = 'C:\Users\HP\.gemini\antigravity\scratch\not-dead-yet\assets'
$outFile = Join-Path $assetsDir "env_sprites.js"

$floorB64 = [System.Convert]::ToBase64String([System.IO.File]::ReadAllBytes((Join-Path $assetsDir "floor_tile.png")))
$deskB64 = [System.Convert]::ToBase64String([System.IO.File]::ReadAllBytes((Join-Path $assetsDir "desk_top.png")))
$doorB64 = [System.Convert]::ToBase64String([System.IO.File]::ReadAllBytes((Join-Path $assetsDir "door_texture.png")))
$bg1B64 = [System.Convert]::ToBase64String([System.IO.File]::ReadAllBytes((Join-Path $assetsDir "classroom_bg1.jpg")))
$bg2B64 = [System.Convert]::ToBase64String([System.IO.File]::ReadAllBytes((Join-Path $assetsDir "classroom_bg2.jpg")))

$content = @"
// Auto-generated embedded environment texture assets
const ENV_ASSETS = {
  floorTile: 'data:image/png;base64,$floorB64',
  deskTop: 'data:image/png;base64,$deskB64',
  doorTexture: 'data:image/png;base64,$doorB64',
  classroomBg1: 'data:image/jpeg;base64,$bg1B64',
  classroomBg2: 'data:image/jpeg;base64,$bg2B64'
};
"@

[System.IO.File]::WriteAllText($outFile, $content)
Write-Host "Generated complete env_sprites.js successfully! Size: $( (Get-Item $outFile).Length ) bytes"
