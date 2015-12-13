@echo off
cls

cd dist
set NODE_ENV=development
rem set NODE_ENV=production
node.exe index.js %*
cd ..

rem start node.exe --debug index.js
rem node-inspector.cmd

pause
