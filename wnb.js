//
//  RTD2 - Twitter bot that tweets about the most popular github.com news
//  Also makes new friends and prunes its followings.
//
var restclient = require('node-restclient');
var Bot = require('twit/examples/bot')
  , config1 = require('./config1');

var WordPOS = require('wordpos'),
    wordpos = new WordPOS();

console.log('WNB: Running.');

var bot = new Bot(config1);
var mostPopularTweet;
var mostPopularNews;
var alreadyTweeted = [];

//get date string for today's date (e.g. '2011-01-01')
function datestring () {
  var d = new Date(Date.now() - 5*60*60*1000);  //est timezone
  return d.getUTCFullYear()   + '-'
     +  (d.getUTCMonth() + 1) + '-'
     +   d.getDate();
};

function getBeiberTweet() {

  bot.twit.get('search/tweets', {  q: 'from:justinbieber', count: 100 }, function(err, reply) {
    if(err) return handleError(err)
    
    mostPopularTweet = null;
    var highestPopularity = 0;
    
    for (var i = reply.statuses.length; i--;) {
      if (alreadyTweeted.indexOf(reply.statuses[i].id) == -1 &&
        reply.statuses[i].text.search('selfie') == -1) {
        var popularity = reply.statuses[i].retweet_count + reply.statuses[i].favorite_count;
        if (popularity > highestPopularity) {
          highestPopularity = popularity;
          mostPopularTweet = reply.statuses[i]
        }
      }
    }

    if (mostPopularTweet != null) {
      alreadyTweeted.push(mostPopularTweet.id);
      getWorldNews();
    }
  });
  
}

function getWorldNews() {
  console.log(  datestring() );
  bot.twit.get('search/tweets', { q: 'worldnews', lang: 'en', since: datestring(), result_type: 'popular', count: 100 }, function(err, reply) {
    if(err) return handleError(err);

    mostPopularNews = null;
    var highestPopularity = 0;
    
    for (var i = reply.statuses.length; i--;) {
      if (alreadyTweeted.indexOf(reply.statuses[i].id) == -1) {
        var popularity = reply.statuses[i].retweet_count + reply.statuses[i].favorite_count;
        if (popularity > highestPopularity) {
          highestPopularity = popularity;
          mostPopularNews = reply.statuses[i]
        }
      }
    }

    if (mostPopularNews != null) {
      alreadyTweeted.push(mostPopularNews.id);
      swapWords();
    }
  });

}

// insert your Wordnik API info below

function swapWords() {

  var tweet = mostPopularTweet.text;
  var news = mostPopularNews.text;

  var replacedWords = [];

  var regex = new RegExp("([-a-zA-Z0-9^\\p{L}\\p{C}\\u00a1-\\uffff@:%_\\+.~#?&//=]{2,256}){1}(\\.[a-z]{2,4}){1}(\\:[0-9]*)?(\\/[-a-zA-Z0-9\\u00a1-\\uffff\\(\\)@:%,_\\+.~#?&//=]*)?([-a-zA-Z0-9\(\)@:%,_\\+.~#?&//=]*)?", "ig");

  tweetUrl = tweet.match(regex);
  if (tweetUrl) {
    for (var i = 0; i < tweetUrl.length; i++) {
      tweet = tweet.replace(tweetUrl[i], '');
    }
  }
  tweet = tweet.replace('  ', ' ');
  tweet = tweet.trim();

  newsUrl = news.match(regex);
  if (newsUrl) {
    for (var i = 0; i < newsUrl.length; i++) {
      news = news.replace(newsUrl[i], '');
    }
  }
  news = news.replace('  ', ' ');
  news = news.trim();
  
  // console.log( tweet );
  // console.log( news );

  // return;

  // console.log( " --- " );

  var tweetAdjectives = [];
  var tweetVerbs = [];
  var tweetNouns = [];
  var tweetAdverbs = [];

  var newsAdjectives = [];
  var newsVerbs = [];
  var newsNouns = [];
  var newsAdverbs = [];

  noSwapWords = [
    "i", "us", "don", "you", "he", "she", "it", "they", "not", "is", "want", "un", 
  ]

  // twitterWords = [];
  function performSwap(tweetWords, newsWords) {
    for (var i = 0; i < tweetWords.length; i++) {
      for (var j = 0; j < newsWords.length; j++) {
        if (tweet.indexOf(tweetWords[i]) != -1 &&
          replacedWords.indexOf(newsWords[j]) == -1 &&
            noSwapWords.indexOf(tweetWords[i]) == -1 &&
            noSwapWords.indexOf(newsWords[i]) == -1
          ) {
          tweet = tweet.replace(tweetWords[i], newsWords[j]);
          replacedWords.push(newsWords[j])
        }

      }
    }
  }


  wordpos.getAdjectives(tweet, function(result){
    tweetAdjectives = result;
    wordpos.getVerbs(tweet, function(result){
      tweetVerbs = result;
      wordpos.getNouns(tweet, function(result){
        tweetNouns = result;
        wordpos.getAdverbs(tweet, function(result){
          tweetAdverbs = result;
          wordpos.getAdjectives(news, function(result){
            newsAdjectives = result;
            wordpos.getVerbs(news, function(result){
              newsVerbs = result;
              wordpos.getNouns(news, function(result){
                newsNouns = result;
                wordpos.getAdverbs(news, function(result){
                  newsAdverbs = result;
                  // performSwap(tweetAdjectives, newsAdjectives);
                  performSwap(tweetNouns, newsNouns);
                  performSwap(tweetVerbs, newsVerbs);
                  // performSwap(tweetAdverbs, newsAdverbs);

                  // if (newsUrl) {
                  //   for (var i = 0; i < newsUrl.length; i++) {
                  //     tweet += ' ' + newsUrl[i];
                  //   }
                  // }
                  if (tweet.length < 80) {
                    tweet += ' https://twitter.com/justinbieber/status/' + mostPopularTweet.id_str
                  }

                  // bot.tweet(tweet, function (err, reply) {
                  //   if(err) return handleError(err);
                  // })
                  console.log( tweet );

                  // console.log( tweet );
                  // console.log( mostPopularTweet );
                  console.log('tweetAdjectives', tweetAdjectives);
                  console.log('tweetVerbs', tweetVerbs);
                  console.log('tweetNouns', tweetNouns);
                  console.log('newsAdjectives', newsAdjectives);
                  console.log('newsVerbs', newsVerbs);
                  console.log('newsNouns', newsNouns);
                  console.log('newsAdverbs', newsAdverbs);
                  console.log( " ### " );

                });
              });
            });
          });
        });
      });
    });
  });

}


// function sendTweet() {
//   

//   // bot.twit.get('followers/ids', function(err, reply) {
//   //   if(err) return handleError(err)
//   //   console.log('\n# followers:' + reply.ids.length.toString());
//   // });
//   // var rand = Math.random();

//   // if(rand <= 0.55) { //  make a friend
//   //   bot.mingle(function(err, reply) {
//   //     if(err) return handleError(err);

//   //     var name = reply.screen_name;
//   //     console.log('\nMingle: followed @' + name);
//   //   });
//   // } else {                  //  prune a friend
//   //   bot.prune(function(err, reply) {
//   //     if(err) return handleError(err);

//   //     var name = reply.screen_name
//   //     console.log('\nPrune: unfollowed @'+ name);
//   //   });
//   // }
// }



setInterval(function() {
  getBeiberTweet();
// }, 1000);
}, 5 * 600.00);
getBeiberTweet();

function handleError(err) {
  console.error('response status:', err.statusCode);
  console.error('data:', err.data);
}
