Add-Type -AssemblyName System.Drawing

$img1 = 'C:\Users\HP\.gemini\antigravity\brain\4d170cde-0b43-44cd-99f0-3f10053e5041\.user_uploaded\media_1792139733748_cc9a9ebd.jpg'
$img2 = 'C:\Users\HP\.gemini\antigravity\brain\4d170cde-0b43-44cd-99f0-3f10053e5041\.user_uploaded\media_1792139735766_6bb077d9.jpg'
$img3 = 'C:\Users\HP\.gemini\antigravity\brain\4d170cde-0b43-44cd-99f0-3f10053e5041\.user_uploaded\media_1792139745468_5ba8ef9e.png'

$b1 = [System.Drawing.Bitmap]::FromFile($img1)
$b2 = [System.Drawing.Bitmap]::FromFile($img2)
$b3 = [System.Drawing.Bitmap]::FromFile($img3)

Write-Host "Img1 (Classroom view 1): $($b1.Width) x $($b1.Height)"
Write-Host "Img2 (Classroom view 2): $($b2.Width) x $($b2.Height)"
Write-Host "Img3 (Floor texture / tile): $($b3.Width) x $($b3.Height)"

$b1.Dispose()
$b2.Dispose()
$b3.Dispose()
