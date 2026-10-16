$playerDir = 'C:\Users\HP\.gemini\antigravity\scratch\not-dead-yet\assets\player'
$jsFile = 'C:\Users\HP\.gemini\antigravity\scratch\not-dead-yet\assets\player_sprites.js'

$sb = New-Object System.Text.StringBuilder
$sb.AppendLine("// Auto-generated embedded base64 player sprite frames") | Out-Null
$sb.AppendLine("const PLAYER_FRAMES = {") | Out-Null

function Append-Category($name, $count) {
    $sb.AppendLine("  $($name): [") | Out-Null
    for ($i = 0; $i -lt $count; $i++) {
        $p = Join-Path $playerDir "$($name)_$i.png"
        if (Test-Path $p) {
            $bytes = [System.IO.File]::ReadAllBytes($p)
            $b64 = [System.Convert]::ToBase64String($bytes)
            $comma = if ($i -lt ($count - 1)) { "," } else { "" }
            $sb.AppendLine("    'data:image/png;base64,$b64'$comma") | Out-Null
        }
    }
    $sb.AppendLine("  ],") | Out-Null
}

Append-Category "idle" 4
Append-Category "run" 6
Append-Category "hit" 4
Append-Category "hurt" 4

$sb.AppendLine("};") | Out-Null

[System.IO.File]::WriteAllText($jsFile, $sb.ToString())
Write-Host "Generated player_sprites.js successfully! File size: $( (Get-Item $jsFile).Length ) bytes"
