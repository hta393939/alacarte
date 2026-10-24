
cd /d %~dp0

set NAME=colmap/colmap:20260929.8466

wslc run --rm -v G:/work/gs:/gs -v ./data:/data -it %NAME%

@rem wslc ps -a
@rem wslc container prune
