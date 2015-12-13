@echo off
cls

rem This creates client proxies for LoST objects exposed via
rem oData interface using Jaydata

.\JaySvcUtil.exe ^
	--metadataUri http://localhost:8080/lost.data.svc/$metadata ^
	--userName admin --password admin ^
	--namespace Lost ^
	--out odata.entities.js

pause
