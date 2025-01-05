const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const saltRounds = 10; // You can adjust the salt rounds based on your security preference

const app = express();
const port = process.env.PORT || 5000;

// Middleware setup
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174', 'https://exceltech-aa221.web.app', 'https://exceltech-aa221.firebaseapp.com'],
  credentials: true,
  optionSuccessStatus: 200,
}
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser())
app.use(cors());




// JWT Verify MiddleWare 

const verifyWebToken = (req, res, next) => {
  const token = req.cookies?.token
  if (!token) return res.status(401).send({ message: 'Unauthorized Access' })
  if (token) {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET_KEY, (err, decoded) => {
      if (err) {
        return res.status(401).send({ message: 'Unauthorized Access' })

      }
      console.log(decoded)
      req.user = decoded
      next()

    })

  }
  console.log(token)


}






//   Database Setup 



const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_USERPASS}@cluster0.k9gdz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {


    // DataBase Related Collection 
    const SignUpUserCollection = client.db('Samadhan_Group').collection('Registration_Users')
    const BlogCollection = client.db('Samadhan_Group').collection('Blog')




    //jwt generate

    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET_KEY, {
        expiresIn: '365d'
      })
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      }).send({ success: true })
    })



    // clear token on logout

    app.get('/logout', async (req, res) => {
      try {
        res
          .clearCookie('token', {
            httpOnly: true,
            maxAge: 0,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
          })
          .send({ success: true })
        console.log('Logout successful')
      } catch (err) {
        res.status(500).send(err)
      }
    })





    //   Registration User Information Save Here 

    app.post('/signup', async (req, res) => {
      const { fullName, email, phoneNumber, nationality, role, image, password, fatherName,
        motherName,
        nidNumber,
        gender, dateOfBirth, bloodGroup, referenceId, country, division, district, thana, postOffice, village, general, ward, nidBirthImage, member, payment, transactionId, paymentPhoto,profileId,createDate,createTime } = req.body;

      try {
        // Check if the user already exists by email
        const existingUser = await SignUpUserCollection.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Hash the password if provided
        let hashedPassword = password;
        if (password) {
          hashedPassword = await bcrypt.hash(password, saltRounds); // Salt rounds can be adjusted
        }

        // Insert user data into the User collection
        const newUser = {
          fullName,
          email,
          phoneNumber,
          nationality,
          role,
          image,
          password: hashedPassword,
          fatherName,
          motherName,
          nidNumber,
          gender, dateOfBirth, bloodGroup, referenceId, country, division, district, thana, postOffice, village, general, ward, nidBirthImage, member, payment, transactionId, paymentPhoto,profileId,createDate,createTime
        };

        const result = await SignUpUserCollection.insertOne(newUser);

        if (result.acknowledged) {
          // Send a success response
          res.status(200).json({ success: true, message: 'User created successfully' });
        } else {
          res.status(500).json({ success: false, message: 'Error creating user' });
        }
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });


    //get the signUP user data
    app.get('/signup', async (req, res) => {
      const result = await SignUpUserCollection.find().toArray()
      res.send(result)
    });






    // Blog Publish Here ... 

app.post('/blog', async (req, res) => {
  const { title, description, image, tags, createDate,
    createTime } = req.body;

  // Basic validation
  if (!title || !description || !image || !tags ) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
    // Insert blog post into the database
    const newBlog = { title, description, image, tags,createDate,
      createTime };
    const result = await BlogCollection.insertOne(newBlog);

    if (result.acknowledged) {
      return res.status(200).json({ success: true, message: 'Blog created successfully' });
    } else {
      return res.status(500).json({ success: false, message: 'Error creating blog' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get all blogs
app.get('/blog', async (req, res) => {
  try {
    const blogs = await BlogCollection.find().toArray();
    res.status(200).json(blogs);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});






    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  }

  finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);







// Define a simple route
app.get('/', (req, res) => {
  res.send("Samadhan-Group server is running...");
});



// Global route error handler
app.all('*', (req, res) => {
  res.status(400).json({
    success: false,
    message: 'Route Not Found',
  });
});

// Global Error handle
app.use((error, req, res, next) => {
  if (error) {
    res.status(400).json({
      success: false,
      message: 'Server something went wrong',
    });
  }
  next();
});



// Start the server
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});