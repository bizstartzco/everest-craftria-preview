@echo off
rem Push this preview to GitHub Pages.
rem
rem   Just double-click this file. It reuses the repository this folder is
rem   already connected to (bizstartzco/everest-craftria-preview).
rem
rem   First time on a new repo instead: create an EMPTY public repo on github.com
rem   (no README, no .gitignore) and run this with its URL:
rem     push-to-github.cmd https://github.com/YOURNAME/everest-craftria-preview.git
rem   Then switch Pages on: Settings -> Pages -> Deploy from a branch ->
rem   main -> / (root) -> Save.

setlocal
cd /d "%~dp0"

where git >nul 2>nul
if errorlevel 1 (
  echo Git is not installed or not on PATH.
  pause
  exit /b 1
)

if not exist ".git" git init -b main

set REPO=%1
if "%REPO%"=="" (
  rem Already connected? Then no URL is needed.
  for /f "delims=" %%r in ('git remote get-url origin 2^>nul') do set REPO=%%r
)
if "%REPO%"=="" set /p REPO=Paste your GitHub repo URL (https://github.com/you/everest-craftria-preview.git):
if "%REPO%"=="" (
  echo No repository URL given. Stopping.
  pause
  exit /b 1
)
echo Pushing to %REPO%

git add -A
git diff --cached --quiet
if errorlevel 1 (
  git commit -m "Preview refresh: animations, welcome offer, WhatsApp button"
) else (
  echo Nothing new to commit.
)

git remote remove origin >nul 2>nul
git remote add origin %REPO%
git push -u origin main
if errorlevel 1 (
  echo.
  echo Push failed. If it asked for a login, sign in to the GitHub window that
  echo opened, then run this file again.
  pause
  exit /b 1
)

echo.
echo Pushed. The client link stays the same:
echo   https://bizstartzco.github.io/everest-craftria-preview/
echo.
echo GitHub Pages takes up to a minute to rebuild. Hold Ctrl and press F5 on
echo the page if you still see the old version.
echo.
pause
