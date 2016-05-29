var request = require('request');

var mixpanelToken = "505e0aca1a9073af6350f1ceb1720ca2";
var apiKey = '5e18fbececdd8989d785ac749312b3c9';

var distinct_id = '571dbab4f449bc194017ab67';
var eventName = 'Clicked a post';

var trackProperties = {"$ip": 0, 'Click - Type': 'test'};
trackProperties["distinct_id"] = distinct_id;
trackProperties["time"] = 1463402573;
trackProperties["token"] = mixpanelToken;


var event = {
  'event': eventName,
  'properties': trackProperties
};

console.log("event object:", event);

var base64properties = new Buffer(JSON.stringify(event)).toString("base64");

var targetUrl = "http://api.mixpanel.com/import/";
var dataPart = "?data=" + base64properties;
var apiKeyPart = "&api_key=" + apiKey;
var fullImportRequest = targetUrl + dataPart + apiKeyPart;

console.log(fullImportRequest);

// var requestOptions = {
//   url: fullImportRequest
// };


function reqCallback(error, response, body) {
  console.log('reqCallback');
  console.log('error', error);
  console.log('body', body);
}

request(fullImportRequest, reqCallback);

// process.exit(-1);