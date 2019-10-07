const fs = require('fs');
const ChartjsNode = require('chartjs-node');
const https = require('https');
const parser = require('node-html-parser');
const Twitter = require('twitter');

const backgroundFixPlugin = {
  beforeDraw: function (chart, easing, options) {
    var ctx = chart.chart.ctx;
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, chart.width, chart.height);
    ctx.restore();
  }
};

function getChartConfig(data, labels) {
  return {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'GitHub Contribution',
          data: data,
          borderColor: "rgba(75,192,192,1)",
          backgroundColor: "rgba(75,192,192,0.2)"
        }
      ],
    },
    options: {
      title: {
        display: true,
        text: 'Daily Contributions'
      },
      legend: {
        display: false
      },
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: true
          }
        }]
      },
    },
    plugins: [backgroundFixPlugin]
  }
}

async function drawChart(data, labels) {
  const chart = new ChartjsNode(600, 400);
  const chartConfig = getChartConfig(
    data,
    getRecentDays(7)
  );

  await chart.drawChart(chartConfig);
  return await chart.getImageBuffer('image/jpeg');
}

function formatDate(date) {
  return (date.getMonth() + 1) + '/' + date.getDate();
}

function getRecentDays(num) {
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - num + 1);
  const dates = [formatDate(baseDate)];

  for (let i = 1; i < num; ++i) {
    const date = new Date(baseDate.getTime());
    date.setDate(date.getDate() + i);
    dates.push(formatDate(date));
  }

  return dates;
}

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

async function postWithMedia(content, buffer, settings) {
  const client = new Twitter(settings);
  const media = await client.post('media/upload', {media: buffer});
  const params = {
    'status': content,
    'media_ids': media.media_id_string
  };
  console.log(params);
  return await client.post('statuses/update', params);
}

/**
 * エントリポイント
 */
async function main(params) {
  try {
    const counts = await fetch(7);
    const labels = getRecentDays(7);
    const buffer = await drawChart(counts, labels);
    fs.writeFileSync('testimage.jpg', buffer);

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
    const tweet = await postWithMedia(content, buffer, api_settings);
    console.log(tweet);
  } catch (err) {
    console.log(err);
    return err;
  }
}

module.exports = main;

if (require.main === module) {
  main({});
}
