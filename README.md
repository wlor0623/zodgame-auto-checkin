## ZodGame 定时自动签到

利用 Github Actions 定时任务实现自动签到。随机心情。

[![ZodGame-Auto-Checkin](https://github.com/ewigl/zodgame-auto-checkin/actions/workflows/Checkin.yml/badge.svg)](https://github.com/ewigl/zodgame-auto-checkin/actions/workflows/Checkin.yml)

### 仓库变量

- **ACCOUNTS**：账户信息，配置格式如下。推荐使用 [JSON 格式化工具](https://jsoneditoronline.org/) 进行编辑以避免格式出错。

  ```json
  [
    {
      "name": "这里填写账户备注",
      "cookie": "这里填写 Cookie"
    },
    {
      "name": "这里填写账户备注,只有一个账号可以删除这一条{}记录",
      "cookie": "这里填写 Cookie，有两个以上账号自行在下方添加新的{}记录。"
    }
  ]
  ```

### 使用方法

1. Fork 此仓库。
2. 在 fork 后的仓库中启用 Actions。
3. 配置仓库变量。

详细文档: https://ewigl.github.io/notes/posts/programming/github-actions/

### 注意事项

1. 不能使用 `document.cookie` 方式获取 Cookie，需要在网络请求中抓取 Cookie，因为 ZodGame 部分 Cookie 具有 [HttpOnly](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Guides/Cookies#%E9%99%90%E5%88%B6%E8%AE%BF%E9%97%AE_cookie) 属性。

2. 根据 [Github 的政策](https://docs.github.com/zh/actions/managing-workflow-runs-and-deployments/managing-workflow-runs/disabling-and-enabling-a-workflow?tool=webui)，当 60 天内未发生仓库活动时，将自动禁用定时 Workflow。需要再次手动启用。

3. 间歇性的 CF 盾可能会导致签到失败，可以尝试在一天之内多设置几次定时任务。
