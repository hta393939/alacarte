
cd /d C:/Program Files (x86)/Android/android-sdk/platform-tools

set ADDR=192.168.0.4
set PORT=44583
.\adb.exe connect %ADDR%:%PORT%
.\adb.exe devices

