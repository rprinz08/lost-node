@echo off
cls

if not exist dist\data ( mkdir dist\data )

mongodb\bin\mongod.exe --config mongodb\mongo.cfg

pause
