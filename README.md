# DistribucionesFullHogar🏠🧼🧽🛋️
Aplicación web para llevar la cartera de una empresa basada en express y PRISMA ORM


## Tabla de Contenido

1. [Instalación](#instalación)
2. [Aspectos funcionales relevantes](#aspectos-funcionales-relevantes)
3. [Estructura de API](#estructura-de-api)


# Instalación
### Dependencias
Se requiere del entorno NODEJs instalado para poder ejecutar la aplicación:
```python
    node --version > v22.xx
```

La API de backend requiere la instalación de las siguientes dependencias:
```json
{
  "dependencies": {
    "@prisma/client": "^6.4.1",
    "bcrypt": "^5.1.1",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "express-validator": "^7.2.1",
    "express-winston": "^4.2.0",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.0",
    "winston": "^3.17.0",
    "winston-daily-rotate-file": "^5.0.0"
  }
}
```
### Creación entorno de ejecución
#### Archivo .env
La aplicación require de un archivo .env en el raíz de la carpeta del proyecto. \
En este arcivo es donde se almacenan las siguientes variables de entorno:
```go
PORT= "PORT Number"
DATABASE_PUBLIC_URL= "Connection string to postgres database"
HOST= "Full hogar app url"
ISSUER= "Full hogar app url"
AUDIENCE= "Full hogar app url"
VALIDATE_AUDIENCE= "True or false"
VALIDATE_ISSUER= "True or false"
JWT_KEY = "Tokens Signing key = 256 char"
JWT_EXPIRETIME= "Time in minutes of active user session"
```

#### Inicialización de cliente PRISMA
Para instalar el cliente en el proyecto y regenerar las custom queries definidas en la carpeta sql ([ver documentación PRISMA](https://www.prisma.io/docs/orm/prisma-client/using-raw-sql)), usar:
```js
npx prisma generate --sql
```
Para inicializar la base de datos se debe usar el siguiente comando:
```js
npx prisma db push
```
Para correr la aplicación:
```js
node ./server.js
```
# Estructura de API

La estructura de la API esta definida en el documento [openapi.yml](https://github.com/LuffyBB1/distribucionesFullHogar/blob/develop/openapi.yml). \
Se cuenta con la siguiente distribución de endpoints:

 - api \
 | - auth \
 | - clientes \
 | - usuarios \
 | - creditos \
 | - pagos \
 | - reportes

# Aspectos funcionales relevantes
### Manejo de sesión de usuario
La sesión se maneja utilizando tokens JWT los cuales se almacenan en una tabla cuando se cierra la sesión para evitar su reuso.
Esta tabla se purga eliminando los registros del día anterior cada vez que se accede al endpoint de cierre de sesión.
### Relación entre entidad Cliente y entidad Usuario
Se modela esta relación considerando que un usuario del sistema puede o no tener cuentas de crédito asociadas. Estas cuentas (modeladas con la entidad Cliente)
requieren de la existencia de un usuario para ser creadas, a diferencia de un usuario que puede ser creado sin asociarle una cuenta.
### Roles y permismos
Se modela utilizando una autorización basada en *claims* donde el rol se considera de este tipo. La entidad Usuario es aquella en donde se pretende almacenar los *claims* con el fin de poder escalar el sistema en cuanto a reglas de autorización. \
El sistema puede crear politicas de autorización donde un usuario puede tener uno o más roles. Los claims que se verifican actualmente son: 1) si el usuario esta autenticado y 2) si tiene los roles correspondientes a cada endpoint. Sin embargo, en la entidad Usuario se dejó un campo de verificación de correo para poder extender la aplicación en relación a la creación de las cuentas de usuario por parte del Administrador del sistema.
Se deben crear los roles de *User* y *Admin* como tambien un Usuario con este rol desde un gestor de bases de datos.
### Logging
Se realizan dos procesos de logging: el primero registra todas las peticiones http entrantes y los errores antes de su procesamiento (ejemplo formato incorrecto del cuerpo de la petición). El segundo grupo registra en cada endpoint los posibles errores durante el procesamiento en los middlewares de la aplicación.


