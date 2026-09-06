@echo off
REM Start server in a new CMD window, wait for port 3000, then open browser
cd /d "%~dp0"

REM Start server in new window
start "CareFlow Server" cmd /k "npm.cmd start"

echo Waiting up to 60 seconds for server to listen on port 3000...
set /a COUNT=0
:WAITLOOP
timeout /t 1 >nul
netstat -ano | findstr ":3000" >nul
if %errorlevel%==0 goto OPEN
set /a COUNT+=1
if %COUNT% GEQ 60 (
  echo Timeout waiting for server. You can open http://localhost:3000 manually.
  goto END
)
goto WAITLOOP

:OPEN
echo Server appears to be listening. Opening browser...
start "" "http://localhost:3000"

:END
exit /B 0
