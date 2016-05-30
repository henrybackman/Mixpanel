var request = require('request');
var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var mixpanelToken = "505e0aca1a9073af6350f1ceb1720ca2";
var apiKey = '5e18fbececdd8989d785ac749312b3c9';
var targetUrl = 'http://api.mixpanel.com/engage/';
var apiKeyPart = "&api_key=" + apiKey;


mongoose.connect("mongodb://localhost/spendlead-dev");

var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));

db.once("open", function() {
  console.log("we\"re connected!");

  var userSchema = Schema({
    client: {type: Schema.Types.ObjectId, ref: "Client", index: true},
    group: {type: Schema.Types.ObjectId, ref: "Group"},
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    name: {type: String},
    email: {type: String, lowercase: true, unique: true, required: true},
    company: {
      idRef: {type: Schema.Types.ObjectId},
      name: {type: String, required: true},
      country: {
        code: {type: String},
        name: {type: String}
      }
    },
    role: {type: String, enum: ["buyer", "marketer"]},
    created: {type: Date, default: Date.now}
  });

  var User = mongoose.model("User", userSchema);


  User.find({status: 'active'})
    .exec(function (err, users) {
      if (err) return console.log(err);
      console.log('number of users:', users.length);
      var userName;

      function sendUser(userProperties, i) {
        var base64properties = new Buffer(JSON.stringify(userProperties)).toString("base64");
        var dataPart = '?data=' + base64properties;

        setTimeout(function() {
          var fullImportRequest = targetUrl + dataPart;
          // console.log(i, fullImportRequest);

          function reqCallback(error, response, body) {
            console.log('reqCallback error, body', error, body);
          }

          request(fullImportRequest, reqCallback);

        }, i * 100);
      };

      for (var i = users.length - 1; i >= 0; i--) {
        var user = users[i];
        var userProperties = {
          '$token': mixpanelToken,
          '$distinct_id': user._id,
          '$ip': 0,
          '$ignore_time': true,
          '$set': {
            '$first_name': user.firstName,
            '$last_name': user.lastName,
            '$email': user.email,
            'Sign-up - Complete': user.created.toISOString(),
            'Sign-up - Start': user.created.toISOString(),
            'Role': user.role,
            'Client': user.company.name
          }
        };

        sendUser(userProperties, i);
      }

    });

});


