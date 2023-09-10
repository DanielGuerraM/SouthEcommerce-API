import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

router.get('/role', async (req, res) => {
  const roles = await prisma.sE_Role.findMany({
    include: {
      permission_role: {
        include: {
          permission: true
        }
      }
    }
  });

  const rolesWithPermission = roles.map(role => ({
    id: role.id,
    name: role.name,
    description: role.description,
    permissions: role.permission_role.map(pr => pr.permission.name)
  }));

  res.json({ result: rolesWithPermission });
})

router.get('/role/:id', async (req, res) => {
  try{
    if(!req?.params?.id){
      return res.status(422).json({ message: 'A parameter was expected' })
    }

    const existsRole = await prisma.sE_Role.findUnique({
      where: {
        id: req.params.id
      }
    })

    if(!existsRole) {
      return res.status(404).json({ message: 'Role does not exists' });
    }

    const roles = await prisma.sE_Role.findMany({
      where: {
        id: req.params.id
      }
      ,include: {
        permission_role: {
          include: {
            permission: true
          }
        }
      }
    });
  
    const rolesWithPermission = roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permission_role.map(pr => pr.permission.name)
    }));

    if(!rolesWithPermission) {
      return res.status(404).json({ message: 'Role does not exists' })
    }

    res.json({ result: rolesWithPermission })
  }
  catch (error) {
    return res.status(500).json({ message: 'Something went wrong' })
  }
})

router.post('/role', async (req, res) => {
  const { name, description, permissions } = req.body;

  try{
    if(!name || !description || !permissions) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existsRole = await prisma.sE_Role.findFirst({
      where: {
        name
      }
    })

    if(existsRole) {
      return res.status(400).json({ message: 'Role already exists' });
    }

    const existsPermissions = await prisma.sE_Permission.findMany({
      where:{
        id: { in: permissions }
      }
    });

    if(permissions.length !== existsPermissions.length) {
      return res.status(404).json({ message: 'Not all permissions provided exist' });
    }

    const newRole = await prisma.sE_Role.create({
      data:{
        name,
        description,
        permission_role: {
          create: permissions.map(permissionId => ({
            permission: { connect : { id:permissionId } }
          }))
        }
      },
      include: {
        permission_role: {
          include: {
            permission: true
          }
        }
      }
    });

    res.status(201).json({ result: newRole})
  }
  catch (error) {
    return res.status(500).json({ error: 'Something went wrong' });
  }
})

router.patch('/role/:id', async(req, res) => {
  try{
    if(!req?.params?.id) {
      return res.status(400).json({ message: 'A parameter was expected'})
    }

    const { name, description, permissions } = req.body;

    if(Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: 'At least one field was expected to update' });
    }

    const existsUser = await prisma.sE_Role.findUnique({
      where: {
        id: req.params.id
      }
    });

    if(!existsUser) {
      return res.status(404).json({ message: 'Role does not exists' });
    }

    const idRole = req.params.id;

    const permissionsRole = permissions.map((idPermission) => ({
      idRole,
      idPermission
    }))

    const RoleUpdated = await prisma.sE_Permission_Role.createMany({
      data: permissionsRole
    });

    res.json({ result: permissionsRole });
  }
  catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
})

router.delete('/role/:id', async (req, res) => {
  try{
    if(!req?.params?.id){
      return res.status(422).json({ message: 'A parameter was expected' })
    }

    const existsRole = await prisma.sE_Role.findUnique({
      where: {
        id: req.params.id
      }
    })

    if(!existsRole) {
      return res.status(404).json({ message: 'Role does not exists' });
    }

    await prisma.sE_Role.delete({
      where:{
        id: req.params.id
      }
    });

    res.status(204).end();
  }
  catch (error){
    return res.status(500).json({ error: 'Something went wrong' })
  }
})

export default router;