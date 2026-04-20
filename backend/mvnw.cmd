@REM This is a minimal mvnw.cmd for Windows
@echo off
set DIR=%~dp0
set WRAPPER_JAR="%DIR%.mvn\wrapper\maven-wrapper.jar"
set DOWNLOAD_URL="https://repo.maven.apache.org/maven2/io/takari/maven-wrapper/0.5.6/maven-wrapper-0.5.6.jar"

if exist %WRAPPER_JAR% (
    echo Found wrapper jar
) else (
    echo Downloading wrapper jar
    powershell -Command "Invoke-WebRequest -Uri %DOWNLOAD_URL% -OutFile %WRAPPER_JAR%"
)

java -jar %WRAPPER_JAR% %*
