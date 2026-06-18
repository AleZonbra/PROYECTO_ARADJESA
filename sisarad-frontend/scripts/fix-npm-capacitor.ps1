<#
  fix-npm-capacitor.ps1
  Script to help recover from locked node_modules / npm errors and run Capacitor sync.

  USO: Abrir PowerShell como Administrador, cerrar VSCode/terminals que usen el proyecto,
  y desde la carpeta `samva-frontend` ejecutar:
    .\scripts\fix-npm-capacitor.ps1

  El script intenta:
   - eliminar la subcarpeta problemática de `react-icons` si existe
   - limpiar cache npm
   - eliminar `node_modules` y `package-lock.json`
   - ejecutar `npm install` (genera package-lock.json)
   - ejecutar `npm run build:mobile`, `npx cap sync` y añadir/abrir Android
#>

Set-StrictMode -Version Latest

function Write-Info($msg){ Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Warn($msg){ Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err($msg){ Write-Host "[ERROR] $msg" -ForegroundColor Red }

Push-Location -Path (Split-Path -Path $MyInvocation.MyCommand.Definition -Parent)/.. | Out-Null

Write-Info "Directorio de trabajo: $(Get-Location)"

Write-Info "Asegúrate de haber cerrado VSCode y otros procesos que usen la carpeta antes de continuar."

try {
  $target = Join-Path -Path (Get-Location) -ChildPath "node_modules/react-icons/sl"
  if (Test-Path $target) {
    Write-Info "Eliminando carpeta problemática: $target"
    Remove-Item -Recurse -Force $target -ErrorAction Stop
  } else {
    Write-Info "No se encontró la carpeta react-icons/sl (continuando)."
  }
} catch {
  Write-Warn "No se pudo eliminar la subcarpeta react-icons/sl: $($_.Exception.Message)"
}

Write-Info "Limpiando cache de npm..."
npm cache clean --force

try {
  if (Test-Path "node_modules"){
    Write-Info "Eliminando node_modules..."
    Remove-Item -Recurse -Force .\node_modules -ErrorAction Stop
  }
  if (Test-Path "package-lock.json"){
    Write-Info "Eliminando package-lock.json..."
    Remove-Item -Force .\package-lock.json -ErrorAction Stop
  }
} catch {
  Write-Warn "Error al eliminar archivos: $($_.Exception.Message)"
}

Write-Info "Instalando dependencias (npm install)..."
$exit = & npm install
if ($LASTEXITCODE -ne 0) {
  Write-Err "npm install devolvió código $LASTEXITCODE. Revisar salida arriba."
  Pop-Location | Out-Null
  exit $LASTEXITCODE
}

Write-Info "Construyendo para móvil (npm run build:mobile)..."
& npm run build:mobile
if ($LASTEXITCODE -ne 0) {
  Write-Warn "build:mobile devolvió código $LASTEXITCODE. Puedes intentar ejecutar el comando manualmente."
}

Write-Info "Sincronizando Capacitor (npx cap sync)..."
& npx cap sync
if ($LASTEXITCODE -ne 0) {
  Write-Warn "npx cap sync devolvió código $LASTEXITCODE. Asegúrate que @capacitor/cli está instalado."
}

if (-not (Test-Path "android")) {
  Write-Info "Agregando plataforma Android (npx cap add android)..."
  & npx cap add android
  if ($LASTEXITCODE -ne 0) {
    Write-Warn "npx cap add android devolvió código $LASTEXITCODE. Puedes ejecutar este comando manualmente."
  }
} else {
  Write-Info "La carpeta 'android' ya existe, omitida creación."
}

Write-Info "Abrir Android Studio con la plataforma (npx cap open android)..."
& npx cap open android

Write-Info "Script finalizado. Si hubo errores, revisa la salida previa y corrige permisos/procesos bloqueantes."

Pop-Location | Out-Null
