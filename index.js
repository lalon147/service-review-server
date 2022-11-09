const express = require('express');
const cors = require('cors');
require("dotenv").config();
const jwt=require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app=express()
const port =process.env.PORT  || 5000;

//middle ware 
app.use(cors());
app.use(express.json())

                 //TESTING PURPOSE 
                 app.get("/test",(req,res)=>{
                    res.send("THIS SERVER IS RUNNING")
                   })

                   app.get("/",(req,res)=>{
                    res.send("HELLO WORLD")
                   })


                   //database configaration 
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.gw8hef2.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
const database=client.db("food-master");
const serviceCollection=database.collection("services");
const reviewCollection=database.collection("review");

///VERIFYING THAT THE USER HAVE THE RIGHT OR AUTHENTIC JSONWEBTOKEN
const verifyJwt=(req,res,next)=>{
    // console.log(req.body)
    const authHeader=req.headers.authorization;
    // console.log(authHeader);
    if(!authHeader){
        return res.status(401).send({message:"UNAUTHORIZED USER"})
    }
    const token=authHeader.split(" ")[1];
    // console.log(token)
    //verify ing the token
    jwt.verify(token,process.env.ACCESS_TOKEN,function(err,decoded){
        if(err){
            return res.status(401).send({message:"UNAUTHORIZED ACCESS"})
        }
        req.decoded=decoded;
        next()
    })
}
 
console.log(new Date())
///testing that date object is working ...


const  run=async()=>{
                         try{
                             app.get("/services",async(req,res)=>{ 
                                const count=parseInt(serviceCollection.estimatedDocumentCount())                            
                                let size=3
                                if(req.query.size==="all"){
                                   size=count   
                                }              
                                const cursor= serviceCollection.find({})
                                const services=await cursor.limit(size).toArray()                 
                                res.send(services)                                
                             })


                             app.get("/services/:id",async(req,res)=>{
                                const id=req.params.id;console.log(id);
                                const query={_id:ObjectId(id)}
                                const result=await serviceCollection.findOne(query)
                                console.log(result)
                                res.send(result);
                             })
                             app.post("/jwt",(req,res)=>{                    
                                const user=req.body;
                                console.log(user);
                                const token=jwt.sign(user,process.env.ACCESS_TOKEN,{expiresIn:"1h"})
                                res.send({token})
                             })
                             
                             app.post("/add-a-service",async(req,res)=>{
                                // console.log(req.decoded);
                                const service=req.body;
                                console.log(service);
                                const result=await serviceCollection.insertOne(service);
                                res.send(result);
                             })
                             app.post("/add-a-review",async(req,res)=>{          
                             let review=req.body; 
                              review.added=new Date();         
                             const result=await reviewCollection.insertOne(review);                            
                             res.send(result);
                             })
                             app.get("/review/:id",async(req,res)=>{
                                const id=req.params.id;
                                const sort = { added: -1 };
                                const cursor=reviewCollection.find({serviceId:id}).sort(sort);
                                const result=await  cursor.toArray();
                                res.send(result);
                             })
                             app.get("/my-reviews",verifyJwt,async(req,res)=>{
                                const email=req.query.email;
                                console.log(email)
                                const sort = { added: -1 };
                                const cursor=reviewCollection.find({email:email}).sort(sort)
                                const result=await cursor.toArray()
                                res.send(result)
                             })
                             app.delete("/my-reviews/:id",async(req,res)=>{
                             
                               const id=req.params.id;
                               console.log(id);
                               
                               const query={_id:ObjectId(id)}
                               const result=await reviewCollection.deleteOne(query);
                               res.send(result);

                             })
                             app.put("/update-review/:id",async(req,res)=>{
                               const id=req.params.id;
                               const review=req.body;
                               
                               const query={_id:ObjectId(id)}           
                               const option ={upsert:true};
                               const updatedReview={
                                   $set:{
                                       message:review.message               
                                   }
                               }
                               const result=await reviewCollection.updateOne(query,updatedReview,option);
                               res.send(result);
                             })
                            

                         }
                         finally{

                         }
} 
run().catch(error=>console.log(error))





//listinig port 
app.listen(port,()=>{
    
    console.log(`SERVER IS RUNNING ON ${port}`)
} )
