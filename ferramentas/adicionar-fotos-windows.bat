@echo off
chcp 65001 >nul
cd /d "%~dp0.."
echo A acrescentar as fotos e videos de novas\ ...
echo.
python ferramentas\adicionar.py 2>nul || py ferramentas\adicionar.py || echo Python nao encontrado. Instala o Python em python.org e tenta outra vez.
echo.
pause
