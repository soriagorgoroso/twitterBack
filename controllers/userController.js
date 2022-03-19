const User = require("../models/User");
const Tweet = require("../models/Tweet");
const { format } = require("date-fns");
const jwt = require("jsonwebtoken");
const { findById } = require("../models/User");

// show profile
async function show(req, res) {
  try {
    const postUser = await User.findOne({ username: req.params.username });
    const tweets = await Tweet.find({ author: postUser._id }).populate("author");
    const formattedDate = format(postUser.createdAt, "MMMM yyyy");

    res.status(200).json({ postUser, formattedDate, tweets });
  } catch (error) {
    console.log(error.message);
    res.status(404).json({ message: "error" });
  }
}
// Store a newly created resource in storage.
async function store(req, res) {
  try {
    const newUser = new User(req.body);
    await newUser.save();
    res.status(200).json({ message: "usuario creado" });
  } catch (error) {
    console.log(error);
    res.json({ message: "ocurrió un error" });
  }
}
//************************************************ */
async function toggleFollowings(req, res) {
  try {
    const selectedUser = await User.findById({ _id: req.params.id });
    const followersList = selectedUser.followers;
    const userId = req.user.sub;

    if (followersList.indexOf(userId) < 0) {
      const userLogged = await User.findByIdAndUpdate(
        userId,
        { $push: { following: selectedUser._id } },
        { returnOriginal: false },
      );
      const userFollow = await User.findByIdAndUpdate(
        selectedUser._id,
        {
          $push: { followers: userId },
        },
        { returnOriginal: false },
      );
      res.status(200).json({ userLogged, userFollow });
    } else {
      const userLogged = await User.findByIdAndUpdate(
        userId,
        {
          $pull: { following: { $in: [selectedUser._id] } },
        },
        { returnOriginal: false },
      );
      const userFollow = await User.findByIdAndUpdate(
        selectedUser._id,
        {
          $pull: { followers: { $in: [userId] } },
        },
        { returnOriginal: false },
      );

      res.status(200).json({ userLogged, userFollow });
    }
  } catch (error) {
    res.json({ message: error });
  }
}

//*************    Generar y borrar token    login/logout    ************************* */

async function getToken(req, res) {
  try {
    const user = await User.findOne({ username: req.body.username });

    if (user && (await user.validPassword(req.body.password))) {
      const token = jwt.sign({ sub: user.id }, process.env.ACCESS_TOKEN_SECRET);

      await User.updateOne({ _id: user.id }, { $push: { tokens: token } });
      res.status(200).json({
        id: user.id,
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        avatar: user.avatar,
        token: token,
      });
    } else {
      res.status(401).json({ message: "error" });
    }
  } catch (error) {
    res.json({ message: error });
  }
}

async function deleteToken(req, res) {
  try {
    const tokenBearer = req.headers.authorization.split(" ");
    token = tokenBearer[1];

    await User.findByIdAndUpdate(req.user.sub, { $pull: { tokens: token } });

    res.status(200).json({ message: "logout ok" });
  } catch (error) {
    res.json({ message: error });
  }
}

// Otros handlers...
// ...

module.exports = {
  show,
  store,
  toggleFollowings,
  getToken,
  deleteToken,
};
