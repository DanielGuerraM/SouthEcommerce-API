import { Router } from "express";
import { PrismaClient } from "@prisma/client";

import validateRolPermission from "../../middlewares/validateRolPermission.js";
import validateClientSecret from "../../middlewares/validateClientSecret.js";

const router = Router();
const prisma = new PrismaClient();

router.get('/brand', [validateClientSecret(), validateRolPermission(['Read_Brand'])], async(req, res) => {
  try{
    const brands = await prisma.sE_Brand.findMany();

    res.json({ result: brands })
  }
  catch (error) {
    return res.status(500).json({ message: 'Something went wrong', error: error })
  }
});

router.get('/brand/:id', [validateClientSecret(), validateRolPermission(['Read_Brand'])], async(req, res) => {
  try{
    if(!req.params.id) {
      return res.status(400).json({ message: 'A parameter was expected' })
    }

    const existsBrand = await prisma.sE_Brand.findUnique({
      where: {
        id: parseInt(req.params.id)
      }
    })

    if(!existsBrand) {
      return res.status(404).json({ message: 'Brand does not exists' })
    }

    res.json({ result: existsBrand })
  }
  catch (error) {
    console.log(error)
    return res.status(500).json({ message: 'Something went wrong', error: error });
  }
});

router.post('/brand', [validateClientSecret(), validateRolPermission(['Write_Brand'])], async(req, res) => {
  try{
    const { title, status } = req.body;

    if(!title || !status) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existsBrand = await prisma.sE_Brand.findFirst({
      where:{
        title: title
      }
    })

    if(existsBrand) {
      return res.status(400).json({ message: `There is already a brand with the name: ${title}` })
    }

    const brandsCount = await prisma.sE_Brand.count();
    const autoId = brandsCount === 0 ? 10000 : brandsCount  + 10000

    const newBrand = await prisma.sE_Brand.create({
      data:{
        id: autoId,
        title: title,
        status: status
      }
    })

    res.json({ result: newBrand })
  }
  catch (error) {
    return res.status(500).json({ message: 'Something went wrong', error: error })
  }
});

router.patch('/brand/:id', [validateClientSecret(), validateRolPermission(['Update_Brand'])], async(req, res) => {
  try{  
    if(!req.params.id) {
      return res.status(400).json({ message: 'A parameter was expected' })
    }

    const existsBrand = await prisma.sE_Brand.findUnique({
      where: {
        id: parseInt(req.params.id)
      }
    });

    if(!existsBrand) {
      return res.status(404).json({ message: 'Brand does not exists' });
    }

    if(Boolean(req.body.status) === false) {
      const inactivationDate = new Date();
      const disabledBrand = await prisma.sE_Brand.update({
        where:{
          id: parseInt(req.params.id)
        },
        data:{
          title: req.body.title || title,
          status: false,
          inactivatedAt: inactivationDate
        }
      });

      return res.json({ result: disabledBrand })
    }
    else{
      const reactivatedBrand = await prisma.sE_Brand.update({
        where:{
          id: parseInt(req.params.id)
        },
        data:{
          title: req.body.title || title,
          status: true,
          inactivatedAt: null
        }
      });

      return res.json({ result: reactivatedBrand })
    }
  }
  catch (error) {
    return res.status(500).json({ message: 'Something went wrong', error: error })
  }
});

router.delete('/brand/:id', [validateClientSecret(), validateRolPermission(['Delete_Brand'])], async(req, res) => {
  try{
    if(!req.params.id) {
      return res.status(400).json({ message: 'A parameter was expected' });
    }

    const existsBrand = await prisma.sE_Brand.findUnique({
      where: {
        id: parseInt(req.params.id)
      }
    });

    if(!existsBrand) {
      return res.status(404).json({ message: 'Brand does not exists' });
    }

    await prisma.sE_Brand.delete({
      where: {
        id: parseInt(req.params.id)
      }
    });

    res.status(204).end();
  }
  catch (error) {
    return res.status(500).json({ message: 'Something went wrong', error: error })
  }
});

export default router;