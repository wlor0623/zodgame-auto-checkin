import { appendFileSync } from "fs";

// POST 请求固定 URL
const SIGN_IN_PAGE_URL = "https://zodgame.xyz/plugin.php?id=dsu_paulsign:sign";
const CHECKIN_URL = SIGN_IN_PAGE_URL + "&operation=qiandao&infloat=1&inajax=1";
// 签到心情
const MOODS = ["kx", "ng", "ym", "wl", "nu", "ch", "fd", "yl", "shuai"];
const MOODS_LENGTH = MOODS.length;

const baseHeaders = {
  accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "accept-language": "zh-CN,zh-TW;q=0.9,zh;q=0.8,en-US;q=0.7,en;q=0.6",
  "cache-control": "max-age=0",
  "content-type": "application/x-www-form-urlencoded",
  priority: "u=0, i",
  "sec-ch-ua":
    '"Not:A-Brand";v="24", "Chromium";v="138", "Google Chrome";v="138"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "iframe",
  "sec-fetch-mode": "navigate",
  "sec-fetch-site": "same-origin",
  "sec-fetch-user": "?1",
  "upgrade-insecure-requests": "1",
  Referer: SIGN_IN_PAGE_URL,
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

function isCloudflareError(contentData) {
  if (contentData.includes("520: Web server is returning an unknown error")) {
    return true;
  }

  return false;
}

function checkIfSingInSuccess(data) {
  // console.log(`签到结果: ${data}`);
  if (data.includes("您今日已经签到，请明天再来！")) {
    return "您今日已经签到，请明天再来！";
  } else if (data.includes("恭喜你签到成功!")) {
    const regex = /<div class="c">\s*([\s\S]*?)\s*<\/div>/;
    const match = data.match(regex);

    let successMsg = "签到成功！";

    if (match && match[1]) {
      successMsg = match[1].trim();
    }

    return successMsg;
  } else if (isCloudflareError(data)) {
    throw new Error("CloudFlare 错误，请稍后重试。");
  } else {
    throw new Error(data);
  }
}

async function checkIn(account) {
  console.log(`${account.name}: 正在签到...`);

  const response = await fetch(CHECKIN_URL, {
    headers: {
      ...baseHeaders,
      cookie: account.cookie,
    },
    body: `formhash=${account.formhash}&qdxq=${
      MOODS[Math.floor(Math.random() * MOODS_LENGTH)]
    }`,
    method: "POST",
  });

  const data = await response.text();

  return checkIfSingInSuccess(data);
}

async function getFormHash(account) {
  console.log(`${account.name}: 正在获取 Formhash...`);

  const response = await fetch(
    "https://zodgame.xyz/plugin.php?id=dsu_paulsign:sign",
    {
      headers: {
        ...baseHeaders,
        cookie: account.cookie,
      },
    }
  );

  const data = await response.text();

  if (isCloudflareError(data)) {
    throw new Error("CloudFlare 错误，请稍后重试。");
  }

  // 提取 formhash
  const formhashMatch = data.match(/name="formhash" value="([a-z0-9]+)"/);
  if (!formhashMatch || formhashMatch.length < 2) {
    throw new Error("Formhash 获取失败。");
  }

  console.log(`${account.name}: Formhash 获取成功`);

  return {
    ...account,
    formhash: formhashMatch[1],
  };
}

// 处理
async function processSingleAccount(account) {
  const cookedAccount = await getFormHash(account);

  const checkInResult = await checkIn(cookedAccount);

  return checkInResult;
}

function setGitHubOutput(name, value) {
  appendFileSync(process.env.GITHUB_OUTPUT, `${name}<<EOF\n${value}\nEOF\n`);
}

// 入口
async function main() {
  let accounts;

  try {
    if (!process.env.ACCOUNTS) {
      throw new Error("❌ 未配置账户信息。");
    }

    accounts = JSON.parse(process.env.ACCOUNTS);
  } catch (error) {
    const message = `❌ ${
      error.message.includes("JSON") ? "账户信息配置格式错误。" : error.message
    }`;
    console.error(message);
    setGitHubOutput("result", message);
    process.exit(1);
  }

  const allPromises = accounts.map((account) => processSingleAccount(account));
  const results = await Promise.allSettled(allPromises);

  console.log("\n======== 签到结果 ========\n");

  const resultLines = results.map((result, index) => {
    const accountName = accounts[index].name;

    const isSuccess = result.status === "fulfilled";
    const icon = isSuccess ? "✅" : "❌";
    const message = isSuccess ? result.value : result.reason.message;

    const line = `${accountName}: ${icon} ${message}`;

    isSuccess ? console.log(line) : console.error(line);

    return line;
  });

  const resultMsg = resultLines.join("\n");

  setGitHubOutput("result", resultMsg);
}

main();
