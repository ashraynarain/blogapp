const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const uploadMiddleware = multer({dest:'uploads/'});
const fs = require('fs');
const Post = require('./models/Post');

app.use(cors({credentials:true,origin:'http://localhost:3000'}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads',express.static(__dirname+'/uploads'));
const salt = bcrypt.genSaltSync(10);
const secret = 'aeraaheioh3298g9ga$62&t3ja';

mongoose.connect('mongodb+srv://blog:blog123@cluster0.a52xg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
.then(()=>console.log("Connected to MongoDB"))
.catch(err=>{
    console.error("Connection error to MongoDb",err);
});



app.post('/register',  async (req,res)=>{
    const {username,password} = req.body;
    try{
        const userDoc = await User.create({username,password:bcrypt.hashSync(password,salt)});
        res.json(userDoc);
    }
    catch(e){
        res.status(400).json(e);
    }
    
});
app.post('/login', async(req,res)=>{
    const {username,password} = req.body;
    const userDoc = await User.findOne({username});
    const passOk = userDoc ? bcrypt.compareSync(password,userDoc.password):false;
    if(passOk){
        jwt.sign({username,id:userDoc._id},secret,{},(err,token)=>{
            if(err) throw err;
            res.cookie('token',token).json({
                id:userDoc._id,
                username,
            });
        });
    }else{
        res.status(400).json('Wrong Credentials');
    }
});
app.get('/profile',(req,res)=>{
    const {token} = req.cookies;

    jwt.verify(token,secret,{},(err,info)=>{
        if(err) throw err;
        res.json(info);
    })
});
app.post('/logout',(req,res)=>{
    res.cookie('token','').json('ok');
});
app.post('/post', uploadMiddleware.single('file'),async (req,res)=>{
    const {originalname,path} = req.file;
    const parts = originalname.split('.');
    const ext = parts[parts.length -1];
    const newPath = path+'.'+ext;
    fs.renameSync(path,newPath);

    const {token} = req.cookies;

    jwt.verify(token,secret,{}, async (err,info)=>{
        if(err) throw err;
        const {title,summary,content} = req.body;
        const postDoc = await Post.create({
            title,
            summary,
            content,
            cover:newPath,
            author: info.id
        });
        res.json(postDoc);
    });
});
app.get('/post',async (req,res)=>{
    const posts = await Post.find()
    .populate('author',['username'])
    .sort({createdAt:-1})
    .limit(15);
    res.json(posts);
})
app.listen(4000);
//blog123
//mongodb+srv://blog:blog123@cluster0.a52xg.mongodb.net/?retryWrites=true&w=majority