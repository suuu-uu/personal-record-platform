# 拾光簿

个人成就、待办和足迹记录平台，使用 Next.js App Router、TypeScript、Prisma 和 SQLite。

## 安装与开发

```bash
npm install
Copy-Item .env.example .env
npm run db:push
npm run db:seed
npm run dev
```

打开 http://localhost:3000。管理员账号由 `ADMIN_USERNAME` 和 `ADMIN_PASSWORD` 环境变量决定，修改 `.env` 后重新启动开发服务器即可。`AUTH_SECRET` 用于签名登录 Cookie，必须使用随机长字符串。

## 常用命令

- `npm run typecheck`：TypeScript 检查。
- `npm run lint`：ESLint 检查。
- `npm run build`：生成 Prisma Client 并构建生产版本。
- `npm run db:push`：将 Prisma schema 同步到数据库。
- `npm run db:seed`：插入示例成就、待办和足迹。

## 部署

### 审美灵感任务的时区与月末规则

系统统一以 UTC 写入数据库和日志，展示时使用 `Asia/Shanghai`。月末目标时间是上海时间每月最后一天 00:00。Vercel Cron 只能使用 UTC，因此配置为每小时 `0 * * * *`，接口将当前 UTC 转为上海时间后，只有在月末 00:00 才执行；月份天数通过“下月第一天减一天”计算，覆盖 2 月、闰年和大小月。Cron 请求必须携带 `Authorization: Bearer ${CRON_SECRET}`，未授权返回 401。

每个月份只有一条 `InspirationRun`。成功记录会跳过重复触发，后台可指定月份补跑，强制重跑必须填写原因。失败会保留运行记录并自动重试最多 3 次，后台显示失败告警。

本地开发默认使用 SQLite：`DATABASE_URL="file:./dev.db"`。部署到 Vercel 时，建议使用 Neon 或 Supabase PostgreSQL。将 `prisma/schema.prisma` 的 datasource provider 从 `sqlite` 改为 `postgresql`，把 Vercel 项目中的 `DATABASE_URL` 换成 PostgreSQL 连接串，然后执行 `npx prisma db push` 和 `npm run db:seed`。同时在 Vercel 环境变量中设置新的 `ADMIN_USERNAME`、`ADMIN_PASSWORD` 和 `AUTH_SECRET`，不要使用示例值。

## 关键依赖

Next.js 提供页面、路由和服务端 API；Prisma 负责类型安全的数据访问；React Hook Form 与 Zod 负责表单状态和校验；react-simple-maps、world-atlas、d3-geo 和 d3-zoom 提供地图、投影和缩放；Radix UI 提供弹窗和确认对话框；jose 负责登录会话签名。

## 功能入口

`/admin` 统一管理成就、待办和足迹；`/achievements`、`/todos`、`/footprints` 是对应的独立管理页。除登录页和登录接口外，页面与 API 都需要有效登录 Cookie。

## 数据备份与迁移

登录 `/admin` 后可导出 JSON/CSV、上传 JSON 预览并选择合并、覆盖或清空后导入。JSON 导入使用 Prisma 事务，失败会回滚。备份文件保存在服务器的 `storage/backups`，下载接口需要登录。迁移到 PostgreSQL 时将 schema provider 改为 `postgresql`，设置 PostgreSQL 的 `DATABASE_URL`，执行 `npx prisma migrate dev --name init` 或生产环境的 `npx prisma migrate deploy`，然后从后台导入 JSON。
