require("dotenv").config();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mcintht.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.send({ success: false, message: "Unauthorized Access" });
  }
  jwt.verify(token, process.env.CLIENT_SECRET, (error, decoded) => {
    if (error) {
      return res.send({ success: false, message: "Unauthorized Token" });
    }
    req.user = decoded;
    next();
  });
};

// verify email

const verifyEmail = (req, res, next) => {
  const email = req.query.email;
  if (email === req.user.email) {
    next();
  } else {
    return res.send({ success: false, message: "Unauthorized Access" });
  }
};

async function run(app) {
  try {
    // await client.connect();

    // middleware
    app.use(cookieParser());

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("You successfully connected to MongoDB!");

    const EleventhDB = client.db("EleventhDB");
    const BookList = EleventhDB.collection("BookList");
    const BorrowedBooks = EleventhDB.collection("BorrowedBooks");

    // get all books
    app.get("/books/:category", verifyToken, verifyEmail, async (req, res) => {
      const category = req.params.category;
      if (category === "all") {
        const bookCount = await BookList.countDocuments();
        if (!bookCount) {
          res.send({ data: [] });
        } else {
          const cursor = BookList.find();
          const totalBooks = await cursor.toArray();
          res.send({ data: totalBooks });
        }
      } else {
        const BookCategory = [
          "Novel",
          "Sci-Fi",
          "Thriller",
          "History",
          "Drama",
          "Mystery",
        ];
        const findCategory = BookCategory.find((book) => book === category);
        const query = { category: findCategory };
        const bookCount = await BookList.countDocuments(query);
        if (!bookCount) {
          res.send({ data: [] });
        } else {
          const cursor = BookList.find(query);
          const totalBooks = await cursor.toArray();
          res.send({ data: totalBooks });
        }
      }
    });

    // get a book
    app.get("/book/:id", verifyToken,verifyEmail, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const book = await BookList.findOne(query);
      res.send(book);
    });

    // add book
    app.post("/addbook", async (req, res) => {
      const book = req.body;
      const result = await BookList.insertOne(book);
      res.send(result);
    });

    // update a book
    app.put("/updateBook/:id", verifyToken,verifyEmail, async (req, res) => {
      const id = req.params.id;
      const book = req.body;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateBook = { $set: book };
      const result = await BookList.updateOne(query, updateBook, options);
      res.send(result);
    });

    // add book on borrowed book
    app.post("/borrow", verifyToken,verifyEmail, async (req, res) => {
      const book = req.body;
      const { book_id } = book;
      const result = await BorrowedBooks.insertOne(book);
      const updatedResult = await BookList.updateOne(
        { _id: new ObjectId(book_id) },
        { $inc: { quantity: -1 } }
      );
      res.send(updatedResult);
    });

    // remove book from borrowed book
    app.delete("/return", verifyToken, async (req, res) => {
      const body = req.body;
      const { book_id, _id } = body;
      const result = await BorrowedBooks.deleteOne({ _id: new ObjectId(_id) });
      const updatedResult = await BookList.updateOne(
        { _id: new ObjectId(book_id) },
        { $inc: { quantity: +1 } }
      );
      res.send(updatedResult);
    });

    // borrowed book
    app.get("/borrowedbook/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const cursor = BorrowedBooks.find(query);
      const Borrowed = await cursor.toArray();
      res.send(Borrowed);
    });

    // create jwt
    app.post("/jwt", (req, res) => {
      const body = req.body;
      const token = jwt.sign(body, process.env.CLIENT_SECRET, {
        expiresIn: "2 days",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    // clear cookie
    app.post("/jwtout", verifyToken, (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ seccess: true });
    });

    // app.get("/users", async (req, res) => {});
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}

module.exports = { run };
