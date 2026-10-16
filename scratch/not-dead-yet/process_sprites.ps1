Add-Type -AssemblyName System.Drawing

$src = 'C:\Users\HP\.gemini\antigravity\brain\4d170cde-0b43-44cd-99f0-3f10053e5041\.user_uploaded\media_1792085363392_78213644.jpg'
$dest = 'C:\Users\HP\.gemini\antigravity\scratch\not-dead-yet\assets\player_spritesheet.png'

$bmp = [System.Drawing.Bitmap]::FromFile($src)
$w = $bmp.Width
$h = $bmp.Height
Write-Host "Source Image Size: $w x $h"

# Top-left background pixel color
$bg = $bmp.GetPixel(5, 5)
Write-Host "Detected Background Color: R=$($bg.R), G=$($bg.G), B=$($bg.B)"

# Create transparent copy by keying out background color with tolerance
$outBmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$threshold = 28

for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
        $pixel = $bmp.GetPixel($x, $y)
        $diff = [Math]::Abs($pixel.R - $bg.R) + [Math]::Abs($pixel.G - $bg.G) + [Math]::Abs($pixel.B - $bg.B)
        if ($diff -lt $threshold) {
            $outBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } else {
            $outBmp.SetPixel($x, $y, $pixel)
        }
    }
}

$bmp.Dispose()
$outBmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
$outBmp.Dispose()

Write-Host "Successfully converted and saved transparent sprite sheet to: $dest"
