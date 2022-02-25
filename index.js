var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var config = require('./config');

function writeIntoFile(data) {
  fs.writeFile('output.txt', data, function (err) {
    if (err) return err.stack;
    console.log('File write done!');
  });
}

function BlogSpider(url, callback) {
  //使用request模块进行爬虫
  request(url, function (err, res) {
    if (err) return err.stack;
    var $ = cheerio.load(res.body.toString());

    var articleList = [];
    $('.articleList .articleCell').each(function () {
      var $me = $(this);
      var $title = $me.find('.atc_title a');
      var $time = $me.find('.atc_tm');

      var item = {
        title: $title.text().trim(),
        url: $title.attr('href'),
        time: $time.text().trim(),
      };

      // 如果推荐图标存在
      var $img = $me.find('.atc_main .atc_ic_f img');
      item.hasRecommand = $img.hasClass('SG_icon');

      // 删选link
      var s = item.url.match(/blog_([a-zA-Z0-9]+)\.html/);
      if (Array.isArray(s)) {
        item.id = s[1];
        articleList.push(item);
      }
    });

    var nextUrl = $('.SG_pgnext a').attr('href');
    if (nextUrl) {
      BlogSpider(nextUrl, function (err, articleList2) {
        if (err) return callback(err);
        callback(null, articleList.concat(articleList2));
      });
    } else {
      callback(null, articleList);
    }
  });
}

BlogSpider(config.url, function (err, articleList) {
  if (err) return console.error(err.stack);
  var listContents = '';
  articleList.map(function (article) {
    //判断是否为新浪推荐文章
    if (article.hasRecommand) {
      listContents += '荐 ';
    }
    listContents +=
      '发表文章：' + article.title + ' 发表时间: ' + article.time + '\n';
  });
  writeIntoFile(listContents);
}); // run `node index.js` in the terminal

console.log(`Hello Node.js v${process.versions.node}!`);
