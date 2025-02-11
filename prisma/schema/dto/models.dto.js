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

const pagoDto = [
    "id_credito",
    "monto_pago"
];

module.exports = {
    clienteDto,
    clienteCompleto,
    creditoDto,
    pagoDto
};