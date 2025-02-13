const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();


const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const clientesRoutes = require("./src/routes/clientes.routes");
const pagosRoutes = require("./src/routes/pagos.routes");
const creditosRoutes = require("./src/routes/creditos.routes");
const reportesRoutes = require("./src/routes/reportes.routes");

app.use("/api/pagos", pagosRoutes);
app.use("/api/clientes", clientesRoutes);
app.use("/api/creditos", creditosRoutes);
app.use("/api", reportesRoutes);

app.get("/", (req, res) => {
  res.send("API de Cartera de Clientes funcionando 🚀");
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});