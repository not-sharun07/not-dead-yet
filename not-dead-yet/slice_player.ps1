Add-Type -AssemblyName System.Drawing

$src = 'C:\Users\HP\.gemini\antigravity\scratch\not-dead-yet\assets\player_spritesheet.png'
$outDir = 'C:\Users\HP\.gemini\antigravity\scratch\not-dead-yet\assets\player'
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force }

$bmp = [System.Drawing.Bitmap]::FromFile($src)
$w = $bmp.Width
$h = $bmp.Height

function Extract-Frames($name, $topY, $bottomY, $frameCount) {
    Write-Host "Extracting $name from Y=$topY to Y=$bottomY ($frameCount frames)..."
    # Find active columns in this Y range
    $colAlpha = New-Object int[] $w
    for ($x = 0; $x -lt $w; $x++) {
        $count = 0
        for ($y = $topY; $y -le $bottomY; $y++) {
            if ($bmp.GetPixel($x, $y).A -gt 30) { $count++ }
        }
        $colAlpha[$x] = $count
    }

    # Find column bounding boxes
    $inChar = $false
    $startCol = 0
    $frames = @()
    for ($x = 0; $x -lt $w; $x++) {
        if (-not $inChar -and $colAlpha[$x] -gt 5) {
            $inChar = $true
            $startCol = $x
        } elseif ($inChar -and $colAlpha[$x] -le 5) {
            $inChar = $false
            if (($x - $startCol) -gt 25) {
                $frames += @{ Left = $startCol; Right = ($x - 1) }
            }
        }
    }
    if ($inChar -and ($w - $startCol) -gt 25) {
        $frames += @{ Left = $startCol; Right = ($w - 1) }
    }

    Write-Host "Found $($frames.Count) character blocks for $name"
    for ($i = 0; $i -lt $frames.Count; $i++) {
        $fl = $frames[$i].Left
        $fr = $frames[$i].Right
        $fw = $fr - $fl + 1
        $fh = $bottomY - $topY + 1

        $frameBmp = New-Object System.Drawing.Bitmap($fw, $fh, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $g = [System.Drawing.Graphics]::FromImage($frameBmp)
        $destRect = New-Object System.Drawing.Rectangle(0, 0, $fw, $fh)
        $srcRect = New-Object System.Drawing.Rectangle($fl, $topY, $fw, $fh)
        $g.DrawImage($bmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
        $g.Dispose()

        $filePath = Join-Path $outDir "$($name)_$i.png"
        $frameBmp.Save($filePath, [System.Drawing.Imaging.ImageFormat]::Png)
        $frameBmp.Dispose()
        Write-Host "Saved: $filePath (Size: $fw x $fh)"
    }
}

# Row 1: IDLE (Y=43 to 238)
Extract-Frames "idle" 43 238 4

# Row 2: RUN (Y=271 to 416)
Extract-Frames "run" 271 416 6

# Row 4: HIT / ATTACK (Y=664 to 813)
Extract-Frames "hit" 664 813 4

# Row 5: DAMAGED (Y=850 to 1005)
Extract-Frames "hurt" 850 1005 3

$bmp.Dispose()
Write-Host "Sprite extraction complete!"
