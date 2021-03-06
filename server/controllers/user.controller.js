const User = require("../models/user.model");
const asyncMiddleware = require("../utils/asyncMiddleware");
const rc_controller = require("../controllers/rc.controller");
const api = require("../utils/api");

const getCachedApiAuth = request => request.app.locals.apiAuth;

exports.user_create = function(req, res, next) {
  let user = new User({
    id: req.body.id,
    channelId: req.body.channelId,
    name: req.body.name,
    password: req.body.password,
    authToken: req.body.authToken
  });

  user.save(function(err) {
    if (err) {
      return next(err);
    }
    res.send("User Created successfully");
  });
};

exports.user_login = function(req, res, next) {
  const loginDetails = {
    user: req.body.username,
    password: req.body.password
  };

  rc_controller.rc_user_login(loginDetails, res);
};

exports.get_user_by_prefix = asyncMiddleware(async function(req, res) {
  try {
    const authSetBot = getCachedApiAuth(req);
    const fields = { name: 1, username: 1 };
    const query = {
      active: true,
      $and: [
        {
          type: "user"
        },
        {
          roles: {
            $nin: ["bot"]
          }
        }
      ],
      name: {
        $regex: encodeURIComponent(req.body.name),
        $options: "i"
      }
    };

    const endPointUrl = api.url(
      `users.list?fields=${JSON.stringify(fields)}&query=${JSON.stringify(
        query
      )}`
    );
    const usersRetrieved = await api.api(
      endPointUrl,
      "get",
      authSetBot.authToken,
      authSetBot.userId
    );
    if (!usersRetrieved.success) {
      throw "Unable to get list of user from rocket chat";
    }

    const users = usersRetrieved.users.map(x => {
      return {
        _id: x._id,
        name: x.name,
        username: x.username
      };
    });

    res.status(200).send({
      users
    });
  } catch (error) {
    res.status(500).send({ error });
  }
});
