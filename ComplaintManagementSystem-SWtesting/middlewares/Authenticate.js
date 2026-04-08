const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decode = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (token == null) return res.sendStatus(401);

    req.user = decode;
    next();
  } catch (error) {
    res.status(401).json({
      message: "Authentication failed",
    });
  }
};

module.exports = { authenticate };
