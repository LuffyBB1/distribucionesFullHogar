const clienteDto  = [
    "documentoIdentidad", 
    "nombre", 
    "telefono",
    "direccion"
];

const clienteCompleto  = [
    "documentoIdentidad", 
    "nombre", 
    "telefono",
    "direccion",
    "email",    
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

module.exports = {
    actualizarCreditoDto,
    clienteDto,
    clienteCompleto,
    creditoDto,
    pagoDto
};