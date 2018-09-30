const express = require("express");
const exphbs = require("express-handlebars");

const bodyParser = require("body-parser");
const logger = require("morgan");
const mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
const axios = require("axios");
const cheerio = require("cheerio");

// Require all models
const db = require("./models");

const PORT = 3000;

// Initialize Express
const app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));


const path = require('path');
// view engine setup
// Use Handlebars as default express template engine
app.engine('handlebars', exphbs({defaultLayout: 'layout'}));
app.set('view engine', 'handlebars');


// Connect to the Mongo DB
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/robotics";
mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

// Routes

// A GET route for scraping the echoJS website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with request
  axios.get("http://news.mit.edu/topic/robotics").then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    const $ = cheerio.load(response.data);

    // console.log($("ul.view-news-items").find("li.views-row").text());

    const news = [];
    console.log( $("li.views-row").length);
    $("li.views-row").each(function (i, element) {
      news[i] = $(this).text()
      const result = {};
      result.title = $(this)
        .find("h3 a")
        .text()

      result.link = $(this)
        .find("h3 a")
        .attr("href")

      result.summary = $(this)
        .find("p.dek")
        .text()

      result.imageUrl = $(this)
        .find("img")
        .attr("src")

      console.log(result);
      // db.Article.update(_query_, _update_, { upsert: true });
      //
      db.Article.create(result)
        .then(function(dbArticle) {
          // View the added result in the console
          console.log(dbArticle);
        })
        .catch(function(err) {
          // If an error occurred, send it to the client
          return res.json(err);
        });


    })


    // If we were able to successfully scrape and save an Article, send a message to the client
    res.send("Scrape Complete");
    console.log(news);
  });

});

app.get('/', function (req, res) {
  db.Article.find({})
    .then(function(dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      console.log(dbArticle);
      res.render('index', {articles: dbArticle, title: 'MIT Robotics'});
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.render(err);
    });
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  // Grab every document in the Articles collection
  db.Article.find({})
    .then(function(dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      res.render('index', {articles: dbArticle, title: 'MIT Robotics'});
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.render(err);
    });
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
