# Integración en el proyecto

Copiar la carpeta completa:

```text
project-management/
```

en la raíz del proyecto, al mismo nivel que:

```text
docs/
src/
public/
package.json
```

No reemplaza `docs/` ni modifica el código del sitio.

Después:

```powershell
git switch beta
git add project-management
git commit -m "Agrega sistema de project management"
git push origin beta
```

Para regenerar paneles:

```powershell
node project-management/tools/update-dashboard.mjs
```
