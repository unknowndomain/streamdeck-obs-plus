rem Build script

del  /s /q Release
md Release
.\DistributionTool.exe -b -i uk.org.moiraparish.obs.sdPlugin -o Release
