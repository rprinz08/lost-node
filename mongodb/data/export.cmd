@echo off
cls

set HOST=
set DB=lost
set USER=
set PWD=

rem export Services
..\bin\mongoexport -h %HOST% -d %DB% -c SVCs ^
	-u %USER% -p %PWD% -o SVCs.csv --type=csv ^
	--fields=_id,ServiceID,Expires,LastUpdated,DisplayName,LanguageCode,URN,URIs,Numbers,Boundaries

rem export Service URIs
..\bin\mongoexport -h %HOST% -d %DB% -c ServiceURIs ^
	-u %USER% -p %PWD% -o ServiceURIs.csv --type=csv ^
	--fields=_id,Schema,URI,ServiceID,SVC,SVC__ID

rem export Service Numbers
..\bin\mongoexport -h %HOST% -d %DB% -c ServiceNumbers ^
	-u %USER% -p %PWD% -o ServiceNumbers.csv --type=csv ^
	--fields=_id,Number,ServiceID,SVC,SVC__ID

rem export Service Boundaries
..\bin\mongoexport -h %HOST% -d %DB% -c ServiceBoundaries ^
	-u %USER% -p %PWD% -o ServiceBoundaries.csv --type=csv ^
	--fields=_id,BoundaryGeom,ReferenceID,ServiceID,SVC,SVC__ID
	