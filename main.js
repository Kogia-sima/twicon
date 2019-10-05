const scraperjs = require('scraperjs');
const Twitter = require('twitter');

function fetch(num) {
  const url = "https://github.com/Kogia-sima";

  return new Promise((resolve) => {
    scraperjs.StaticScraper.create(url).scrape(($) => {
      const rects = $("svg.js-calendar-graph-svg > g rect").slice(-num);

      const counts = Array.prototype.map.call(rects, (v) => {
        return $(v).attr("data-count");
      });

      resolve(counts.reverse());
    });
  });
}

function post(content, settings) {
  const client = new Twitter(settings);
  const params = {"status": content};
  console.log(params);
  return new Promise((resolve) => {
    client.post('statuses/update', params, (err, tweet, response) => {
      if (err) {
        resolve(err);
      } else {
        resolve(response);
      }
    });
  });
}

async function main(params) {
  try {
    const counts = await fetch(3);

    const content = [
      "*** Contribution Report ***",
      "===========================",
      "Today's contribution: " + counts[0],
      "Yesterday: " + counts[1],
      "Yesterday: " + counts[2]
    ].join("\n");;
    console.log(content);

    const api_settings = {
      consumer_key: params.consumer_key,
      consumer_secret: params.consumer_secret,
      access_token_key: params.access_token_key,
      access_token_secret: params.access_token_secret
    };
    const response = await post(content, api_settings);
    console.log(response);
  } catch (err) {
    console.log(err);
    return err;
  }
}

module.exports = main;

if (require.main === module) {
  main({});
}
