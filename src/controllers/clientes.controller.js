const { prisma } = require("../../prisma/database.client.prisma");

const dtos = require("../../prisma/schema/dto/models.dto");
const {validateModel, validateObjectContainsField, validateNotFoundInPrisma} = require("../../utils/validatemodels");

const crearCliente = async (req, res) => {
  try {
    
    if (validateModel(req.body, dtos.clienteDto)) {
      const infoCliente = req.body; 
      const telefonosRegistrados = await obtenerTelefonosRegistrados();
    
      if (telefonosRegistrados.includes(infoCliente.telefono)) {    
        return res.status(400).json({message: "El número de teléfono ya está registrado"});
      }
      
      const clienteCreado= await prisma.cliente.create({data: infoCliente});
      if (clienteCreado) {
        return res.status(201).json({"message": "Usuario creado correctamente",
          cliente_id : `${process.env.HOST}/api/clientes/${clienteCreado.documentoIdentidad}`});
      }
    } else {
      return res.status(400).json();
    }
  } catch (error) {
    console.error(error);
    res.status(503).json({ error: "No se pudo registrar el cliente" });
  }
}

const editarCliente = async(req, res) => {
  try {
    const { id } = req.params;
    camposAtualizados = validateObjectContainsField(req.body, dtos.clienteCompleto);
    if (camposAtualizados.length > 0) {
      const telefonosRegistrados = await obtenerTelefonosRegistrados();
      if (camposAtualizados.telefono != null && telefonosRegistrados.includes(req.body.telefono)) {
        return res(400).json({message: "El número de teléfono ya está registrado"});
      }      
      const data = Object();
      camposAtualizados.forEach(field => {
          data[field] = req.body[field];
      });

      clienteActualizado = await prisma.cliente.update({
        where: {documentoIdentidad : id},
        data: data
      });
      
      return res.status(201).json({
        message: "Cliente actualizado correctamente",
        cliente_id : `${process.env.HOST}/api/clientes/${clienteActualizado.documentoIdentidad}`
      });
    } else {
      return res.status(400).json({ error: "No se pudo editar el cliente" });
    }

  } catch (error) {
    console.log(error);
    if (validateNotFoundInPrisma(error)) {
        return res.status(404).json();
    }    
    return res.status(503).json({ error: "No se pudo editar el cliente" });
  }  
}

const eliminarCliente = async(req, res) => {
  try{
    const { id } = req.params;
    const cliente = await prisma.cliente.findFirst({
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
    return res.status(503).json({ error: "No se pudo eliminar el cliente" });
  }  
}

const obtenerClientePorId = async (req, res) =>{
  try{
    const { id } = req.params;
    if (id == null) {
      return res.status(400).json();
    }

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
        return res.status(209).json({message: "No se encontró el cliente"});
      }
      return res.status(200).json({"cliente": cliente});    
    } catch (error) {
      if (validateNotFoundInPrisma(error)) {
          return res.status(404).json();
      }      
      res.status(503).json({ error: "No se pudo encontrar el cliente" });
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
      res.status(503).json({ error: "Error al obtener clientes" });
    }
  };

const obtenerTelefonosRegistrados = async (req, res) => {
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
  