import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const validateRolPermission = (Permission) => {
  return async(req, res, next) => {
    try{
      const clientSecret = req.headers['client-secret'];
  
      const userPermission = await prisma.sE_User.findFirst({
        where: {
          client_secret: clientSecret
        }
      });
  
      const RolePermissions = await prisma.sE_Permission_Role.findMany({
        where:{
          idRole: userPermission.idRol
        },
        include:{
          permission: {
            select: {
              name: true,
              Description: true
            }
          }
        }
      })
  
      const hasPermission = RolePermissions.some((permission) => {
        return permission.permission.name == Permission
      })
  
      if(hasPermission) {
        next();
      }
      else {
        return res.status(401).json({ message: 'You do not have the necessary permissions for this transaction' });
      }
    }
    catch (error) {
      return res.status(500).json({ error: 'Something went wrong' })
    }
  }
}

export default validateRolPermission;