const { prisma } = require("../../prisma/database.client.prisma");
const bcrypt = require('bcrypt');
const {validateModel, validateObjectContainsField, validateNotFoundInPrisma, validateUniqueFieldViolation} = require("../../utils/validatemodels");
const {eliminarCliente, editarCliente} = require("./clientes.controller");
const dtos = require("../../prisma/schema/dto/models.dto");

const crearUsuario = async (req, res)=> {
    const saltRounds = 12;
    try{
        if (!validateModel(req.body, dtos.usuarioDto)) { return res.status(400).json("Bad request"); }
        const cliente =  await prisma.cliente.findFirst({
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
                return res.status(503).json(); 
            }

        });
    }catch(err){
        console.error(err);
        return res.status(503).json();
    }    
}


const actualizarUsuario = async (req, res)=>{
    try{
        
        if (req.userId !== req.params.id && !isAdmin) { return res.status(403).json(); }
        const camposActualizados  = validateObjectContainsField(req.body, dtos.editarUsuarioDto);
        let usuarioActualizado;
        let clienteActualizado;
        if (Object.keys(camposActualizados).length > 0){
            const data = Object();
            camposActualizados.forEach(field => {
                data[field] = req.body[field];
            });    
            usuarioActualizado = await prisma.usuario.update({
                where: {id_user : req.params.id},
                data: data
            });        
        }
        const cliente = (await prisma.cliente.findFirst({
            where: {id_usuario : usuarioActualizado.id_user},
        }));
        
        if (req.body.nombre && cliente == null) { return res.status(404).json("El usuario no tiene un cliente asociado") }            
        if (req.body.nombre && cliente != null){
            clienteActualizado = await prisma.cliente.update({
                    where: {id_cliente: cliente.id_cliente},
                    data: { nombre: req.body.nombre }
            });
        }
        
        if (usuarioActualizado || clienteActualizado) { 
            return res.status(200).json("Usuario actualizado");
        } else {
            return res.status(400).json();
        }
    }
    catch (error) {
        console.log(error);
        if (validateNotFoundInPrisma(error)) {
            return res.status(404).json("El usuario no existe");
        }    
        return res.status(503).json({ error: "No se pudo editar el cliente" });
      }  
}
const obtenerUsuarioPorId = async (req, res)=>{
    try{
        if (req.userId !== req.params.id && !req.isAdmin) { return res.status(403).json(); }
        const usuario = await prisma.usuario.findFirstOrThrow({
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
        return res.status(503).json({ error: "No se pudo encontrar el cliente" });
      }  

}
const obtenerUsuarios = async (req, res) =>{
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
      res.status(503).json({ error: "Error al obtener clientes" });
    }
}

const eliminarUsuario = async (req, res) =>{
    try
    {
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
        return res.status(200).json({message: `Usuario con id: ${usuarioEliminado.id_user} eliminado con éxito.`});

    }catch (error) {
        console.log(error);
        if (validateNotFoundInPrisma(error)) {
            return res.status(404).json("El usuario no existe");
        }    
        return res.status(503).json({ error: "No se pudo encontrar el cliente" });
      }  
}

module.exports = {
    actualizarUsuario,
    crearUsuario,    
    eliminarUsuario,
    obtenerUsuarioPorId,
    obtenerUsuarios
};

