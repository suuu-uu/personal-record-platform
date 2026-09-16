# 安全说明

已启用服务端输入校验、登录/上传限流、httpOnly SameSite Cookie、生产环境密钥检查、用户作用域 Prisma 查询、随机文件名、Web 根目录外存储和安全响应头。

部署必须设置随机 `AUTH_SECRET`、`DATABASE_URL` 和 Cron 密钥，并使用 HTTPS、WAF 和最小权限数据库账号。当前限流为进程内实现，多实例生产环境应替换为 Redis/Upstash。病毒扫描、2FA、备份加密、Sentry 告警和 DDoS 防护需要接入 ClamAV/云扫描、监控服务和 WAF；未接入扫描时不要开放不受信任用户上传。

发生安全事件时保留日志和证据，先隔离服务并轮换密钥。日志不得记录密码、Cookie、Token 或密钥。
