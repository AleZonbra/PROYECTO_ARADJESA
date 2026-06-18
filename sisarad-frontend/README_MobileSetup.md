Instrucciones de preparación móvil (Ionic + Capacitor)

1) Recomendaciones previas
- Cierra VSCode y cualquier servidor/terminal que use el proyecto.
- Abre PowerShell como Administrador.
- Si tienes antivirus o Windows Defender, considera excluir temporalmente la carpeta del proyecto.

2) Ejecutar el script de recuperación (recomendado)
Desde la carpeta `samva-frontend` en PowerShell (como Administrador):

Ejecuta: .\scripts\fix-npm-capacitor.ps1

El script intentará limpiar `node_modules`, regenerar `package-lock.json` con `npm install`, ejecutar `npm run build:mobile`, sincronizar Capacitor e intentar añadir/abrir Android.

3) Comandos manuales (si prefieres ejecutar paso a paso)

Limpiar cache: npm cache clean --force
Eliminar node_modules y lock: Remove-Item -Recurse -Force .\node_modules ; Remove-Item -Force .\package-lock.json
Instalar dependencias: npm install
Construir para móvil: npm run build:mobile
Sincronizar capacitor: npx cap sync
Añadir Android: npx cap add android
Abrir Android Studio: npx cap open android

4) Notas
- `npm ci` requiere `package-lock.json`. Después de eliminar `package-lock.json` debes usar `npm install` para regenerarlo. Luego podrás usar `npm ci` en CI.
- Si aparece `EBUSY` al borrar archivos, reinicia Windows y ejecuta el script de nuevo.
- Una vez la carpeta `android/` esté creada, súbela a Appflow o configúrala en tu pipeline con credenciales de firma.
