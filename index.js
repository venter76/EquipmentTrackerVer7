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
app.use(express.static('public'));


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



// mongoose.connect(`mongodb+srv://${db_username}:${db_password}@${db_cluster_url}/${db_name}?retryWrites=true&w=majority`, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// })
// .then(() => {
//   console.log('Connected to MongoDB Atlas');
// })
// .catch((error) => {
//   console.error('Error connecting to MongoDB Atlas:', error);
// });





  const equipmentSchema = new mongoose.Schema({
    itemName: String,
    itemLocation: String,
    status: Number,
    info: [{
      make: String,
      specs: String,
      note: String
    }],
    booked: String,
    theatre: String,
    date: Date,
    colour: String,
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










  
  

  app.get("/", function(req, res){

    Equipment.find({}, 'itemName itemLocation colour')
    .then(data => {
      const itemNames = data.map(item => item.itemName);
      const itemLocations = data.map(item => item.itemLocation);
      const itemColours = data.map(item => item.colour);

      res.render('index', { itemNames, itemLocations, itemColours});
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Internal Server Error');
    });
});





app.get('/detail', (req, res) => {
  const itemName = req.query.itemName;
  
  Equipment.findOne({ itemName }, 'itemName info')
    .then(data => {
      const { itemName, info } = data;
      res.render('detail', { itemName, info });
    })
    .catch(error => {
      console.error(error);
      res.status(500).send('Internal Server Error');
    });
});


app.get('/logo', (req, res) => {
  res.render('logo');
});

app.get('/logo2', (req, res) => {
  res.render('logo2');
});



app.post("/detailmove", async function(req, res) {
  const itemName = req.body.itemName;
  const selectedTheatre = req.body.theatre;
  console.log(selectedTheatre, itemName);


  Equipment.findOneAndUpdate(
    { itemName: itemName }, // Find the document with the specified itemName
    { $set: { itemLocation: selectedTheatre } }, // Update the itemLocation field
    { new: true } // Return the updated document
    ).then(updatedEquipment => {
      console.log(updatedEquipment);
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

app.get('/get-updated-locations', async (req, res) => {
  console.log('Visited the /get-updated-locations route');
  
  // fetch the latest data from your database
  const equipments = await Equipment.find({});
  
  

  // send the data to the client
  res.json(equipments);
});






app.post('/detailbook', async function(req, res) {
  const itemName = req.body.itemName;
  const selectedTheatreBook = req.body.theatreBook;
  const bookingDateTime = req.body.bookingDateTime;


  console.log(itemName, bookingDateTime, selectedTheatreBook);

  

  try {
    const newBooking = await Booking.create({
      itemName: itemName,
      theatre: selectedTheatreBook,
      date: bookingDateTime

      
    });

    console.log('New booking created:', newBooking);
    // Handle success case

    
    res.redirect('/logo2');

  } catch (err) {
    console.log('Error creating booking:', err);
    // Handle error case
  }
});






app.get('/link1', async (req, res) => {
  try {
    const documents = await Booking.find()
      .select("itemName theatre date");

    documents.forEach(function(doc) {
      console.log("itemName:", doc.itemName);
      console.log("theatre:", doc.theatre);
      console.log("date:", doc.date);
    });

    res.render('link1', { documents }); // Pass documents as data to the template
  } catch (err) {
    console.log("Error retrieving documents:", err);
    // Handle the error
  }
});








app.post('/delete', async function(req, res) {
  const itemName = req.body.itemName;

  try {
      // Delete the booking based on the itemName
      const deletedBooking = await Booking.findOneAndDelete({ itemName: itemName });
      console.log('Booking deleted:', deletedBooking);
      // Handle success case
  } catch (err) {
      console.log('Error deleting booking:', err);
      // Handle error case
  }

  try {
    const documents = await Booking.find();
    res.render('link1', { documents });
} catch (err) {
    console.log('Error retrieving documents:', err);
    // Handle the error
}

});

    
    
app.get('/link2', async (req, res) => {
  try {
    const previousDocuments = await Note.find().select('text'); // Retrieve the 'text' field from the Note collection

    res.render('link2', { documents: previousDocuments }); // Pass documents as data to the template
  } catch (err) {
    console.log("Error retrieving documents:", err);
    // Handle the error
  }
});



    // get the new posts from my link2 page
   
    app.post('/link2', async (req, res) => {
      const textParagraph = req.body.textParagraph;
    
      console.log(textParagraph);
    
      try {
        const note = new Note({
          text: textParagraph,
          date: new Date()
        });
    
        await note.save();

        console.log('Note saved:', note);
    res.redirect('/link2'); 
  } catch (error) {
    console.error('Error saving note:', error);
    res.status(500).send('Error saving note');
  }
    });



//Delete my notifications or Posts from link2 page

    app.post('/deletePost', async function(req, res) {
      const itemPost = req.body.text;
    
      try {
          // Delete the booking based on the itemName
          const deletedPost = await Note.findOneAndDelete({ text: itemPost });
          console.log('Booking deleted:', deletedPost);
          // Handle success case
      } catch (err) {
          console.log('Error deleting booking:', err);
          // Handle error case
      }
    
      try {
        const documents = await Note.find();
        res.render('link2', { documents });
    } catch (err) {
        console.log('Error retrieving documents:', err);
        // Handle the error
    }
    
    });
    
        


    


// const record = Equipment.findOne();
// const localNow = new Date(record.date.getTime() - (record.offset * 60000));
// console.log(localNow);

connectDB().then(() => {
  app.listen(PORT, () => {
      console.log("listening for requests");
  })
})




// const port = process.env.PORT || 3000;

// app.listen(port, function(){
//   console.log("Server started on port " + port);
// });


  // app.listen(3000, function(){
  //   console.log("Server started on port 3000")



