const { prisma } = require("../../prisma/database.client.prisma");
const bcrypt = require('bcrypt');
const { validationResult } = require("express-validator");
const {  validateNotFoundInPrisma, validateUniqueFieldViolation} = require("../../utils/validatemodels");
const { loggerMiddleware } = require("../logging/logger");
const { cli } = require("winston/lib/winston/config");

const crearCliente = async (req, res) => {
  try {
    const saltRounds = 12;
    if (!validationResult(req).isEmpty() || Object.keys(req.body).length == 0) { 
      loggerMiddleware.info(`Validation errors: ${JSON.stringify(validationResult(req).array())}`);
      return res.status(400).json();
    } 
    // const {nombre, telefono, direccion, documentoIdentidad} = req.body; 
    const cliente = await prisma.cliente.findFirst({
      where: {telefono : req.body.telefono},
      select:{
        telefono: true,
        usuario:{
          select: {
            email: true
          }
        }
      }
    });
    if (cliente != null) {
      if (cliente.telefono != null) {    
        return res.status(400).json({message: "El número de teléfono ya está registrado"});
      }
      if (cliente.email != null) {
        return res.status(400).json({message: "El email ya está registrado"});
      }
    }

    let usuario = await prisma.usuario.findFirst({
      where: {email: req.body.email.toLowerCase()}
    });

    const userRole = await prisma.role.findFirst({
      where: {Name: "User"},
      select:{
        id: true
      }
    });
    const hash = await bcrypt.hash(`${req.body.documentoIdentidad}-${req.body.nombre.toLowerCase().split(" ")[0]}`, saltRounds);      
    const clienteCreado = await prisma.$transaction(async (tx)=>{   
    if (usuario == null) {
        usuario = await tx.usuario.create({
          data: {
            email : req.body.email.toLowerCase(),
            password: hash,
            roles: [userRole.id]
          }
        })        
      }
      const clienteCreado= await tx.cliente.create({data:{
        nombre : req.body.nombre,
        telefono: req.body.telefono,
        documentoIdentidad: req.body.documentoIdentidad,
        direccion: req.body.direccion,
        id_usuario: usuario.id_user
      }});
      return clienteCreado;
    });
    if (clienteCreado) {
      return res.status(201).json({"message": "Usuario creado correctamente",
        cliente_id : `${process.env.HOST}/api/clientes/${clienteCreado.documentoIdentidad}`});
    }
    else {      
      return res.status(409).json({ error: "Ya se encuentra registrado un usuario con la información enviada" });
    }
    
  } catch (error) {
    if (validateUniqueFieldViolation(error)){
      return  res.status(409).json("Telefono o documento de indentidad ya se encuentra registrado")
    }
    loggerMiddleware.error(error.message);
    return res.status(503).json({ error: "Servicio no disponible" });
  }
}

const editarCliente = async(req, res) => {
  try {
    if (!validationResult(req).isEmpty() || Object.keys(req.body).length == 0) { 
      loggerMiddleware.info(`Validation errors: ${JSON.stringify(validationResult(req).array())}`);
      return res.status(400).json(); 
    } 

    const telefonosRegistrados = await obtenerTelefonosRegistrados();
    if (req.body.telefono != null && telefonosRegistrados.includes(req.body.telefono)) {
      return res(400).json({message: "El número de teléfono ya está registrado"});
    }      
    const camposEditables = ["nombre", "telefono", "direccion"];
    const data = Object();
    camposEditables.forEach(field => {
        data[field] = req.body[field];
    });
    
    const clienteActualizado = await prisma.cliente.update({
      where: {documentoIdentidad : req.params.id},
      data: data
    });

    if (clienteActualizado == null) {
      return res.status(404).json("Cliente no fue encontrado");
    }
    
    return res.status(201).json({
      message: "Cliente actualizado correctamente",
      cliente_id : `${process.env.HOST}/api/clientes/${clienteActualizado.documentoIdentidad}`
    });
    
  } catch (error) {
    if (validateNotFoundInPrisma(error)) {
      return res.status(404).json();
    }    
    loggerMiddleware.error(error.message);
    return res.status(503).json({ error: "Servicio no disponible" });
  }  
}

const eliminarCliente = async(req, res) => {
  try{
    if (!validationResult(req)) { 
      loggerMiddleware.info(`Validation errors: ${JSON.stringify(validationResult(req).array())}`);
      return res.status(400).json(); 
    } 
    const { id } = req.params;
    const cliente = await prisma.cliente.findUniqueOrThrow({
      where: {documentoIdentidad : id}})
    if (cliente.estado_credito) {
      return res.status(400).json({
        error: "No puedes eliminar este cliente porque tiene créditos activos."});
    }
    const clienteEliminado = await prisma.cliente.delete({
      where: { documentoIdentidad: id }
    });
    return res.status(200).json({message: `Usuario con id: ${clienteEliminado.documentoIdentidad} eliminado con éxito.`});
  } catch (error) {
    if (validateNotFoundInPrisma(error)) {
      return res.status(404).json();
    }       
    loggerMiddleware.error(error.message);
    return res.status(503).json({ error: "Servicio no disponible" });
  }  
}

const obtenerClientePorId = async (req, res) =>{
  try{
    if (!validationResult(req).isEmpty()) { return res.status(400).json(); }    
    const { id } = req.params;

    cliente = await prisma.cliente.findFirst({
      where: {documentoIdentidad: id},
      relationLoadStrategy: 'join', 
      include:{ 
        creditos: {
          include: {
            pagos: {
            orderBy: {
              fecha_pago : 'asc'
              }
            }
          },
        },
      }
    });
      if (cliente == null) {
        return res.status(404).json({message: "No se encontró el cliente"});
      }
      return res.status(200).json({"cliente": cliente});    
    } catch (error) {
      if (validateNotFoundInPrisma(error)) {
          return res.status(404).json();
      }      
      loggerMiddleware.error(error.message);
      return res.status(503).json({ error: "Servicio no disponible" });
    }
}

const obtenerClientes = async (req, res) => {
    try {
      const clientes = await prisma.cliente.findMany({
        select: {
          id_cliente: true,
          nombre: true,
          telefono: true,
          direccion: true,
          estado_credito: true,
          fecha_registro: true,
        }
      });
      if (clientes.length == 0) {
        return res.status(204).json(clientes);
      }
      res.status(200).json(clientes);
    } catch (error) {
      loggerMiddleware.error(error.message);
      return res.status(503).json({ error: "Servicio no disponible" });
    }
  };

const obtenerTelefonosRegistrados = async () => {
  return (await prisma.cliente.findMany({
    select: {
          telefono: true
        }
    }))
    .map(cliente => cliente.telefono);
}

module.exports = { 
    crearCliente,
    editarCliente,
    eliminarCliente,
    obtenerClientePorId,
    obtenerClientes,
};
  