# Скрипт для добавления папок app и pages в Git
# Запустите этот скрипт в PowerShell из корня проекта

Write-Host "Добавление папки app в Git..." -ForegroundColor Yellow
git add -f app/

if (Test-Path "pages") {
    Write-Host "Добавление папки pages в Git..." -ForegroundColor Yellow
    git add -f pages/
} else {
    Write-Host "Папка pages не найдена, пропускаем..." -ForegroundColor Gray
}

Write-Host "`nПроверка статуса Git:" -ForegroundColor Cyan
git status

Write-Host "`nЕсли файлы появились в статусе, выполните:" -ForegroundColor Green
Write-Host "git commit -m 'Add app and pages folders'" -ForegroundColor Green
Write-Host "git push" -ForegroundColor Green

