var request = require('request');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost/spendlead-dev');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('we\'re connected!');
  var schema = {
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
  };

  var PostSchema = new Schema(schema);
  var Post = mongoose.model('Post', PostSchema);

  Post.find({state: 'posted' },function (err, posts) {
    if (err) return console.error(err);
    console.log('number of posts: ', posts.length);

    var importPosts = [];
    var trackProperties = {'$ip': 0};
    var mixpanelToken = '505e0aca1a9073af6350f1ceb1720ca2';

    for (var i = posts.length - 1; i >= 0; i--) {
      post = posts[i];

      var createTime = Math.floor(post.created / 1000); // Unix timestamp

      trackProperties['distinct_id'] = post.user;
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

      // create post
      importPosts.push(trackProperties);
      // console.log('post user', post.user);
      console.log('post', post);
      console.log('trackProperties', trackProperties);
    }

    // console.log('importPosts', importPosts);
    process.exit(-1);
  });

});
