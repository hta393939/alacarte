
cd /d %~dp0
@rem cd /d G:/foo/bar/baz


set NAME=colmap/colmap:20260929.8466

@rem ホストフォルダは違い位置も指定できるか??
wslc run -v ./data:/data -it %NAME%

