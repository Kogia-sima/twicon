const https = require('https');
const parser = require('node-html-parser');
const Twitter = require('twitter');

/**
 * GitHubのプロフィールページから直近num日のContribution数を取得する
 * @param {Number} num Contribution数を取得する日数
 * @return {Array} 直近num日のContribution数。日付降順
 */
function fetch(num) {
  const url = "https://github.com/Kogia-sima";

  return new Promise((resolve) => {
    https.get(url, (res) => {
      let body = "";
      res.setEncoding("utf8");

      res.on("data", (chunk) => {
        body += chunk;
      });

      res.on("end", () => {
        const html = parser.parse(body);
        const rects = html.querySelectorAll("svg.js-calendar-graph-svg g rect").slice(-num);
        const counts = Array.prototype.map.call(rects, (v) => {
          return v.attributes['data-count'];
        });
        resolve(counts.reverse());
      });
    }).on("error", (e) => {
      console.log(e);
      resolve(null);
    });
  });
}

/**
 * 指定された文字列をツイートする
 * @param {String} content ツイートする内容
 * @param {Object} settings Twitter API の認証情報
 */
async function post(content, settings) {
  const client = new Twitter(settings);
  const params = {"status": content};
  console.log(params);
  return await client.post('statuses/update', params);
}

/**
 * エントリポイント
 */
async function main(params) {
  try {
    const counts = await fetch(2);

    const content = [
      "*** Contribution Report ***",
      "",
      "Today's contribution: " + counts[0],
      "Yesterday: " + counts[1]
    ].join("\n");
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
