Add-Type -AssemblyName System.Drawing

$dest = 'C:\Users\HP\.gemini\antigravity\scratch\not-dead-yet\assets\player_spritesheet.png'
$bmp = [System.Drawing.Bitmap]::FromFile($dest)
$w = $bmp.Width
$h = $bmp.Height

# Measure non-transparent pixel row coverage
$rowAlpha = New-Object int[] $h
for ($y = 0; $y -lt $h; $y++) {
    $count = 0
    for ($x = 0; $x -lt $w; $x++) {
        if ($bmp.GetPixel($x, $y).A -gt 30) {
            $count++
        }
    }
    $rowAlpha[$y] = $count
}

# Group into vertical active bands
$inBand = $false
$start = 0
for ($y = 0; $y -lt $h; $y++) {
    if (-not $inBand -and $rowAlpha[$y] -gt 20) {
        $inBand = $true
        $start = $y
    } elseif ($inBand -and $rowAlpha[$y] -le 20) {
        $inBand = $false
        Write-Host "Row Band: Y=$start to Y=$($y-1) (Height: $($y - $start))"
    }
}
if ($inBand) {
    Write-Host "Row Band: Y=$start to Y=$($h-1) (Height: $($h - $start))"
}

$bmp.Dispose()
