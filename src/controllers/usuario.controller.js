const { prisma } = require("../../prisma/database.client.prisma");
const bcrypt = require('bcrypt');
const {validateNotFoundInPrisma, validateUniqueFieldViolation, extraerDtoDeRequest} = require("../../utils/validatemodels");
const { loggerMiddleware } = require("../logging/logger");
const {eliminarCliente} = require("./clientes.controller");
const { validationResult } = require("express-validator");

const crearUsuario = async (req, res)=> {
    const saltRounds = 12;
    try{
        if (!validationResult(req).isEmpty()) { 
            loggerMiddleware.info(`Validation errors: ${JSON.stringify(validationResult(req).array())}`);            
            return res.status(400).json();; 
        } 
        const cliente =  await prisma.cliente.findUnique({
            where: {documentoIdentidad: req.body.documentoIdentidad}
        });
        const roles = await prisma.role.findMany();
        const assignedRoles = (roles.filter(role => {
            if (Array.isArray(req.body.roles)){
                return req.body.roles.includes(role.Name);
            } else {

                return role.Name === req.body.roles;
            }
        })).
        map(role => role.id);
        bcrypt.hash(req.body.password, saltRounds, async function(err, hash) {
        // Store hash in your password DB.
            const data = {
                email: req.body.email.toLowerCase(),
                password: hash,
                emailConfirmed: false,
                roles: assignedRoles
            }
            if (cliente) {data['client'] = cliente;}
            try{
                const usuarioCreado = await prisma.$transaction(async (tx) =>{
                    const usuarioCreado = await tx.usuario.create({
                        data: data
                    });                
                    return usuarioCreado;
                });
                return res.status(201).json({
                    usuario_id: `${process.env.HOST}/api/usuarios/${usuarioCreado.id_user}`
                });                   
            }catch(err){

                if (validateUniqueFieldViolation(err)) {
                    return res.status(409).json("El correo electrónico ya se encuentra registrado");
                }
                loggerMiddleware.error(error.message);
                return res.status(503).json("No se pudo contactar con el servicio");  
            }
        });
    }catch(err){
        loggerMiddleware.error(error.message);
        return res.status(503).json("No se pudo contactar con el servicio");   
    }    
}


const actualizarUsuario = async (req, res)=>{
    try {        
        if (!validationResult(req).isEmpty() || Object.keys(req.body).length == 0) { 
            loggerMiddleware.error('Validation errors:', JSON.stringify(validationResult(req).array()));
            return res.status(400).json(); 
        } 
        if (req.userId !== req.params.id && !req.isAdmin) { return res.status(403).json(); }
        let usuarioActualizado;
        let clienteActualizado;
        if (Object.keys(req.body).length > 0){
            const data = extraerDtoDeRequest(req.body, ["email", "password"]);
            usuarioActualizado = await prisma.usuario.update({
                where: {id_user : req.params.id},
                data: data
            });        
        }
        const cliente = (await prisma.cliente.findUnique({
            where: {id_usuario : usuarioActualizado.id_user},
        }));
        
        if (req.body.nombre && cliente == null) { return res.status(409).json("El usuario no tiene un cliente asociado") }            
        if (req.body.nombre && cliente != null){
            clienteActualizado = await prisma.cliente.update({
                    where: {id_cliente: cliente.id_cliente},
                    data: { nombre: req.body.nombre }
            });
        }
        
        if (usuarioActualizado == null || clienteActualizado == null) { 
            return res.status(200).json("Usuario actualizado");
        } else {
            return res.status(404).json();
        }
    }
    catch (error) {
        console.log(error);
        if (validateNotFoundInPrisma(error)) {
            return res.status(404).json("El usuario no existe");
        }    
        loggerMiddleware.error(error.message);
        return res.status(503).json("No se pudo contactar con el servicio");   
      }  
}
const obtenerUsuarioPorId = async (req, res)=>{
    try{
        if (!validationResult(req).isEmpty()) { 
            loggerMiddleware.info(`Validation errors: ${JSON.stringify(validationResult(req).array())}`);
            return res.status(400).json();; 
        } 
        if (req.userId !== req.params.id && !req.isAdmin) { return res.status(403).json(); }
        const usuario = await prisma.usuario.findUniqueOrThrow({
            where:  {id_user: req.params.id},
            omit: {
                password: true
            },
            include: {
                client: true
            }
        });
        
        return res.status(200).json(usuario);

    }catch (error) {
        console.log(error);
        if (validateNotFoundInPrisma(error)) {
            return res.status(404).json("El usuario no existe");
        }    
        loggerMiddleware.error(error.message);
        return res.status(503).json("No se pudo contactar con el servicio");   
      }  

}
const obtenerUsuarios = async (res) =>{
    try {
        const usuarios = await prisma.usuario.findMany({
            select: {
                id_user: true,
                email: true,
                roles: true,
                client :{
                    select: {
                        nombre: true
                    }
                }
            }
        });
        if (usuarios.length == 0) {
            return res.status(204).json(usuarios);
          }
          res.status(200).json(usuarios);        
    }catch (error) {
        loggerMiddleware.error(error.message);
        return res.status(503).json("No se pudo contactar con el servicio");   
    }
}

const eliminarUsuario = async (req, res) =>{
    try
    {
        if (!validationResult(req).isEmpty()) { 
            loggerMiddleware.info(`Validation errors: ${JSON.stringify(validationResult(req).array())}`);
            return res.status(400).json(); 
        } 
        const { id } = req.params;
        const usuario = await prisma.usuario.findFirstOrThrow({
            where: {id_user: id},
            include:{
                client: true
            }
        });

        if (usuario.client != null) {
            req.id = usuario.client.id
            await eliminarCliente(req, res);
        }
        const usuarioEliminado = await prisma.usuario.delete({
            where: { id_user: usuario.id_user }        
        });    
        return res.status(200).json({message: `Usuario con id: ${usuarioEliminado.id_user} fue eliminado con éxito.`});

    }catch (error) {
        if (validateNotFoundInPrisma(error)) {
            return res.status(404).json();
        }    
        loggerMiddleware.error(error.message);
        return res.status(503).json("No se pudo contactar con el servicio");   
      }  
}

module.exports = {
    actualizarUsuario,
    crearUsuario,    
    eliminarUsuario,
    obtenerUsuarioPorId,
    obtenerUsuarios
};

