import { Router } from "express";
import { PrismaClient } from "@prisma/client";

import validateRolPermission from "../../middlewares/validateRolPermission.js";
import validateClientSecret from "../../middlewares/validateClientSecret.js";

const router = Router();
const prisma = new PrismaClient();

// Categories
router.get('/category',[validateClientSecret(), validateRolPermission(['Read_Category'])], async(req, res) => {
  try{

    if(req.query.id) {
      const existsCategory = await prisma.sE_Category.findUnique({
        where: {
          id: parseInt(req.query.id)
        },
        include: {
          subCategory: {
            select:{
              id: true,
              name: true,
              description: true
            }
          }
        }
      });
  
      if(!existsCategory) {
        return res.status(404).json({ message: 'Category does not exists' })
      }

      return res.json({ result: existsCategory })
    }

    const categories = await prisma.sE_Category.findMany({
      include: {
        subCategory: {
          select:{
            id: true,
            name: true,
            description: true
          }
        }
      }
    });

    res.json({ result: categories })
  }
  catch (error) {
    return res.status(500).json({ message: 'Something went wrong', error: error })
  }
});

router.post('/category', [validateClientSecret(), validateRolPermission(['Write_Category'])], async(req, res) => {
  try{
    const { name, description, hasSubcategory } = req.body;

    if(!name || !description || !hasSubcategory.toString()) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    const existsCategory = await prisma.sE_Category.findFirst({
      where:{
        name: name
      }
    });

    if(existsCategory) {
      return res.status(400).json({ message: 'Category already exists' })
    }

    const id = Math.floor(Math.random() * (9999999 - 1000000 + 1)) + 1000000;

    const newCategory = await prisma.sE_Category.create({
      data:{
        id: id,
        name: name,
        description: description,
        hasSubcategory: Boolean(hasSubcategory)
      }
    });

    res.status(201).json({ result: newCategory });
  }
  catch (error) {
    return res.status(500).json({ message: 'Something went wrong', error: error })
  }
});

router.patch('/category/:id', [validateClientSecret(), validateRolPermission(['Update_Category'])], async(req, res) => {
  try{

    const { name, description, hasSubcategory } = req.body;

    if(!name || !description || !hasSubcategory.toString()) {
      return res.status(400).json({ message: 'At least one field expected to update' });
    }

    const existsCategory = await prisma.sE_Category.findUnique({
      where: {
        id: parseInt(req.params.id)
      }
    });

    if(!existsCategory) {
      return res.status(404).json({ message: 'Category does not exists' })
    }

    if(Boolean(hasSubcategory) === false && existsCategory.hasSubcategory === true){
      const countSubcategories = await prisma.sE_SubCategory.count({
        where: {
          idCategory : parseInt(req.params.id)
        }
      })

      if(countSubcategories > 0) {
        return res.status(400).json({ message: "You cannot mark this product as 'Does not manage subcategories' since it already has subcategories assigned to it" });
      }
    }

    const updatedCategory = await prisma.sE_Category.update({
      where: {
        id: parseInt(req.params.id)
      },
      data: {
        name: name || name,
        description: description || description,
        hasSubcategory : hasSubcategory || hasSubcategory
      }
    });

    res.json({ message: updatedCategory })
  }
  catch (error) {
    return res.status(500).json({ message: 'Something went wrong', error: error })
  }
});

router.delete('/category/:id', [validateClientSecret(), validateRolPermission(['Delete_Category'])], async(req, res) => {
  try{
    if(!req.params.id) {
      res.status(400).json({ message: 'A parameter was expected' });
    }

    const existsCategory = await prisma.sE_Category.findUnique({
      where: {
        id: parseInt(req.params.id)
      }
    });

    if(!existsCategory) {
      return res.status(404).json({ messgae: 'Category does not exists' });
    }

    await prisma.sE_Category.delete({
      where:{
        id: parseInt(req.params.id)
      }
    });

    res.status(204).end();
  }
  catch (error) {
    return res.status(500).json({ message: 'Somethin went wrong', error: error })
  }
});

// Subcategories

router.get('/category/subcategory', [validateClientSecret(), validateRolPermission(['Read_Subcategory'])], async (req, res) => {
  try{
    if(req.query.id) {
      const existsSubcategory = await prisma.sE_SubCategory.findUnique({
        where: {
          id: parseInt(req.query.id)
        }
      });
  
      if(!existsSubcategory) {
        return res.status(404).json({ message: 'Subcategory does not exists' });
      }
  
      return res.json({ result: existsSubcategory })
    }

    const subCategories = await prisma.sE_SubCategory.findMany();

    res.json({ result: subCategories })
  }
  catch (error) {
    return res.status(500).json({ message: 'Something went wrong', error: error });
  }
});

router.get('/category/:idCategory/subcategory', [validateClientSecret(), validateRolPermission(['Read_Subcategory'])], async(req, res) => {
  try{
    if(!req.params.idCategory) {
      return res.status(400).json({ message: 'A parameter was expected' });
    }

    const existsCategory = await prisma.sE_Category.findUnique({
      where: {
        id: parseInt(req.params.idCategory)
      }
    });

    if(!existsCategory) {
      return res.status(404).json({ message: 'Category does not exists' });
    }

    const subCategories = await prisma.sE_SubCategory.findMany({
      where: {
        idCategory: parseInt(req.params.idCategory)
      }
    });

    res.json({ result: subCategories })
  }
  catch (error) {
    return res.status(500).json({ message: 'Something went wrong',error: error })
  }
});

router.post('/category/subcategory', [validateClientSecret(), validateRolPermission(['Write_Subcategory'])], async(req, res) => {
  try{
    const { name, description, idCategory } = req.body;

    if(!name || !description || !idCategory) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existsSubcategory = await prisma.sE_SubCategory.findFirst({
      where: {
        name: name
      }
    });

    const existsCategory = await prisma.sE_Category.findUnique({
      where: {
        id: idCategory
      }
    });

    if(!existsCategory) {
      return res.status(404).json({ message: 'The category you are trying to create a subcategory for does not exist.' })
    }

    if(existsSubcategory) {
      return res.status(400).json({ message: 'Subcategory already exists' })
    }

    if(existsCategory.hasSubcategory === false) {
      return res.status(400).json({ message: 'The category is marked not to handle subcategories' })
    }

    const id = Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000;

    const newSubcategory = await prisma.sE_SubCategory.create({
      data:{
        id: id,
        name: name,
        description: description,
        idCategory : idCategory
      }
    });

    res.status(201).json({ result: newSubcategory });
  }
  catch (error) {
    return res.status(500).json({ message: 'Something went wrong', error: error })
  }
});

router.patch('/category/subcategory/:id', [validateClientSecret(), validateRolPermission(['Update_Subcategory'])], async(req, res) => {
  try{
    const { name, description } = req.body;

    const existsSubcategory = await prisma.sE_SubCategory.findUnique({
      where: {
        id: parseInt(req.params.id)
      }
    });

    if(!existsSubcategory) {
      return res.status(404).json({ message: 'Subcategory does not exists' });
    }

    const repeatedName = await prisma.sE_SubCategory.findFirst({
      where: {
        name: name
      }
    }); 

    if(repeatedName) {
      return res.status(400).json({ message: `There is already a subcategory with the name ${name}`})
    }

    const updatedSubcategory = await prisma.sE_SubCategory.update({
      where: {
        id: parseInt(req.params.id)
      },
      data: {
        name: name || name,
        description: description || description
      }
    });

    res.json({ updatedSubcategory });
  }
  catch (error) {
    return res.status(500).json({ message: 'Something went wrong', error: error });
  }
});

router.delete('/category/subcategory/:id', [validateClientSecret(), validateRolPermission(['Delete_Subcategory'])], async(req, res) => {
  try{
    const existsSubcategory = await prisma.sE_SubCategory.findUnique({
      where: {
        id: parseInt(req.params.id)
      }
    });

    if(! existsSubcategory) {
      return res.status(404).json({ message: 'Subcategory does not exists' });
    }

    await prisma.sE_SubCategory.delete({
      where: {
        id: parseInt(req.params.id)
      }
    });

    res.status(204).end();
  }
  catch (error) {
    return res.status(500).json({ message: 'Something went wrong', error: error });
  }
});

export default router;