@echo off
title NOT DEAD YET - Standalone Game Launcher
echo ===================================================
echo           NOT DEAD YET: ZOMBIE SURVIVAL
echo ===================================================
echo Launching standalone desktop game window...
start msedge --app="file:///%~dp0index.html"
if %errorlevel% neq 0 (
    start "" "%~dp0index.html"
)
exit
