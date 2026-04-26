/**
 * Cloudflare Worker — LoL 赛程 CORS 代理
 *
 * 部署步骤：
 * 1. 登录 https://dash.cloudflare.com
 * 2. 左侧菜单 → Workers & Pages → Create application → Create Worker
 * 3. 给 Worker 起个名字（比如 lol-proxy）
 * 4. 点 Deploy，然后点 Edit code
 * 5. 把这个文件的全部内容粘贴进去，替换原有代码
 * 6. 点 Save and Deploy
 * 7. 你会得到一个 URL，类似：https://lol-proxy.你的用户名.workers.dev
 * 8. 把这个 URL 填到 preview.html 的 WORKER_PROXY 变量里
 *
 * 免费额度：每天 100,000 次请求，完全够用
 */

export default {
  async fetch(request) {
    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // 从 URL 中提取要代理的 API 路径
    const url = new URL(request.url);
    const apiPath = url.pathname + url.search;

    // 安全检查：只允许代理 PandaScore API
    const target = 'https://api.pandascore.co' + apiPath;

    try {
      // 转发请求到 PandaScore
      const apiResponse = await fetch(target, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'LoL-Schedule-Proxy/1.0',
        },
      });

      // 读取响应
      const body = await apiResponse.text();

      // 返回带 CORS 头的响应
      return new Response(body, {
        status: apiResponse.status,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=60',
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};
