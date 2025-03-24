require("dotenv").config();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const { MongoClient, ServerApiVersion } = require("mongodb");
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
    req.user = decoded
    next();
  });
};

async function run(app) {
  try {
    await client.connect();

    // middleware
    app.use(cookieParser());

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("You successfully connected to MongoDB!");

    const EleventhDB = client.db("EleventhDB");

    app.post("/jwt", (req, res) => {
      const body = req.body;
      const token = jwt.sign(body, process.env.CLIENT_SECRET, {
        expiresIn: "2 days",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
          sameSite: "strict",
        })
        .send({ success: true });
    });

    app.post("/jwtout", verifyToken, (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,
          secure: false,
          sameSite: "strict",
        })
        .send({ seccess: true });
    });

    // app.get("users", async (req, res) => {});
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}

module.exports = { run };


