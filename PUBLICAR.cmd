@echo off
chcp 65001 >nul
title Publicar o PULSO na Vercel
cd /d "%~dp0app"
echo.
echo   ==================================================
echo     PULSO - publicando a pasta "app" na Vercel
echo   ==================================================
echo.
echo   PRIMEIRA VEZ - responda assim (setas + Enter):
echo.
echo     ? Which project?                     ^> Create a new project
echo     ? Project name?                      pulso-fit   (digite e Enter)
echo     ? In which directory is your code?   ./          (so Enter)
echo     ? Want to modify these settings?     N
echo.
echo   Se aparecer "Link to existing project?": responda N na primeira vez.
echo   Se pedir login: escolha GitHub, Google ou e-mail (abre o navegador).
echo.
echo   DEPOIS: e so dar dois cliques aqui de novo - ele atualiza o mesmo site.
echo.
call npx --yes vercel@latest --prod
echo.
echo   Pronto! O link em "Production" (ex.: https://pulso-fit.vercel.app)
echo   e o que voce manda para os amigos.
echo.
pause
