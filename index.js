const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const moment = require('moment');
require('dotenv').config();

  

const app = express();
const PORT = process.env.PORT || 3000

app.set('view engine', 'ejs');

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));



const db_username = process.env.DB_USERNAME;
const db_password = process.env.DB_PASSWORD;
const db_cluster_url = process.env.DB_CLUSTER_URL;
const db_name = process.env.DB_NAME;


const connectDB = async () => {
  try {
    const conn = await mongoose.connect(`mongodb+srv://${db_username}:${db_password}@${db_cluster_url}/${db_name}?retryWrites=true&w=majority`, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB Atlas:', conn.connection.host);
  } catch (error) {
    console.error('Error connecting to MongoDB Atlas:', error);
    process.exit(1);
  }
};





  const equipmentSchema = new mongoose.Schema({
    itemName: String,
    itemLocation: String,
    colour: String,
    number: Number,
    });
  
  
  
  const Equipment = mongoose.model('Equipment', equipmentSchema);





  const bookingSchema = new mongoose.Schema({
    itemName: String,
    theatre: String,
    date: Date
  });
  
  const Booking = mongoose.model('Booking', bookingSchema);


  const moveSchema = new mongoose.Schema({
    itemName: String,
    theatre: String,
    date: {
      type: Date,
      default: Date.now
    }
  });
  
  const Move = mongoose.model('Move', moveSchema);




  const noteSchema = new mongoose.Schema({
    text: String,
    date: {
      type: Date,
      default: Date.now
    }
  });
  
  const Note = mongoose.model('Note', noteSchema);


  const rosterSchema = new mongoose.Schema({
    
      description: String,
      staff: String
  
    });
      

  
  const Roster = mongoose.model('Roster', rosterSchema);



  app.get('/checkOnline', (req, res) => {
    console.log('Entered checkOnline route');
    res.status(200).send('Online');
});


 

  
  

  app.get("/", function(req, res){

   

    Equipment.find({}, 'itemName itemLocation colour number')
    .sort({ number: 1 })  // Sort by 'number' in ascending order
    .then(data => {
     
      const itemNames = data.map(item => item.itemName);
      const itemLocations = data.map(item => item.itemLocation);
      const itemColours = data.map(item => item.colour);
      const itemNumbers = data.map(item => item.number);
      res.render('index', { itemNames, itemLocations, itemColours, itemNumbers});
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Internal Server Error');
    });
});



app.get('/detail', (req, res) => {
  const itemName = req.query.itemName;

  // Get today's date at 00:00:00
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  // Get today's date at 23:59:59
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const promises = [
    Equipment.findOne({ itemName }, 'itemName info'),
    Move.find({
      itemName,
      date: {
        $gte: start,
        $lt: end,
      },
    }),
  ];

  Promise.all(promises)
    .then(([equipment, moves]) => {
      const { itemName, info } = equipment;
      res.render('detail', { itemName, info, moves });
    })
    .catch(error => {
      console.error(error);
      res.status(500).send('Internal Server Error');
    });
});



app.get('/manifest.json', (req, res) => {
  res.sendFile(`${__dirname}/manifest.json`);
});

app.get('/service-worker.js', (req, res) => {
  res.sendFile(`${__dirname}/service-worker.js`);
});





app.get('/logo', (req, res) => {
  res.render('logo');
});





app.post("/detailmove", async function(req, res) {
  const itemName = req.body.itemName;
  const selectedTheatre = req.body.theatre;
  // console.log(selectedTheatre, itemName);


  Equipment.findOneAndUpdate(
    { itemName: itemName }, // Find the document with the specified itemName
    { $set: { itemLocation: selectedTheatre } }, // Update the itemLocation field
    { new: true } // Return the updated document
    ).then(updatedEquipment => {
      // console.log(updatedEquipment);
    });


      const move = new Move({
      itemName: itemName,
      theatre: selectedTheatre,
      date: new Date()
});

// Save the Move document
await move.save();

  


res.redirect("/logo");



});


app.post("/detailreturn", async function(req, res) {
  const itemNamereturn = req.body.itemName.trim();

  // console.log(`itemNamereturn: ${itemNamereturn}`);
    
  let selectedReturn; // Use let because the value might change

  const validNamesC = [
    "Ultrasound C",
    "V/L-scope C",
    "Transport Stack C",
    "Level 1 rapid infuser A",
    "ECG machine1"
];

const validNamesU = [
    "Ultrasound U",
    "V/L-scope U",
    "Transport Stack U"
];

const validNamesH = [
    "Ultrasound H",
    "V/L-scope H",
    "Transport Stack H"
];

const validNamesC2A = [
    "V/L-scope C2A"
];

if (validNamesC.includes(itemNamereturn)) {
    selectedReturn = 'C';
} else if (validNamesU.includes(itemNamereturn)) {
    selectedReturn = 'U';
} else if (validNamesH.includes(itemNamereturn)) {
    selectedReturn = 'H';
} else if (validNamesC2A.includes(itemNamereturn)) {
    selectedReturn = 'C2A';
} else {
    selectedReturn = 'Store'; // Default value
}


  // console.log(selectedReturn); // This will print the value to the console

  Equipment.findOneAndUpdate(
    { itemName: itemNamereturn }, // Find the document with the specified itemName
    { $set: { itemLocation: selectedReturn } }, // Update the itemLocation field
    { new: true } // Return the updated document
    ).then(updatedEquipment => {
      // console.log(updatedEquipment);
    });


      const move = new Move({
      itemName: itemNamereturn,
      theatre: selectedReturn,
      date: new Date()
});

// Save the Move document
await move.save();

  


res.redirect("/logo");


});



   
    app.get('/rosterset', async function(req, res) {
      const rosters = await Roster.find({});
      res.render('rosterset', {rosters: rosters});
  });
  
    
  app.post('/rosterchange', function(req, res) {
    const description = req.body.description;
    const staffName = req.body.staff;

   
    // Render the 'rosterchange' view and pass the description and staffName values to it
    res.render('rosterchange', {description: description, staff: staffName});
});

 
app.post('/rosterupdate', async function(req, res) {
  const newStaffName = req.body.newStaffName;
  const description = req.body.description;

  try {
      // Find the document in the database using the description
      let foundRoster = await Roster.findOne({ description: description });

      // If the document is found, update the staff field
      foundRoster.staff = newStaffName;
      
      // Save the updated document back to the database
      let updatedRoster = await foundRoster.save();

      console.log(updatedRoster);

      // Redirect the user to '/rosterset'
      res.redirect('/rosterset');

  } catch (err) {
      console.log(err);
  }
});



  
    
  

    

  
 
  



connectDB().then(() => {
  app.listen(PORT, () => {
      console.log("listening for requests");
  })
})






