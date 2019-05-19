const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track',{useNewUrlParser:true} )

var User;
var userSchema = {
  user:{
    type:String,
    required:true
  },
  exercise:[{description:String, mins:Number, date:Date}]
}
User = mongoose.model('User', userSchema);
/*const date = Date("2018-08-18")
const doc = {user:"abhishek", exercise:[{description:"pushups", mins:15, date:date}]};
const user = new User(doc);
user.save().then(()=>console.log("its is done"));*/

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post("/api/exercise/new-user", (req, res)=>{

  var userReq = req.body.username;
  User.find({user:userReq}, (err, data)=>{
    
    if(Object.keys(data).length === 0)
    {
      let doc = {user: userReq}
      let user = new User(doc);
      user.save().then(()=>console.log("its is done"))
      res.send(user)
    }
    else
    {
      res.send(data);
    }
      
    console.log(Object.keys(data).length);
    
    
  });
  
});

function isValidDate(dateString)
{
    if(dateString == 0)
      return true;
  
    // pattern check
    if(!/^\d{4}\-\d{1,2}\-\d{1,2}$/.test(dateString))
    {console.log("galat exp");return false;}

    // Parse the date parts to integers
    var parts = dateString.split("-");
    var day = parseInt(parts[2], 10);
    var month = parseInt(parts[1], 10);
    var year = parseInt(parts[0], 10);

    // Check the ranges of month and year
    if(year < 1000 || year > 3000 || month == 0 || month > 12)
        return false;

    var monthLength = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];

    // Adjust for leap years
    if(year % 400 == 0 || (year % 100 != 0 && year % 4 == 0))
        monthLength[1] = 29;

    // Check the range of the day
    return day > 0 && day <= monthLength[month - 1];
};


app.post("/api/exercise/add", (req, res)=>{

  var flag = 0
  var desc = req.body.description
  if(desc == 0)
    flag = 1
  
  var id = req.body.userId
  
  var duration = +req.body.duration
  if(duration == 0){console.log(duration, "chala");flag=1}
  
  if(isValidDate(req.body.date))
    var date = new Date(req.body.date)
  else
  {flag = 1;console.log(req.body.date, "date chala")}
  
  console.log(id)
  User.findById(id, (err, data)=>{
  
    console.log(data);
    if(flag==1)
      res.send("invalid data format")
    else if(Object.keys(data).length === 0)
      res.send("id not found in database")
    else
    {
      data.exercise.push({description:desc, mins:duration, date:date})
      data.save().then(()=>{console.log("update successfull")})
      res.send(data)
    }
    
  })
  
})

app.get('/:userId/:bookId?', function (req, res) {
  res.send(req.params)
})

app.get("/api/exercise/log/:id/:from?/:to?/:limit?", (req, res)=>{

  var from  = new Date("2015-12-8")
  var to = new Date("2020-12-8")
  var limit = -1
  
  var query = [req.params.from, req.params.to, req.params.limit]
  if(typeof(query[0])!="undefined")
    from = new Date(query[0])
  if(typeof(query[1])!="undefined")
    to = new Date(query[1])  
  
  User.findById(req.params.id, (err, data)=>{
    
    if(Object.keys(data).length === 0)
      res.send("user not found")
    else
    {
      
      data = data.exercise.sort(function(a, b){
      var keyA = new Date(a.date),
          keyB = new Date(b.date);

      if(keyA < keyB) return -1;
      if(keyA > keyB) return 1;
      return 0;
      });
      
      if(typeof(query[2])!="undefined")
        limit = query[2]
      else
        limit = data.length
      console.log(from, to)
      console.log(typeof(data[0].date), data[0].date, data[1].date)
      console.log(data[0].date.getTime()>=from.getTime(), data[0].date.getTime()<=to.getTime())
      console.log(data[1].date>=from, data[1].date<=to)

      data = data.filter(d => d.date >= from && d.date <= to).slice(0, limit)

      res.send(data)
    }
  })
  
})

app.get("/api/exercise/users", (req, res)=>{
  
console.log("in usersss")
User.find({}).select("user _id").exec((err, data)=>{

  res.send(data);
  
})

})


// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
