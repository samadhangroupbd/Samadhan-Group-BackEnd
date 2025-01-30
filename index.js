const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId, Admin } = require('mongodb');
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
    const ProductCollection = client.db('Samadhan_Group').collection('Product')




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
        gender, dateOfBirth, bloodGroup, referenceId, country, division, district, thana, postOffice, village, general, ward, nidBirthImage, member, payment, transactionId, paymentPhoto, profileId, aproval, createDate, createTime, endDate, ...membershipData } = req.body;

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
          gender, dateOfBirth, bloodGroup, referenceId, country, division, district, thana, postOffice, village, general, ward, nidBirthImage, member, payment, transactionId, paymentPhoto, profileId, aproval, createDate, createTime, endDate, ...membershipData, // Include membership type and cost in form data
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






    app.get('/user-details/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await SignUpUserCollection.findOne(query);
      res.send(result);
    });



    // PUT: Admin update details
    app.put('/User-Admin/:id', async (req, res) => {
      const { id } = req.params;
      const updatedData = req.body;  // Get the updated flight data from the request body

      try {
        // Validate the ID (MongoDB ObjectId)
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ message: 'Invalid flight ID' });
        }


        const result = await SignUpUserCollection.updateOne(
          { _id: new ObjectId(id) }, // Find the flight by ID
          { $set: updatedData } // Update the flight with new data
        );

        if (result.matchedCount === 0) {
          return res.status(404).send({ message: 'Flight not found' });
        }

        res.status(200).send({ message: 'Flight updated successfully' });

      } catch (error) {
        console.error('Error updating flight:', error);
        res.status(500).send({ message: 'An error occurred while updating the flight.' });
      }
    });



    // Backend: Delete Flight (DELETE)
    app.delete('/UserAdmin-delete/:id', async (req, res) => {
      try {
        const { id } = req.params; // Extract the Flight ID from URL parameters

        // Delete the Flight from the database
        const result = await SignUpUserCollection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount > 0) {
          res.status(200).send({ message: 'Flight deleted successfully' });
        } else {
          res.status(404).send({ message: 'Flight not found' });
        }
      } catch (error) {
        res.status(500).send({ message: 'An error occurred while deleting the Flight.', error });
      }
    });





    // Backend Route (PUT Request to Approve Admin)
    app.put('/approve-admin/:id', async (req, res) => {
      const { id } = req.params;

      try {
        // Validate the ID (MongoDB ObjectId)
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ message: 'Invalid admin ID' });
        }

        // Find the admin by ID and update the 'aproval' status
        const result = await SignUpUserCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { aproval: "approved" } } // Set 'aproval' field to "approved"
        );

        if (result.matchedCount === 0) {
          return res.status(404).send({ message: 'Admin not found' });
        }

        res.status(200).send({ message: 'Admin approved successfully' });

      } catch (error) {
        console.error('Error approving admin:', error);
        res.status(500).send({ message: 'An error occurred while approving the admin.' });
      }
    });



    // Backend Route (PUT Request to Approve member)
    app.put('/approve-member/:id', async (req, res) => {
      const { id } = req.params;

      try {
        // Validate the ID (MongoDB ObjectId)
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ message: 'Invalid admin ID' });
        }

        // Find the admin by ID and update the 'aproval' status
        const result = await SignUpUserCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { aproval: "approved" } } // Set 'aproval' field to "approved"
        );

        if (result.matchedCount === 0) {
          return res.status(404).send({ message: 'Admin not found' });
        }

        res.status(200).send({ message: 'Admin approved successfully' });

      } catch (error) {
        console.error('Error approving admin:', error);
        res.status(500).send({ message: 'An error occurred while approving the admin.' });
      }
    });










    // Blog Publish Here ... 

    app.post('/blog', async (req, res) => {
      const { title, description, image, tags, createDate,
        createTime } = req.body;

      // Basic validation
      if (!title || !description || !image || !tags) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
      }

      try {
        // Insert blog post into the database
        const newBlog = {
          title, description, image, tags, createDate,
          createTime
        };
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






    // Product Collection Here

    // Product Publish Here ... 

    app.post('/product', async (req, res) => {
      const { productName, description, image, price, category, createDate,
        createTime } = req.body;

      // Basic validation
      if (!productName || !description || !image || !price || !category) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
      }

      try {
        // Insert product post into the database
        const newProduct = {
          productName, description, image, price, category, createDate,
          createTime
        };
        const result = await ProductCollection.insertOne(newProduct);

        if (result.acknowledged) {
          return res.status(200).json({ success: true, message: 'product created successfully' });
        } else {
          return res.status(500).json({ success: false, message: 'Error creating product' });
        }
      } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
      }
    });



    // Get all products
    app.get('/product', async (req, res) => {
      try {
        const blogs = await ProductCollection.find().toArray();
        res.status(200).json(blogs);
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });



    // Production details 
    app.get('/product/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await ProductCollection.findOne(query);
      res.send(result);
    });



    // Backend: Delete product (DELETE)
    app.delete('/product-delete/:id', async (req, res) => {
      try {
        const { id } = req.params; // Extract the product ID from URL parameters

        // Delete the product from the database
        const result = await ProductCollection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount > 0) {
          res.status(200).send({ message: 'product deleted successfully' });
        } else {
          res.status(404).send({ message: 'product not found' });
        }
      } catch (error) {
        res.status(500).send({ message: 'An error occurred while deleting the product.', error });
      }
    });



    // PUT: product update details
    app.put('/product-update/:id', async (req, res) => {
      const { id } = req.params;
      const updatedData = req.body;  // Get the updated product data from the request body

      try {
        // Validate the ID (MongoDB ObjectId)
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ message: 'Invalid product ID' });
        }


        const result = await ProductCollection.updateOne(
          { _id: new ObjectId(id) }, // Find the product by ID
          { $set: updatedData } // Update the product with new data
        );

        if (result.matchedCount === 0) {
          return res.status(404).send({ message: 'product not found' });
        }

        res.status(200).send({ message: 'product updated successfully' });

      } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).send({ message: 'An error occurred while updating the product.' });
      }
    });




    // approve renew subscription 

    app.put('/approve-renew-subscription/:id', async (req, res) => {
      const { id } = req.params;

      try {
        // Validate the ID (MongoDB ObjectId)
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ message: 'Invalid member ID' });
        }

        // Find the admin by ID and update the 'aproval' status
        const result = await SignUpUserCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { paymentApprove: "yes" } } // Set 'aproval' field to "approved"
        );

        if (result.matchedCount === 0) {
          return res.status(404).send({ message: 'Subscription not found....' });
        }

        res.status(200).send({ message: 'Subscription approved successfully' });

      } catch (error) {
        console.error('Error approving admin:', error);
        res.status(500).send({ message: 'An error occurred while approving the Subscription.' });
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