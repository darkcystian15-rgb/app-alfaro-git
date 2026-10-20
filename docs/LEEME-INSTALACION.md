# Aplicar paquete al repositorio Darkcystian

Este ZIP contiene rutas relativas a la raíz de `darkcystian15-rgb/app-alfaro-git`, pero no todo el repositorio.

1. En Codespaces abre `darkcystian15-rgb/app-alfaro-git` y guarda los cambios locales.
2. Crea una rama: `git switch -c reforma-portal-fases-1-2`.
3. Copia **las carpetas `src/` y `docs/`** de este ZIP sobre la raíz del repo, fusionando carpetas y reemplazando únicamente los archivos coincidentes.
4. Ejecuta `npm ci && npm run build`.
5. Prueba las rutas y llamadas enumeradas en `docs/REFORMA-PORTAL-FASES-1-2.md`.
6. Ejecuta `git add src docs && git commit -m "refactor: portal alfaro fases 1 y 2" && git push -u origin reforma-portal-fases-1-2`.
7. Revisa el Preview de Vercel asociado a la rama; solo al aprobar, fusiona la rama hacia `main` de Darkcystian y verifica el nuevo Production.

**No copies los archivos a Cystian ni a la intranet. No ejecutes migraciones de BD.**
