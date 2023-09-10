import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const validateClientSecret = () => {
  return async (req, res, next) => {
    try{
      const clientSecret = req.headers['client-secret'];
  
      if(!clientSecret) {
        return res.status(400).json({ message: 'Expected a client-secret' })
      }
  
      const isCorrect = await prisma.sE_User.findFirst({
        where: {
          client_secret: clientSecret
        }
      });
  
      if(!isCorrect) {
        return res.status(401).json({ message: 'Invalid credentials'})
      }
  
      next();
    }
    catch (error) {
      return res.status(500).json({ error: 'Something went wrong' })
    }
  }
};

export default validateClientSecret