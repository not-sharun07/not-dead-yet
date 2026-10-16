function Test-FileSyntax($path) {
    $content = Get-Content -Raw -Path $path
    $ob = ($content.ToCharArray() | Where-Object { $_ -eq '{' }).Count
    $cb = ($content.ToCharArray() | Where-Object { $_ -eq '}' }).Count
    $op = ($content.ToCharArray() | Where-Object { $_ -eq '(' }).Count
    $cp = ($content.ToCharArray() | Where-Object { $_ -eq ')' }).Count
    $obk = ($content.ToCharArray() | Where-Object { $_ -eq '[' }).Count
    $cbk = ($content.ToCharArray() | Where-Object { $_ -eq ']' }).Count

    Write-Host "File $path :"
    Write-Host "  Braces {}: $ob / $cb"
    Write-Host "  Parens (): $op / $cp"
    Write-Host "  Brackets []: $obk / $cbk"

    if ($ob -eq $cb -and $op -eq $cp -and $obk -eq $cbk) {
        Write-Host "  PASS: DELIMITERS BALANCED" -ForegroundColor Green
    } else {
        Write-Host "  FAIL: MISMATCH" -ForegroundColor Red
    }
}

Test-FileSyntax "game.js"
Test-FileSyntax "assets\player_sprites.js"
