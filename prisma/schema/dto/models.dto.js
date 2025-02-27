const clienteDto  = [
    "documentoIdentidad", 
    "nombre", 
    "telefono",
    "direccion",
    "email"
];

const clienteCompleto  = [
    "documentoIdentidad", 
    "nombre", 
    "telefono",
    "direccion", 
];


const creditoDto  = [
    "id_cliente",
    "monto_total",
    "cuotas", 
    "frecuencia_pago"
];

const actualizarCreditoDto = [
    "monto_total",
    "cuotas",
    "frecuencia_pago"
]

const pagoDto = [
    "id_credito",
    "monto_pago"
];

const frecuenciaPago = ["QUINCENAL", "MENSUAL"];


const reportesDto = [
    "fechaInicial", "fechaFinal"
];


const usuarioDto = ["email", "password", "roles", "documentoIdentidad"];
const editarUsuarioDto = ["email", "password"];


module.exports = {
    actualizarCreditoDto,
    clienteDto,
    clienteCompleto,
    creditoDto,
    pagoDto,
    reportesDto,
    usuarioDto,
    editarUsuarioDto
};