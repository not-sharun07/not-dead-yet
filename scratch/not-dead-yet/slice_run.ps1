Add-Type -AssemblyName System.Drawing

$src = 'C:\Users\HP\.gemini\antigravity\scratch\not-dead-yet\assets\player_spritesheet.png'
$outDir = 'C:\Users\HP\.gemini\antigravity\scratch\not-dead-yet\assets\player'
$bmp = [System.Drawing.Bitmap]::FromFile($src)
$topY = 265
$bottomY = 416
$fh = $bottomY - $topY + 1

# Slice 6 run frames evenly across 575 width
$frameWidth = 575 / 6.0
for ($i = 0; $i -lt 6; $i++) {
    $fl = [int]($i * $frameWidth)
    $fr = [int](($i + 1) * $frameWidth) - 1
    $fw = $fr - $fl + 1

    $frameBmp = New-Object System.Drawing.Bitmap($fw, $fh, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($frameBmp)
    $destRect = New-Object System.Drawing.Rectangle(0, 0, $fw, $fh)
    $srcRect = New-Object System.Drawing.Rectangle($fl, $topY, $fw, $fh)
    $g.DrawImage($bmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()

    $filePath = Join-Path $outDir "run_$i.png"
    $frameBmp.Save($filePath, [System.Drawing.Imaging.ImageFormat]::Png)
    $frameBmp.Dispose()
    Write-Host "Re-sliced: $filePath ($fw x $fh)"
}

$bmp.Dispose()
