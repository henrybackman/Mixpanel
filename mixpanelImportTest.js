var request = require('request');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost/spendlead-dev');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('we\'re connected!');
  var postSchema = Schema({
    clientId: {type: Schema.Types.ObjectId, ref: 'Client', index: true, required: true},
    group: {type: Schema.Types.ObjectId, ref: 'Group', index: true},
    user: {type: Schema.Types.ObjectId, ref: 'User', index: true, required: true},
    state: {type: String, enum: ['draft', 'posted'], default: 'posted'},
    audience: {
      products: [{
        id: {type: Schema.Types.ObjectId, ref: 'Product', required: true},
        code: {type: String, index: true, required: true}
      }],
      areas: [{
        code: {type: String, required: true},
        name: {type: String, required: true}
      }]
    },
    content: {type: {type: String} },
    created: {type: Date, default: Date.now, required: true, index: true}
  });

  var Post = mongoose.model('Post', postSchema);

  var userSchema = Schema({
    client: {type: Schema.Types.ObjectId, ref: 'Client', index: true},
    group: {type: Schema.Types.ObjectId, ref: 'Group'},
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
    role: {type: String, enum: ['buyer', 'marketer']},
    created: {type: Date, default: Date.now}
  });

  var User = mongoose.model('User', userSchema);



  Post.find({state: 'posted' })
    .populate('user')
    .exec(function (err, posts) {
    if (err) return console.error(err);
    console.log('number of posts: ', posts.length);

    var importPosts = [];
    var trackProperties = {'$ip': 0};
    var mixpanelToken = '505e0aca1a9073af6350f1ceb1720ca2';
    var apiKey = '5e18fbececdd8989d785ac749312b3c9';

    for (var i = posts.length - 1; i >= 0; i--) {
      post = posts[i];

      var createTime = Math.floor(post.created / 1000); // Unix timestamp

      trackProperties['distinct_id'] = post.user._id;
      trackProperties['time'] = createTime;
      trackProperties['token'] = mixpanelToken;

      var postType;
      var postAction;
      if (post.type === 'draft') {
        postType = 'Draft';
        postAction = 'Draft';
      } else {
        postType = 'Post';
        postAction = 'Publish';
      }

      var contentType = post.content.type;
      contentType = contentType.charAt(0).toUpperCase() + contentType.slice(1); // Capitalise

      trackProperties['Post - Draft / Post'] = postType;
      trackProperties['Post - Action'] = postAction;
      trackProperties['Post - Content type'] = contentType;
      trackProperties['User - Role'] = post.user.role;
      trackProperties['User - Client'] = post.user.company.name;

      // create post
      importPosts.push(trackProperties);
      // console.log('post user', post.user);
      // console.log('post', post);
      console.log('trackProperties', trackProperties);
      var base64properties = new Buffer(JSON.stringify(trackProperties)).toString('base64');
      console.log('Base64', base64properties);

      var targetUrl = 'http://api.mixpanel.com/import/';
      var dataPart = '?data=' + base64properties;
      var apiKeyPart = '&api_key=' + apiKey;
      var fullImportRequest = targetUrl + dataPart + apiKeyPart;

      console.log(fullImportRequest);
      // console.log('Base64:', btoa())

      // new Buffer("Hello World").toString('base64')
    }

    // console.log('importPosts', importPosts);
    process.exit(-1);
  });

});
