const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const moment = require('moment');
require('dotenv').config();

const MongoStore = require('connect-mongo');
const bcrypt = require('bcryptjs');
const flash = require('connect-flash');




const fixedHashedPassword = process.env.FIXED_HASHED_PASSWORD;

function isItemReturned(itemName, selectedTheatre) {

// Define the validNames arrays inside the function
const validNamesC = [
  "Ultrasound C",
  "V/L-scope C",
  "Transport Stack C",
  "Level 1 rapid infuser A",
  "ECG machine1",
  "INVOS C"
];

const validNamesD = [
  "Transport Stack D"
];

const validNamesU = [
  "Ultrasound U",
  "V/L-scope U",
  "Transport Stack U",
  "INVOS U"
];

const validNamesH = [
  "Ultrasound H",
  "V/L-scope H",
  "Transport Stack H"
];

const validNamesC2A = [
  "V/L-scope C2A"
];


  const storeLocations = {
    'C': validNamesC,
    'D': validNamesD,
    'U': validNamesU,
    'H': validNamesH,
    'C2A': validNamesC2A
  };

  // Check if the selectedTheatre is a key in the storeLocations object
  if (storeLocations[selectedTheatre]) {
    return storeLocations[selectedTheatre].includes(itemName);
  }

// If the item isn't found in the above lists and the selectedTheatre is 'Store'
if (selectedTheatre === 'Store') {
  return true; // Item is considered returned if it's in the 'Store'
}


  return false;
}


  

const app = express();
const PORT = process.env.PORT || 3000

app.set('view engine', 'ejs');

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
const session = require('express-session');


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


//Session cookie setup:


app.set('trust proxy', 1);

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ 
    mongoUrl: `mongodb+srv://${db_username}:${db_password}@${db_cluster_url}/${db_name}?retryWrites=true&w=majority`,
    }),
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // must be 'none' to enable cross-site delivery
      httpOnly: true, // prevents JavaScript from making changes
      maxAge: 1000 * 60 * 60 * 24 * 7 * 3 // 3 weeks
    }
  }));

// After you've set up your sessions
app.use(flash());

// Make sure to pass the flash messages into your context for the view
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  next();
});



  
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name']
  },
  surname: {
    type: String,
    required: [true, 'Please provide your surname']
  }
  // removed the password field
});

const User = mongoose.model('User', userSchema);




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
    userName: String, // Add this field to store the user's name
    base: String,
    date: {
      type: Date,
      default: Date.now
    }
  });
  
  const Move = mongoose.model('Move', moveSchema);
  




  


  const rosterSchema = new mongoose.Schema({
    
      description: String,
      staff: String
  
    });
      

  
  const Roster = mongoose.model('Roster', rosterSchema);


  const tokenSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    tokenNumber: {
      type: Number,
      default: 0
    }
  });
  
  const Token = mongoose.model('Token', tokenSchema);
  
  



  app.get('/checkOnline', (req, res) => {
    console.log('Entered checkOnline route');
    res.status(200).send('Online');
});


app.get('/login', (req, res) => {
  res.render('login', { error: req.flash('error') });
});





app.post('/login', async (req, res) => {
  const { name, surname, password } = req.body;
  const fixedPasswordHash = process.env.FIXED_PASSWORD_HASH;

  console.log('Login attempt:', { name, surname });

  try {
    let user = await User.findOne({ name, surname });
    console.log('User found:', user);

    if (!user) {
      console.log('No existing user found, creating new user');
      const hashedPassword = await bcrypt.hash(password, 10);
      user = new User({ name, surname, password: hashedPassword });
      await user.save();
      console.log('New user created:', user);
    }

    const isMatch = user.password 
                    ? await bcrypt.compare(password, user.password)
                    : await bcrypt.compare(password, fixedPasswordHash);
    console.log('Password match:', isMatch);

    if (isMatch) {
      req.session.userId = user._id;
      req.session.userName = user.name;
      console.log('Session before save:', req.session);

      req.session.save(err => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).send('An error occurred saving the session.');
        }
        console.log('Session saved successfully.');
        return res.redirect('/');
      });
    } else {
      console.log('Password does not match for user:', name);
      req.flash('error', 'Incorrect password.');
      res.redirect('/login');
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).send('An error occurred during the login process.');
  }
});


app.get("/", function(req, res){
  // Check if user is logged in by looking for session userId
  if (req.session.userId) {
    // User is logged in, fetch equipment data and render the index page
    Equipment.find({}, 'itemName itemLocation colour number')
    .sort({ number: 1 })  // Sort by 'number' in ascending order
    .then(data => {
     
      const itemNames = data.map(item => item.itemName);
      const itemLocations = data.map(item => item.itemLocation);
      const itemColours = data.map(item => item.colour);
      const itemNumbers = data.map(item => item.number);
      // Render the index page with equipment data
      res.render('index', { itemNames, itemLocations, itemColours, itemNumbers });
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Internal Server Error');
    });
  } else {
    // User is not logged in, render the login page
    res.render('login', { message: req.flash('loginMessage') });
  }
});
 

  
app.get('/detail', (req, res) => {
  const itemName = req.query.itemName;
  const userName = req.session.userName; // Retrieve the user's name from the session

  // Get yesterday's date at 12:00:00 (noon)
  const start = new Date();
  start.setDate(start.getDate() - 3); // This sets the date to yesterday
  start.setHours(12, 0, 0, 0); // This sets the time to noon

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
      // Include userName in the object passed to res.render
      res.render('detail', { itemName, info, moves, userName });
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
  const tokenAwarded = req.query.tokenAwarded === 'true';
  res.render('logo', { tokenAwarded: tokenAwarded });
});


app.post("/detailmove", async function(req, res) {
  const itemName = req.body.itemName;
  const selectedTheatre = req.body.theatre;
  const userName = req.session.userName; // Retrieve the user's name from the session

  try {
    await Equipment.findOneAndUpdate(
      { itemName: itemName },
      { $set: { itemLocation: selectedTheatre } },
      { new: true }
    );

    const base = isItemReturned(itemName, selectedTheatre) ? 'returned' : 'not returned';
    const move = new Move({
      itemName: itemName,
      theatre: selectedTheatre,
      userName: userName,
      base: base,
      date: new Date()
    });

    await move.save();

    let tokenAwarded = false;

    // Count the total number of moves
    const totalMoves = await Move.countDocuments();
    // console.log("Total Moves:", totalMoves);
    if ((totalMoves % 4) === 0) {
      let userToken = await Token.findOne({ userId: req.session.userId });

      if (userToken) {
        userToken.tokenNumber += 1;
        await userToken.save();
      } else {
        userToken = new Token({
          userId: req.session.userId,
          tokenNumber: 1
        });
        await userToken.save();
      }

      tokenAwarded = true;
      console.log("Token awarded in /detailmove:", tokenAwarded);
      console.log(`Prize token awarded to ${userName}. Total tokens: ${userToken.tokenNumber}`);
    }

// Redirect with the tokenAwarded flag
res.redirect(`/logo?tokenAwarded=${tokenAwarded}`);

  } catch (error) {
    console.error('Error in /detailmove:', error);
    res.status(500).send('An error occurred');
  }
});




app.post("/detailreturn", async function(req, res) {
  const itemNamereturn = req.body.itemName.trim();
  const userName = req.session.userName;

  // console.log(`itemNamereturn: ${itemNamereturn}`);
    
  let selectedReturn; // Use let because the value might change

  const validNamesC = [
    "Ultrasound C",
    "V/L-scope C",
    "Transport Stack C",
    "Level 1 rapid infuser A",
    "ECG machine1",
    "INVOS C"
];

const validNamesD = [
  "Transport Stack D"
]

const validNamesU = [
    "Ultrasound U",
    "V/L-scope U",
    "Transport Stack U",
    "INVOS U"
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
} else if (validNamesD.includes(itemNamereturn)) {
    selectedReturn = 'D';
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

    const base = 'returned'; // Assigning the value to a variable


      const move = new Move({
      itemName: itemNamereturn,
      theatre: selectedReturn,
      userName: userName,
      base: base, // Indicating that the item has been returned to its base 
      date: new Date()
});

console.log(`Item returned status in theatre:`, base);
// Save the Move document
await move.save();

let tokenAwarded = false;

    // Count the total number of moves
    const totalMoves = await Move.countDocuments();
    // console.log("Total Moves:", totalMoves);
    if ((totalMoves % 4) === 0) {
      let userToken = await Token.findOne({ userId: req.session.userId });

      if (userToken) {
        userToken.tokenNumber += 1;
        await userToken.save();
      } else {
        userToken = new Token({
          userId: req.session.userId,
          tokenNumber: 1
        });
        await userToken.save();
      }

      tokenAwarded = true;
      console.log("Token awarded in /detailmove:", tokenAwarded);
      console.log(`Prize token awarded to ${userName}. Total tokens: ${userToken.tokenNumber}`);
    }

// Redirect with the tokenAwarded flag
res.redirect(`/logo?tokenAwarded=${tokenAwarded}`);


});



app.get('/token', async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login'); // Redirect to login if the user is not logged in
  }

  try {
    // Fetch tokens and populate the 'userId' field with user data from the 'User' collection
    const allUserTokens = await Token.find({}).populate('userId', 'name');

    // Transform data to include userName and tokenNumber
    const tokenData = allUserTokens.map(token => ({
      userName: token.userId.name, // Assuming 'name' is the field in the 'User' collection
      tokenNumber: token.tokenNumber
    }));

    res.render('token', {
      tokenData: tokenData
    });
  } catch (error) {
    console.error('Error in /token:', error);
    res.status(500).send('An error occurred');
  }
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






