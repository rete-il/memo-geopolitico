# SheetJS para lectura local de Excel

El archivo `xlsx-0.20.3.tgz` procede del CDN oficial de SheetJS. La raíz del
sitio y el Centro local utilizan esta misma copia, fijada en sus respectivos
`package.json` y `package-lock.json`. Debe incluirse esta carpeta al distribuir
el Centro local por separado.

La procedencia y las huellas SHA-256 y SHA-512 están registradas en
`xlsx-0.20.3.integrity.json`. El paquete contiene su licencia Apache-2.0.
Los tests comprueban que la copia, las referencias y ambos locks coincidan.

SheetJS se utiliza en Node para leer el catálogo editorial; no se carga en el
navegador público. Los dos lectores utilizan la entrada CommonJS del paquete,
que incluye el soporte de archivos de Node.

La documentación oficial recomienda conservar una copia local porque las
versiones actuales no se distribuyen por el registro público de npm:
[instalación oficial](https://docs.sheetjs.com/docs/getting-started/installation/nodejs/).
Una futura actualización debe sustituir el archivo, registrar sus nuevas
huellas, actualizar ambos locks y verificar que la exportación del catálogo
conserva IDs, fechas y valores.
