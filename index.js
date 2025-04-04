require('dotenv').config();
const express = require('express')
const cors = require('cors')
const { run } = require('./mongodb')


const app = express()
const PORT =  process.env.PORT || 5000

// middleware 
app.use(cors({
    origin:['http://localhost:5173','https://lithub-library.netlify.app'],
    credentials:true
}))
app.use(express.json())


app.get('/',(req,res)=>{
    res.send('Server is Running')
})

run(app).catch(console.dir);

app.listen(PORT,()=>{
    console.log(`app is running on port ${PORT}`)
})



