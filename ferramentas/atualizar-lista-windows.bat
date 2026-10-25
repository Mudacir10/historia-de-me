@echo off
chcp 65001 >nul
cd /d "%~dp0.."
echo A gerar a lista de fotos e videos...
python ferramentas\gerar-lista.py 2>nul || py ferramentas\gerar-lista.py || echo Python nao encontrado. Usa o ficheiro ferramentas\organizador.html em vez disto.
echo.
pause
