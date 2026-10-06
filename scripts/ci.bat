@echo off
setlocal
node "%~dp0ci.mjs" %*
exit /b %errorlevel%
