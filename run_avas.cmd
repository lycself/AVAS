@echo off
rem Run AVAS with the project's .venv interpreter (falls back to "python" on PATH).
rem Usage:  run_avas.cmd --input "D:\proj\InputFile" --output "D:\proj\Results_001"
rem         run_avas.cmd plot emittance_x --output "D:\proj\Results_001"
rem         run_avas.cmd gui
setlocal
if exist "%~dp0.venv\Scripts\python.exe" (
    "%~dp0.venv\Scripts\python.exe" "%~dp0run_avas.py" %*
) else (
    echo [run_avas] .venv not found, using python from PATH ^(see README to create .venv^)
    python "%~dp0run_avas.py" %*
)
endlocal & exit /b %ERRORLEVEL%
