import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

router.get('/permissions', async (req, res) => {
  try{
    const permissions = await prisma.sE_Permission.findMany();

    res.json({ result: permissions });
  }
  catch (error) {
    return res.status(500).json({ error: 'Something went wrong' })
  }
});

router.get('/permission/:id', async (req, res) => {
  try{
    if(!req?.params?.id) {
      return res.send(422).json({ message: 'A parameter was expected' })
    }

    const existsPermission = await prisma.sE_Permission.findUnique({
      where: {
        id : req.params.id
      }
    });

    if(!existsPermission) {
      return res.status(404).json({ message: 'Permission does not exist' });
    }

    res.json({ result: existsPermission });
  }
  catch (error) {
    return res.status(500).json({ message: 'Something went wrong' })
  }
});

router.get('/permissions/section', async(req, res) => {
  try{
    if(!req.query.section_name) {
      return res.status(400).json({ message: 'A parameter was expected' });
    }

    const existsSection = await prisma.sE_Permission.findMany({
      where: {
        section: req.query.section_name
      }
    });

    if(existsSection.length === 0) {
      return res.status(404).json({ message: `There is no permission that belongs to the ${req.query.section_name} section` })
    }

    res.json({ result: existsSection});
  }
  catch (error) {
    return res.status(500).json({ message: 'Something went wrong', error: error })
  }
});

router.post('/permission', async (req, res) => {
  const { name, description, section } = req.body;

  try{
    if(!name || !description || !section) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    const hasSpaces = /\s/;

    if(hasSpaces.test(name)){
      return res.status(400).json({ message: 'Names cannot contain spaces' })
    }

    const newPermission = await prisma.sE_Permission.create({
      data: {
        name: name,
        Description: description,
        section: section
      }
    });

    res.json(newPermission);
  }
  catch (error) {
    return res.status(500).json({ error: 'Something went wrong' })
  }
});

export default router;