var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var request = require("request");
var cheerio = require("cheerio");
var path = require("path");

var Article = require('./models/Article.js');
var Notet = require('./models/Note.js');

var PORT = 3000;

var app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({ extended: false }))

var exphbs = require('express-handlebars');
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.use(bodyParser.urlencoded({
  extended: false
}));

mongoose.connect("mongodb://heroku_b1mlgqrb:mhrho7mckmfhrehfqm3psnj04d@ds051953.mlab.com:51953/heroku_b1mlgqrb");
var db = mongoose.connection;

db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

db.once("open", function() {
  console.log("Mongoose connection successful.");
});

var router = express.Router();
app.use('/', router);
router.get('/', function(req, res) {
  res.redirect('/articles');
});

router.get('/scrape', function(req, res) {
  request("http://www.espn.com/", function(error, response, html) {
    var $ = cheerio.load(html);

    $("article").each(function(i, element){
      var result = {};

      result.title = $(this).children("header").children("h1").children("a").text();
      if (result.title != "" && result.title != null) {
        result.link = $(this).children("header").children("h1").children("a").attr("href");
        result.summary = $(this).children(".item__content").children(".entry-summary").children("p").text();
        
        Article.findOne({title: result.title}, function(err, doc) {
          if (doc == null) {
            var entry = new Article(result);

            entry.save(function(err, doc) {
              if (err) {
                console.log(err);
              }
              else {
                console.log(doc);
              }
            });
          }
          else {
            console.log('Already in DB');
          }
        });
      }
    });
  });
  res.send("Scrape Complete");
});

router.get('/articles', function(req, res) {
  Article.find(function(err, doc) {
    articlesObject = {articles: doc};
    res.render('index', articlesObject);
  });
});

router.get('/articles/:id', function(req, res) {
  Article.findOne({_id: req.params.id})
  .populate("notes")
  .exec(function(err, doc) {
    console.log(doc);
    articleObject = {article: doc};
    res.render('article', articleObject);
  });
});


router.post('/articles/:id/note/create', function(req, res) {
  var newNote = new Note(req.body);

  newNote.save(function(err, doc) {
    if (err) {
      console.log(error);
    }
    else {
      Article.findOneAndUpdate({"_id": req.params.id}, {$push: {"notes": doc._id}}, {new: true})
      .exec(function(err, doc) {
        if (err) {
          console.log(err);
        }
        else {
          res.redirect('/articles/' + req.params.id);
        }
      });
    }
  });
});


router.post('/articles/note/:id2/delete', function(req, res) {
  
  var noteId = req.params.id2;

  Note.findByIdAndRemove(NoteId, function(err, doc) {
    if (err) {
      console.log(err);
    } 
    else {
      
      res.redirect('back');
    }
  });
});


app.listen(PORT, function() {
  console.log('App listening on PORT: ' + PORT);
});



