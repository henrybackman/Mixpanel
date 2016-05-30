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

  var User = mongoose.model('User', userSchema);

  var invitationSchema = Schema({
    relation: {type: String},
    sender: {type: Schema.Types.ObjectId, ref: 'User'},
    created: {type: Date},
    joined: {type: Date},
    status: {type: String},
    recipient: {
      user: {type: Schema.Types.ObjectId, ref: 'User'}
    }
  });

  var Invitation = mongoose.model('Invitation', invitationSchema);


  Invitation.find({ joined: {$gte: new Date(2015,1,1)}, 'recipient.user': {$exists: true} })
    .populate('sender')
    .populate('recipient.user')
    .exec(function (err, invitations) {
      if (err) return console.log(err);
      console.log('number of invitations:', invitations.length);
      var userName;

      function updateUser(userProperties, i) {
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

      for (var i = invitations.length - 1; i >= 0; i--) {
        var invitation = invitations[i];
        // console.log('invitation', invitation);

        var setProperties = {};

        if (isInternalUser(invitation.sender)) { setProperties['Invitations - From SpendLead'] = true; }
        if (invitation.sender.role === 'buyer') { setProperties['Invitations - From Buyer'] = true; }
        if (invitation.sender.role === 'marketer') { setProperties['Invitations - From Marketer'] = true; }
        if (invitation.sender.email.split('@').pop() === invitation.recipient.user.email.split('@').pop()) {
          setProperties['Invitations - From Inside'] = true;
        }
        if (!setProperties['Invitations - From Inside']) { setProperties['Invitations - From Outside'] = true; }

        var userProperties = {
          '$token': mixpanelToken,
          '$distinct_id': invitation.recipient.user._id,
          '$ip': 0,
          '$ignore_time': true,
          '$set': setProperties
        };

        // console.log('userProperties', userProperties);
        updateUser(userProperties, i);
      }

      function isInternalUser(user) {
        var internal = false;
        if (user.email.split('@').pop() === 'spendlead.com') { internal = true; }
        if (user.email === 'elebot@winwindeal.com') { internal = true; }
        return internal;
      }

    });

});


