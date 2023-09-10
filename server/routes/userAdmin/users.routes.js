import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = Router();
const prisma = new PrismaClient();

router.get('/user', async (req, res) => {
  try{
    const users = await prisma.sE_User.findMany();
  
    res.json({ result: users })
  }
  catch (error) {
    res.status(500).json({ error: 'Something went wrong' })
  }
});

router.get('/user/:id', async (req, res) => {
  try{
    if(!req?.params?.id) {
      return res.status(400).json({ message: 'A parameter was expected'})
    }

    const existsUser = await prisma.sE_User.findUnique({
      where: {
        id: req.params.id
      }
    });

    if(!existsUser) {
      return res.status(404).json({ message: 'User does not exists' });
    }

    res.json({ result: existsUser });
  }
  catch (error) {
    return res.status(500).json({ message: 'Something went wrong' })
  }
})

router.post('/user', async(req, res) => {
  try{
    const { name, email, password, idRole } = req.body;

    if(!name || !email || !password || !idRole) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const isEmail = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

    if(!isEmail.test(email)) {
      return res.status(400).json({ message: 'The email does not have a valid format' });
    }

    if(password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' })
    }

    const passwordCorrect = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W\_])[A-Za-z\d\W\_]+$/;

    if(!passwordCorrect.test(password)) {
      return res.status(400).json({ message: 'The password must contain at least one capital letter, one number and one special character.' })
    }

    const existsUser = await prisma.sE_User.findFirst({
      where: {
        email: email
      }
    });

    if(existsUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const existsRole = await prisma.sE_Role.findUnique({
      where: {
        id: idRole
      }
    });

    if(!existsRole) {
      return res.status(404).json({ message: 'The role you are trying to assign does not exist' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await prisma.sE_User.create({
      data: {
        name: name,
        email: email,
        hashedPassword: hashedPassword,
        idRol: idRole
      }
    });

    const numbers = '0123456789';
    let randomId = ''

    for (let i = 0; i < 7; i++) {
      const random = Math.floor(Math.random() * numbers.length);
      randomId += numbers.charAt(random);
    }

    await prisma.sE_Role_User.create({
      data:{
        id: randomId,
        idUser: newUser.id,
        idRole: idRole
      }
    });
    
    res.json({ result: newUser });
  }
  catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

router.post('/user/credentials/:id', async(req, res) => {
  try{
    if(!req?.params?.id) {
      return res.status(400).json({ message: 'A parameter was expected' });
    }
  
    const existsUser = await prisma.sE_User.findUnique({
      where: {
        id: req.params.id
      }
    });
  
    if(!existsUser) {
      return res.status(404).json({ message: 'User does not exists' });
    }

    if(existsUser.client_key && existsUser.client_token) {
      return res.status(403).json({ message: 'Already the user credentials were generated' })
    }
  
    const Characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let clientKey = '';
    let clientToken= '';
  
    clientKey += `${existsUser.name.replace(' ', '')}-`;
  
    for(let i = 0; i < 2; i++){
  
      if(i === 0){
        for(let j = 0; j < 10; j++) {
          clientKey += Characters.charAt(Math.floor(Math.random() * Characters.length));
        }
      }
  
      for(let j = 0; j < 5; j++) {
        clientKey += Characters.charAt(Math.floor(Math.random() * Characters.length));
      }
  
      if(i !== 1) {
        clientKey += '-';
      }
    }
  
    for(let i = 0; i < 80; i++){
      clientToken += Characters.charAt(Math.floor(Math.random() * Characters.length));
    }
  
    await prisma.sE_User.update({
      where: {
        id: req.params.id
      },
      data: {
        client_key: clientKey,
        client_token: clientToken
      }
    })
  
    res.json({
      result: {
        client_key: clientKey,
        client_token: clientToken
      }
    });
  }
  catch (error) {
    return res.status(500).json({ message: 'Something went wrong' })
  }
})

router.post('/user/auth/:id', async(req, res) => {
  try{
    if(!req?.params?.id) {
      return res.status(400).json({ message: 'A parameter was expected' });
    }
  
    const existsUser = await prisma.sE_User.findUnique({
      where: {
        id: req.params.id
      }
    });
  
    if(!existsUser) {
      return res.status(404).json({ message: 'User does not exists' });
    }

    if(existsUser.client_secret) {
      return res.status(400).json({ message: 'The client-secret was already generated' });
    }
  
    const clientkey = req.headers['client-key'];
    const clientToken = req.headers['client-token'];
  
    if(!clientkey || !clientToken) {
      return res.status(400).json({ message: 'Bad request, headers are missing' });
    }
  
    if(clientkey !== existsUser.client_key || clientToken !== existsUser.client_token) {
      return res.status(401).json({ message: 'invalid credentials' })
    }
  
    const payload = {
      clientkey,
      clientToken
    }
  
    const secretKey = process.env.SECRET_KEY;
  
    const clientSecret = jwt.sign(payload, secretKey);
  
    await prisma.sE_User.update({
      where: {
        id: req.params.id
      },
      data: {
        client_secret: clientSecret
      }
    })
  
    res.json({ result: clientSecret })
  }
  catch (error) {
    return res.status(500).json(error)
  }
})

router.delete('/user/:id', async(req, res) => {
  try{
    if(!req.params.id) {
      return res.status(400).json({ message: 'A parameter was expected' })
    }
  
    const existsUser = await prisma.sE_User.findUnique({
      where: {
        id: req.params.id
      }
    });
  
    if(!existsUser) {
      return res.status(404).json({ message: 'User does not exists' });
    }
  
    await prisma.sE_Role_User.delete({
      where:{
        idUser: req.params.id
      }
    })

    await prisma.sE_User.delete({
      where: {
        id: req.params.id
      }
    });
  
    res.status(204).end();
  }
  catch (error) {
    return res.status(500).json({ error: 'Something went wrong' })
  }
});

export default router;