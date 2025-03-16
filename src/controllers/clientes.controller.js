const { prisma } = require("../../prisma/database.client.prisma");
const bcrypt = require('bcrypt');
const { validationResult } = require("express-validator");
const {  validateNotFoundInPrisma, validateUniqueFieldViolation} = require("../../utils/validatemodels");
const { loggerMiddleware } = require("../logging/logger");

/**
 * Registra un cliente para poder crearle una cuenta de crédito. 
 * @param {number} precio - Precio sin impuestos.
 * @param {number} iva - Porcentaje de IVA (Ej: 21 para 21%).
 * @returns {number} Precio final con IVA.
 */
const crearCliente = async (req, res) => {
  try {
    /**
     * Se verifica que el resultado del middleware de validación de parámetros de la petición (i.e request.params, body o request.query) no contenga errores
     * Se define un salt para el almancenamiento de contraseñas
     */    
    const saltRounds = 12;
    if (!validationResult(req).isEmpty() || Object.keys(req.body).length == 0) { 
      loggerMiddleware.info(`Validation errors: ${JSON.stringify(validationResult(req).array())}`);
      return res.status(400).json();
    } 
    /**
     * Se verifica que los datos que se han ingresado no se encuentren registrados en la base de datos 
     */  
    const cliente = await prisma.cliente.findFirst({
      where: {
        OR:[
          {telefono : req.body.telefono},
          {documentoIdentidad : req.body.documentoIdentidad}
        ]
      },
      select:{
        documentoIdentidad: true,
        telefono: true,
        usuario:{
          select: {
            email: true
          }
        }
      }
    });

    if (cliente != null) {
      if (cliente.documentoIdentidad === req.body.documentoIdentidad) { 
        return res.status(409).json({message: "El documento de identidad ya está registrado"});
      }
      if (cliente.email === req.body.email ) {        
          return res.status(409).json({message: "El email ya está registrado"});
      }
      if (cliente.telefono === req.body.telefono) {  
        return res.status(409).json({message: "El número de teléfono ya está registrado"});
      }
    }
    /**
     * Se verifica si existe un usuario registrado con el mismo correo electrónico ingresado.
     * Si el correo se encuentra registrado, se asociará a dicho usuario la cuenta de cliente que se desea crear
     * En caso de que no exista usuario con ese correo, se procede a crearlo y asociarlo.
     */    
    let usuario = await prisma.usuario.findFirst({
      where: {email: req.body.email.toLowerCase()}
    });
    /**
     * Se asigna el rol User para todos los nuevos clientes registrados.
     */  
    const userRole = await prisma.role.findFirst({
      where: {Name: "User"},
      select:{
        id: true
      }
    });
    const hash = await bcrypt.hash(`${req.body.documentoIdentidad}-${req.body.nombre.toLowerCase().split(" ")[0]}`, saltRounds);      
    try {
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
    
      return res.status(201).json({"message": "Usuario creado correctamente",
        cliente_id : `${process.env.HOST}/api/clientes/${clienteCreado.documentoIdentidad}`});

    }
    catch(err) {
      loggerMiddleware.error(err.message);     
      return res.status(503).json({ error: "Servicio no disponible" });
    }
    
  } catch (error) {
    if (validateUniqueFieldViolation(error)){
      loggerMiddleware.error(error.message);
      return  res.status(409).json("El correo ya se encuentra registrado")
    }
    loggerMiddleware.error(error.message);

    return res.status(503).json({ error: "Servicio no disponible" });
  }
}


/**
 * Función para editar la información básica de un cliente. Se definen como campos editables el nombre, el telefono y la dirección.
 * Esta función edita el campo o campos especificados en el usuario creado. No se reemplaza la entidad completamente
 */  
const editarCliente = async(req, res) => {
  try {

    /**
     * Se verifica que el resultado del middleware de validación de parámetros de la petición (i.e request.params, body o request.query) no contenga errores
     */        
    if (!validationResult(req).isEmpty() || Object.keys(req.body).length == 0) { 
      loggerMiddleware.info(`Validation errors: ${JSON.stringify(validationResult(req).array())}`);
      return res.status(400).json(); 
    } 
    /**
     * Si se desea modificar  el número de telefono ya se encuentra registrado en la base de datos
     */        
    const telefonosRegistrados = await obtenerTelefonosRegistrados();
    if (req.body.telefono != null && telefonosRegistrados.includes(req.body.telefono)) {
      return res(400).json({message: "El número de teléfono ya está registrado"});
    }      
    /**
     * Define los campos que se pueden modificar y se extraen del cuerpo de la petición.
     */            
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
    if (validateUniqueFieldViolation(error)){
      return  res.status(409).json("Telefono ya se encuentra registrado")
    }    
    loggerMiddleware.error(error.message);
    return res.status(503).json({ error: "Servicio no disponible" });
  }  
}

/**
 * Función que permite eliminar un cliente a partir del número de documento de identidad y el cual se encuentre a paz y salvo con sus créditos (estado_credito activo)
 */     
const eliminarCliente = async(req, res) => {
  try{
    /**
     * Se verifica que el resultado del middleware de validación de parámetros de la petición (i.e request.params, body o request.query) no contenga errores
     */       
    if (!validationResult(req)) { 
      loggerMiddleware.info(`Validation errors: ${JSON.stringify(validationResult(req).array())}`);
      return res.status(400).json(); 
    } 
    const { id } = req.params;
    const cliente = await prisma.cliente.findUniqueOrThrow({
      where: {documentoIdentidad : id}})
    if (cliente.estado_credito) {
      return res.status(409).json({
        error: "No se puede eliminar este cliente porque tiene créditos activos."});
    }
    const clienteEliminado = await prisma.cliente.delete({
      where: { documentoIdentidad: id }
    });
    return res.status(200).json({message: `Cliente con id: ${clienteEliminado.documentoIdentidad} eliminado con éxito.`});
  } catch (error) {
    if (validateNotFoundInPrisma(error)) {
      return res.status(404).json();
    }       
    loggerMiddleware.error(error.message);
    return res.status(503).json({ error: "Servicio no disponible" });
  }  
}

/**
 * Función que permite obtener la información de un cliente junto con la información de todos sus créditos y pagos realizados.
 */     
const obtenerClientePorId = async (req, res) =>{
  try{

    /**
     * Se verifica que el resultado del middleware de validación de parámetros de la petición (i.e request.params, body o request.query) no contenga errores
     */     
    if (!validationResult(req).isEmpty()) { return res.status(400).json(); }    
     
    await actualizarEstadoCreditoCliente(req.params.id);
      cliente = await prisma.cliente.findFirst({
        where: {documentoIdentidad: req.params.id},
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
/**
 * Función que permite obtener la información personal de todos los clientes registrados y el estado de su cuenta de crédito.
 */  
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
      if (clientes.length === 0) {
        return res.status(204).json(Array());
      }
      return res.status(200).json(clientes);      
    } catch (error) {
      loggerMiddleware.error(error.message);
      return res.status(503).json({ error: "Servicio no disponible" });
    }
  };

/**
 * Función que permite obtener la lista de todos los telefonos registrados en la base de datos.
 */    

const obtenerTelefonosRegistrados = async () => {
  return (await prisma.cliente.findMany({
    select: {
          telefono: true
        }
    }))
    .map(cliente => cliente.telefono);
}


/**
 * Esta función verifica si cada uno de los créditos del usuario ya han sido pagados y eventualmente actualiza su estado.
 * @param {string} id - número de documento de identidad del cliente
 */  
const actualizarEstadoCreditoCliente = async (documentoIdentidad) => {
  console.log(documentoIdentidad);
  const estadosCreditos = (await prisma.credito.findMany({
    where: {
      cliente: {
        documentoIdentidad : documentoIdentidad
      }
    },
    select: { estado: true }
  })) ?? {estado: "PAGADO"}
  .map(credito => {

    if (credito.estado === "PAGADO"){
      return true;
    } else {
      return false
    }
  });

  if (estadosCreditos.every(Boolean)) {
    await prisma.cliente.update({
      where: {documentoIdentidad: documentoIdentidad},
      data: {
        estado_credito: false
      }
    });
  }


}

module.exports = { 
    crearCliente,
    editarCliente,
    eliminarCliente,
    obtenerClientePorId,
    obtenerClientes,
};
  