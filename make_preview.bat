@echo off
echo ==========================================
echo 🎬 Génération d'un aperçu vidéo (3 sec)
echo ==========================================

REM Vérifie que ffmpeg est disponible
where ffmpeg >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Erreur : ffmpeg n'est pas dans le PATH
    echo Mets ffmpeg.exe dans C:\Windows\System32\ ou ajoute son dossier /bin au PATH.
    pause
    exit /b
)

REM Crée l'aperçu (3 premières secondes, sans audio)
ffmpeg -y -i videos/demo.mp4 -ss 0 -t 3 -an -vf "scale=320:-2" -c:v libx264 -preset veryfast -crf 28 -movflags +faststart videos/preview.mp4

if %errorlevel% equ 0 (
    echo ✅ Aperçu généré avec succès : videos\preview.mp4
) else (
    echo ❌ Erreur lors de la génération de l'aperçu
)

pause
