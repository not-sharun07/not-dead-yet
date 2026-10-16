Add-Type -AssemblyName System.Drawing

$assetsDir = 'C:\Users\HP\.gemini\antigravity\scratch\not-dead-yet\assets'
if (-not (Test-Path $assetsDir)) { New-Item -ItemType Directory -Path $assetsDir -Force }

$img1Path = 'C:\Users\HP\.gemini\antigravity\brain\4d170cde-0b43-44cd-99f0-3f10053e5041\.user_uploaded\media_1792139733748_cc9a9ebd.jpg'
$img2Path = 'C:\Users\HP\.gemini\antigravity\brain\4d170cde-0b43-44cd-99f0-3f10053e5041\.user_uploaded\media_1792139735766_6bb077d9.jpg'
$img3Path = 'C:\Users\HP\.gemini\antigravity\brain\4d170cde-0b43-44cd-99f0-3f10053e5041\.user_uploaded\media_1792139745468_5ba8ef9e.png'

# 1. Copy full resolution background photos
Copy-Item -Path $img1Path -Destination (Join-Path $assetsDir "classroom_bg1.jpg") -Force
Copy-Item -Path $img2Path -Destination (Join-Path $assetsDir "classroom_bg2.jpg") -Force
Copy-Item -Path $img3Path -Destination (Join-Path $assetsDir "floor_tile.png") -Force

Write-Host "Copied base image files to assets directory."

# 2. Crop realistic desk texture from Img1 (table surface)
$bmp1 = [System.Drawing.Bitmap]::FromFile($img1Path)
# Desk top in foreground: roughly x: 310, y: 740, w: 540, h: 180 in img1
$deskCrop = New-Object System.Drawing.Bitmap(200, 80, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($deskCrop)
$destRect = New-Object System.Drawing.Rectangle(0, 0, 200, 80)
$srcRect = New-Object System.Drawing.Rectangle(320, 750, 480, 160)
$g.DrawImage($bmp1, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()
$deskCrop.Save((Join-Path $assetsDir "desk_top.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$deskCrop.Dispose()

# 3. Crop classroom door texture from Img1 (black heavy door on the left: x: 0..110, y: 155..680)
$doorCrop = New-Object System.Drawing.Bitmap(60, 140, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g2 = [System.Drawing.Graphics]::FromImage($doorCrop)
$destRect2 = New-Object System.Drawing.Rectangle(0, 0, 60, 140)
$srcRect2 = New-Object System.Drawing.Rectangle(5, 160, 105, 520)
$g2.DrawImage($bmp1, $destRect2, $srcRect2, [System.Drawing.GraphicsUnit]::Pixel)
$g2.Dispose()
$doorCrop.Save((Join-Path $assetsDir "door_texture.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$doorCrop.Dispose()

$bmp1.Dispose()
Write-Host "Successfully generated environment textures: floor_tile.png, desk_top.png, door_texture.png, classroom_bg1.jpg, classroom_bg2.jpg"
