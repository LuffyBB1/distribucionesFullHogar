const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const logger = require("./src/logging/logger");

dotenv.config();


const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const clientesRoutes = require("./src/routes/clientes.routes");
const pagosRoutes = require("./src/routes/pagos.routes");
const creditosRoutes = require("./src/routes/creditos.routes");
const reportesRoutes = require("./src/routes/reportes.routes");
const usuariosRoutes = require("./src/routes/usuarios.routes");
const authRoutes = require("./src/routes/autenticacion.routes");
const { loggerHttpEvents, loggerHttpErrors, loggerMiddleware } = require("./src/logging/logger");

app.use(loggerHttpEvents);

app.use("/api/pagos", pagosRoutes);
app.use("/api/clientes", clientesRoutes);
app.use("/api/creditos", creditosRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", reportesRoutes);

app.get("/", (req, res) => {
  res.send("API de Cartera de Clientes funcionando 🚀");
});

app.use(loggerHttpErrors);

try {
  app.listen(PORT, () => {
    loggerMiddleware.info(`Servidor corriendo en http://localhost:${PORT}`);
  });
} catch(err){
  
  loggerMiddleware.error($`La aplicación se detuvo debido a: {err}`);
}