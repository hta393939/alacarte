set SRC=.\public\*
set DST=.\docs\

xcopy %SRC% %DST% /s
rem xcopy %SRC%\public\image\* %DST%\image\ /s
rem xcopy %SRC%\public\lib\* %DST%\lib\ /s

