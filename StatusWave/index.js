const express = require("express");
const app = express();
const qs = require("qs");
const request = require("request");

app.use(express.static('public'));

var getRequestToken = require('./src/twitter/get-request-token.js');

const config = {
  consumerKey: "Rz63spEaepbrHThkMtr5TJgFj",
  consumerSecret: "1hir1CnQKcH5Ma27EvorqqvRI8vi5F1lgO3jbsTVgM70qB5YII"
}

app.get("/authorize/twitter", (req, res) => {
  console.log("Requesting a refresh token from twitter");
  const callback = (err, data) => {
    if (err) {
      res.statusCode(500);
    }
    console.log("Received refresh token from twitter", data);

    //TODO: Do not return html here, rather return just the request token
    // and it's the client's responsibility to do the redirect
    res.send(
      "<a href='https://api.twitter.com/oauth/authorize?oauth_token=" +
        data.oauth_token +
        "'>Authorize Twitter</a>"
    );
  }

  getRequestToken(callback);

});

app.get("/twitter/callback", (req, res) => {
  var tokenDetails = qs.parse(req.query);

  getAccessToken(
    tokenDetails.oauth_verifier,
    tokenDetails.oauth_token,
    (err, data) => {
      if (err) {
          console.log("error when getting access token", err);
        res.send(
          "<h1>Something went wrong while giving access, please try again.</h1>"
        );
      } else {
        console.log("the access token is: ", data);

        //tweet("Theo Just authorized the StatusWave app",data.oauth_token, data.oauth_token_secret);

        res.json({success:true});

        res.send("<h1>congrats, you have authorized us</h1>");
      }
    }
  );
});

function getAccessToken(oauthVerifier, oauthToken, cb) {
  var oauth = {
    consumer_key: config.consumerKey,
    consumer_secret: config.consumerSecret,
    token: oauthToken // in the documentation this says that it should be oauth_token but that does not work, it should just be token like the other requests and then it works.
  };
  request.post(
    {
      url: "https://api.twitter.com/oauth/access_token",
      oauth: oauth,
      qs: { oauth_verifier: oauthVerifier }
    },
    function(error, response, body) {
      if (error) {
        console.log(error);
        cb(error);
        return;
      }

      var data = qs.parse(body);
      cb(null, data);
    }
  );
}

app.listen(3000, () =>
  console.log("The server started correctly and is listening on port 3000!")
);

function tweet(message, token, tokenSecret) {
  const url = "https://api.twitter.com/1.1/statuses/update.json";

  var oauth = {
    consumer_key: config.consumerKey,
    consumer_secret: config.consumerSecret,
    token: token,
    token_secret: tokenSecret
  };

  console.log("tweeting with ouath deatils", oauth);

  var options = {
    url: url,
    oauth: oauth,
    qs: { status: message }
  };

  request.post(options, function(err, httpResponse, body) {
    console.log("http response code", httpResponse.statusCode);
    console.log("http response body", httpResponse.body);

    if (err) {
      console.log(err);
    }
  });
}