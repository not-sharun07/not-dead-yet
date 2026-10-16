$src = 'C:\Users\HP\.gemini\antigravity\brain\4d170cde-0b43-44cd-99f0-3f10053e5041\.user_uploaded\media_1792141438350_43cd69d6.jpg'
$assetsDir = 'C:\Users\HP\.gemini\antigravity\scratch\not-dead-yet\assets'
$dest = Join-Path $assetsDir "main_menu_bg.jpg"

Copy-Item $src $dest -Force
Write-Host "Copied image to $dest (Size: $( (Get-Item $dest).Length ) bytes)"

# Also update env_sprites.js to include mainMenuBg in base64
$outFile = Join-Path $assetsDir "env_sprites.js"
$floorB64 = [System.Convert]::ToBase64String([System.IO.File]::ReadAllBytes((Join-Path $assetsDir "floor_tile.png")))
$deskB64 = [System.Convert]::ToBase64String([System.IO.File]::ReadAllBytes((Join-Path $assetsDir "desk_top.png")))
$doorB64 = [System.Convert]::ToBase64String([System.IO.File]::ReadAllBytes((Join-Path $assetsDir "door_texture.png")))
$bg1B64 = [System.Convert]::ToBase64String([System.IO.File]::ReadAllBytes((Join-Path $assetsDir "classroom_bg1.jpg")))
$bg2B64 = [System.Convert]::ToBase64String([System.IO.File]::ReadAllBytes((Join-Path $assetsDir "classroom_bg2.jpg")))
$menuB64 = [System.Convert]::ToBase64String([System.IO.File]::ReadAllBytes($dest))

$content = @"
// Auto-generated embedded environment texture assets
const ENV_ASSETS = {
  floorTile: 'data:image/png;base64,$floorB64',
  deskTop: 'data:image/png;base64,$deskB64',
  doorTexture: 'data:image/png;base64,$doorB64',
  classroomBg1: 'data:image/jpeg;base64,$bg1B64',
  classroomBg2: 'data:image/jpeg;base64,$bg2B64',
  mainMenuBg: 'data:image/jpeg;base64,$menuB64'
};
"@

[System.IO.File]::WriteAllText($outFile, $content)
Write-Host "Updated env_sprites.js with mainMenuBg! Total Size: $( (Get-Item $outFile).Length ) bytes"
