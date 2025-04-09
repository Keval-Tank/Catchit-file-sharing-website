const { Server } = require('socket.io');
const express = require('express');
const http = require('http');
const cors = require('cors');
const multer = require("multer")
const { diskStorage } = require('multer');
const path = require('path')
// const { fileURLToPath } = require('url');
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
const app = express();
app.use(cors({ 
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
}));
app.use(express.json({ limit: "1gb" }));
app.use(express.urlencoded({extended:true, limit: "1gb"}));
app.use(express.static(path.join(__dirname,"public")));

let fileData={}

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "https://catchit-keval-1.onrender.com",
        methods: ["GET", "POST"]
    }
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/serverFiles')
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.originalname + '-' + uniqueSuffix+path.extname(file.originalname))
    }
})

const upload= multer({storage: storage,
    limits: { fileSize: 1*1024 * 1024 * 1024 }})
//     const storage = multer.memoryStorage()
// const upload = multer({ storage: storage })

app.use(cors());
app.get("/",(req,res)=>{
    res.send("working")
})
app.post("/send-file",upload.single('files'),(req,res)=>{
    console.log(req.file)
    console.log(req.body.code)
    if(!fileData[req.body.code]){
        fileData[req.body.code]=[];
    }
    fileData[req.body.code].push(req.file)
    
    console.log(fileData)
    res.json({files:req.file})
})

app.get("/receive/:code",(req,res)=>{
    const code = req.params.code;
    console.log(code)
    console.log(fileData[code])
    res.status(200).json({files:fileData[code]})
})
app.get("/download/:fileName/:originalName",(req,res)=>{
    res.download(`./public//serverFiles/${req.params.fileName}`,req.params.originalName,(err)=>{
        if(err){
            console.log(err)
            res.status(500).json({message:"heiii file not foind"})
        }
    })
})

io.on('connection', (socket) => {
    socket.on('sender-joined', () => {
        console.log('Sender Joined');
        socket.emit("SJ",{data:"sender joind"});
    });

    socket.on('file-send', (data) => {
        console.log("sent")
        io.emit("file-sent", {files:data.files})
    })

    socket.on('reciever-joined', () => {
        console.log('Reciever Joined');
        socket.emit("RJ",{data:"reciever joind"});
    })
});

server.listen(3000, () => {console.log("listening on 3000")});