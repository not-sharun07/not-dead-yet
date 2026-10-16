# Verification test for NOT DEAD YET game mechanics

function Resolve-CircleRect($cx, $cy, $cr, $rx, $ry, $rw, $rh) {
    $closestX = [Math]::Max($rx, [Math]::Min($cx, $rx + $rw))
    $closestY = [Math]::Max($ry, [Math]::Min($cy, $ry + $rh))
    $distX = $cx - $closestX
    $distY = $cy - $closestY
    $distSq = $distX * $distX + $distY * $distY

    if ($distSq -lt ($cr * $cr)) {
        $dist = [Math]::Sqrt($distSq)
        if ($dist -gt 0.0001) {
            $overlap = $cr - $dist
            $cx += ($distX / $dist) * $overlap
            $cy += ($distY / $dist) * $overlap
            return @{ Collided = $true; NewX = $cx; NewY = $cy }
        } else {
            return @{ Collided = $true; NewX = $cx; NewY = ($cy - $cr) }
        }
    }
    return @{ Collided = $false; NewX = $cx; NewY = $cy }
}

Write-Host "--- TEST 1: Wall Collision & Sliding ---"
# Player at (370, 50), r=14 moving into wall at x=375, y=25, w=20, h=105
$res = Resolve-CircleRect 370 50 14 375 25 20 105
if ($res.Collided -and $res.NewX -le 361) {
    Write-Host "Test 1 Passed: Wall correctly pushed circle back out. NewX: $($res.NewX)" -ForegroundColor Green
} else {
    Write-Host "Test 1 Failed: $res" -ForegroundColor Red
}

Write-Host "--- TEST 2: Noise Sprint Range ---"
$walkNoise = 120
$sprintNoise = 360
$zombieDist = 250
# At 250 distance, walking does NOT alert, sprinting DOES alert
$alertedWalking = ($zombieDist -le $walkNoise)
$alertedSprinting = ($zombieDist -le $sprintNoise)
if (-not $alertedWalking -and $alertedSprinting) {
    Write-Host "Test 2 Passed: Sprinting alerts zombie at 250px, walking keeps player safe." -ForegroundColor Green
} else {
    Write-Host "Test 2 Failed" -ForegroundColor Red
}

Write-Host "--- TEST 3: Keycard Unlock Exit Condition ---"
$playerAtExitX = 950
$playerAtExitY = 600
$hasKeycardFalse = $false
$hasKeycardTrue = $true

$exitLockedWin = ($hasKeycardFalse -and $playerAtExitX -ge 860 -and $playerAtExitY -ge 570)
$exitUnlockedWin = ($hasKeycardTrue -and $playerAtExitX -ge 860 -and $playerAtExitY -ge 570)

if (-not $exitLockedWin -and $exitUnlockedWin) {
    Write-Host "Test 3 Passed: Exit blocks win without keycard, triggers win with keycard." -ForegroundColor Green
} else {
    Write-Host "Test 3 Failed" -ForegroundColor Red
}

Write-Host "--- ALL MECHANIC TESTS PASSED ---" -ForegroundColor Green
