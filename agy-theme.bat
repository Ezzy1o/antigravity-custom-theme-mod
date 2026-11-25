@echo off
setlocal EnableExtensions
set "REPO_ROOT=%~dp0"
if "%REPO_ROOT:~-1%"=="\" set "REPO_ROOT=%REPO_ROOT:~0,-1%"
set "CLI_EXE=%REPO_ROOT%\target\release\agy-theme.exe"
set "DAEMON_EXE=%REPO_ROOT%\target\release\agy-theme-daemon.exe"

pushd "%REPO_ROOT%" >nul 2>&1

if not "%~1"=="" (
    call :ensure_built
    if errorlevel 1 (
        popd >nul 2>&1
        exit /b 1
    )
    "%CLI_EXE%" --root "%REPO_ROOT%" %*
    set "EXIT_CODE=%errorlevel%"
    popd >nul 2>&1
    exit /b %EXIT_CODE%
)

call :ensure_built
if errorlevel 1 (
    pause
    popd >nul 2>&1
    exit /b 1
)

:menu
cls
echo ============================================================================
echo   Antigravity Custom Theme Engine — Tawa Rust Edition
echo ============================================================================
echo   [1] Cai dat ^& chay ngam tu dong (install - Task Scheduler + Daemon)
echo   [2] Bien dich lai payload Lazy HTTP (build)
echo   [3] Kiem tra trang thai daemon ^& RAM thuc te (status)
echo   [4] Kiem tra live CDP tren Antigravity (verify)
echo   [5] Xem danh sach preset theme (themes)
echo   [6] Bat che do dev tu rebuild khi sua theme (install --watch-themes)
echo   [7] Tat daemon ngam (stop)
echo   [8] Go cai dat sach se (uninstall)
echo   [9] Bien dich lai Rust Release (cargo build --release)
echo   [0] Thoat
echo ============================================================================
set /p "CHOICE=Chon tac vu [0-9]: "

if "%CHOICE%"=="1" goto do_install
if "%CHOICE%"=="2" goto do_build
if "%CHOICE%"=="3" goto do_status
if "%CHOICE%"=="4" goto do_verify
if "%CHOICE%"=="5" goto do_themes
if "%CHOICE%"=="6" goto do_watch
if "%CHOICE%"=="7" goto do_stop
if "%CHOICE%"=="8" goto do_uninstall
if "%CHOICE%"=="9" goto do_rebuild_rust
if "%CHOICE%"=="0" goto do_exit

echo [!] Lua chon khong hop le. Vui long nhap so tu 0 den 9.
pause
goto menu

:do_install
"%CLI_EXE%" --root "%REPO_ROOT%" install
echo.
pause
goto menu

:do_build
"%CLI_EXE%" --root "%REPO_ROOT%" build
echo.
pause
goto menu

:do_status
"%CLI_EXE%" --root "%REPO_ROOT%" status
echo.
pause
goto menu

:do_verify
"%CLI_EXE%" --root "%REPO_ROOT%" verify
echo.
pause
goto menu

:do_themes
"%CLI_EXE%" --root "%REPO_ROOT%" themes
echo.
pause
goto menu

:do_watch
"%CLI_EXE%" --root "%REPO_ROOT%" install --watch-themes
echo.
pause
goto menu

:do_stop
"%CLI_EXE%" --root "%REPO_ROOT%" stop
echo.
pause
goto menu

:do_uninstall
"%CLI_EXE%" --root "%REPO_ROOT%" uninstall
echo.
pause
goto menu

:do_rebuild_rust
where cargo >nul 2>&1
if errorlevel 1 (
    echo [Loi] Khong tim thay Rust ^(cargo^).
    pause
    goto menu
)
"%CLI_EXE%" --root "%REPO_ROOT%" stop >nul 2>&1
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "Stop-ScheduledTask -TaskName 'AntigravityCustomTheme' -ErrorAction SilentlyContinue" >nul 2>&1
timeout /t 1 /nobreak >nul
echo [Build] Dang bien dich ban Release (cargo build --release)...
cargo build --release
if errorlevel 1 (
    echo [Loi] Bien dich that bai!
) else (
    echo [OK] Bien dich thanh cong!
)
echo.
pause
goto menu

:do_exit
popd >nul 2>&1
exit /b 0

:ensure_built
if exist "%CLI_EXE%" if exist "%DAEMON_EXE%" exit /b 0
where cargo >nul 2>&1
if errorlevel 1 (
    echo [Loi] Chua cai Rust toolchain ^(cargo^).
    exit /b 1
)
echo [Setup] Dang bien dich ban Release lan dau (cargo build --release)...
cargo build --release
if errorlevel 1 (
    echo [Loi] cargo build --release that bai.
    exit /b 1
)
exit /b 0
