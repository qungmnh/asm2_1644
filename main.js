var express = require('express')
var app = express()
var session = require('express-session')
var MongoClient = require('mongodb').MongoClient
var url = 'mongodb+srv://duc:harriS140902@cluster0.aazzgnx.mongodb.net/test'

app.set('view engine', 'hbs')
app.use(express.urlencoded({ extended: true }))

function isAuthenticated(req, res, next) {
    let validate = !req.session.userName
    if (validate)
        res.redirect('/dologin')
    else
        next()
}

app.use(session({
    secret: 'my secret *&(^(%%#^@(!)!@@',
    resave: false
}))

app.get('/', isAuthenticated, (req, res) => {
    let accessCount = req.session.accessCount || 0
    accessCount++
    req.session.accessCount = accessCount
    let isAuthenticated = !req.session.userName
    res.render('index',{'name': req.session.userName,'accessCount': accessCount, 'isAuthenticated': isAuthenticated})
})

app.get('/new', (req, res) => {
    res.render("newProduct")
})

app.post('/newProduct', async (req, res) => {
    let name = req.body.txtName
    let price = req.body.txtPrice
    let picture = req.body.txtPicture
    let description = req.body.txtDescription
    if (name.length <= 5) {
        res.render('newProduct', { 'nameError': 'Name cannot be less than 5 characters!' })
        return
    }

    let product = {
        'name': name,
        'price': price,
        'picture': picture,
        'description': description,
    }
    let server = await MongoClient.connect(url)
    let dbo = server.db("ATNToysShop")
    await dbo.collection("product").insertOne(product)
    res.render('index')
})

app.get('/viewAll', async (req, res) => {
    //1. ket noi den server co dia chi trong url
    let server = await MongoClient.connect(url)
    //truy cap Database ATNToys
    let dbo = server.db("ATNToysShop")
    //get data
    let products = await dbo.collection('product').find().toArray()
    res.render('allProduct', { 'products': products })
})

app.post('/search', async (req, res) => {
    let name = req.body.txtName

    let server = await MongoClient.connect(url)
    let dbo = server.db("ATNToysShop")
    let products = await dbo.collection('product').find({ 'name': new RegExp(name, 'i') }).toArray()
    res.render('allProduct', { 'products': products })
})


app.get('/doLogin', (req, res) => {
    res.render("login", { 'name': req.session.userName, 'pass': req.session.password })
})

app.post('/login', async (req, res) => {
    let name = req.body.txtUser
    let pass = req.body.txtPass
    req.session.userName = name
    req.session.passWord = pass
    if (name.length <= 5) {
        res.render('login', { 'nameError': 'Name cannot be less than 5 characters!' })
        return
    }
    let server = await MongoClient.connect(url)
    let dbo = server.db("ATNToysShop")
    let result = await dbo.collection('users').find({ $and: [{ 'name': name, 'pass': pass }] }).toArray()
    if (result.length > 0) {
        res.redirect('/')
    } else {
        res.write('Wrong username or password')
        res.end()
    }
    res.render('index', { 'name': req.session.userName, 'pass': req.session.passWord })
})


app.get('/register',(req,res)=>{
    res.render('register', { 'name': req.session.userName, 'pass': req.session.password })
})

app.post('/registers', async (req, res) => {
    let name = req.body.txtUser
    let pass = req.body.txtPass
    let users = {
        'name': name,
        'pass': pass,
    }
    let server = await MongoClient.connect(url)
    let dbo = server.db("ATNToysShop")
    await dbo.collection("users").insertOne(users)
    res.render('login')
})

app.get('/logout',(req,res)=>{
    req.session.userName = null
    req.session.save((err)=>{
        req.session.regenerate((err2)=>{
            res.redirect('/')
        })
    })
})

app.get('/back',(req,res)=>{
    req.session.userName = null
    req.session.save((err)=>{
        req.session.regenerate((err2)=>{
            res.redirect('/')
        })
    })
})

const PORT = process.env.PORT || 3000
app.listen(PORT)
console.log('Server is running')