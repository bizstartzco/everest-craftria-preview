@echo off
rem Push this preview to a GitHub repository.
rem
rem   1. Create an EMPTY public repo on github.com (no README, no .gitignore).
rem      Suggested name: everest-craftria-preview
rem   2. Double-click this file, or run it with the repo URL:
rem        push-to-github.cmd https://github.com/YOURNAME/everest-craftria-preview.git
rem   3. On GitHub: Settings -> Pages -> Source "Deploy from a branch",
rem      Branch "main" / folder "/ (root)" -> Save. The link appears within a minute.

setlocal
cd /d "%~dp0"

set REPO=%1
if "%REPO%"=="" set /p REPO=Paste your GitHub repo URL (https://github.com/you/everest-craftria-preview.git):
if "%REPO%"=="" (
  echo No repository URL given. Stopping.
  pause
  exit /b 1
)

where git >nul 2>nul
if errorlevel 1 (
  echo Git is not installed or not on PATH.
  pause
  exit /b 1
)

if not exist ".git" (
  git init -b main
) else (
  echo Repository already initialised here.
)

git add -A
git diff --cached --quiet
if errorlevel 1 (
  git commit -m "Everest Craftria shop preview (static export)"
) else (
  echo Nothing new to commit.
)

git remote remove origin >nul 2>nul
git remote add origin %REPO%
git push -u origin main

echo.
echo Pushed. Now switch on GitHub Pages:
echo   Settings -^> Pages -^> Deploy from a branch -^> main -^> / (root) -^> Save
echo.
echo Your client link will be:
echo   https://YOURNAME.github.io/everest-craftria-preview/
echo.
pause
