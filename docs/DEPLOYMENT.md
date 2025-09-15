# Luminet 部署指南

## 环境要求

- Node.js 18+ 
- npm 或 yarn
- Supabase 项目
- Vercel 账户（推荐）

## 环境变量配置

### 前端环境变量

创建 `.env.local` 文件：

```bash
# Supabase 配置
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI 服务配置
VITE_GEMINI_API_KEY=your_gemini_api_key

# 应用配置
VITE_APP_URL=http://localhost:8080
```

### Supabase Edge Functions 环境变量

在 Supabase 项目设置中配置：

```bash
# AI 服务
GEMINI_API_KEY=your_gemini_api_key

# Stripe 配置
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# 邮件服务
RESEND_API_KEY=your_resend_api_key
```

## 本地开发

### 1. 克隆项目

```bash
git clone https://github.com/kuthy9/luminet.git
cd luminet
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 到 `.env.local` 并填入相应的值。

### 4. 启动开发服务器

```bash
npm run dev
```

应用将在 `http://localhost:8080` 启动。

### 5. 运行测试

```bash
# 运行所有测试
npm run test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 启动测试 UI
npm run test:ui
```

## Supabase 设置

### 1. 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com)
2. 创建新项目
3. 记录项目 URL 和 anon key

### 2. 运行数据库迁移

```bash
# 安装 Supabase CLI
npm install -g supabase

# 登录 Supabase
supabase login

# 链接到你的项目
supabase link --project-ref your-project-ref

# 推送数据库架构
supabase db push
```

### 3. 部署 Edge Functions

```bash
# 部署所有 Edge Functions
supabase functions deploy

# 或者部署单个函数
supabase functions deploy muse-ai-enhanced
supabase functions deploy collaboration-matching
```

### 4. 配置认证

在 Supabase 控制台中：

1. 启用邮件认证
2. 配置邮件模板
3. 设置重定向 URL

## 生产部署

### 使用 Vercel 部署（推荐）

1. **连接 GitHub 仓库**
   ```bash
   # 推送代码到 GitHub
   git push origin main
   ```

2. **在 Vercel 中导入项目**
   - 访问 [Vercel](https://vercel.com)
   - 点击 "New Project"
   - 导入 GitHub 仓库

3. **配置环境变量**
   在 Vercel 项目设置中添加所有必要的环境变量。

4. **部署**
   Vercel 会自动构建和部署项目。

### 使用 Netlify 部署

1. **构建项目**
   ```bash
   npm run build
   ```

2. **部署到 Netlify**
   ```bash
   # 安装 Netlify CLI
   npm install -g netlify-cli

   # 登录 Netlify
   netlify login

   # 部署
   netlify deploy --prod --dir=dist
   ```

### 使用 Docker 部署

1. **创建 Dockerfile**
   ```dockerfile
   FROM node:18-alpine

   WORKDIR /app

   COPY package*.json ./
   RUN npm ci --only=production

   COPY . .
   RUN npm run build

   EXPOSE 8080

   CMD ["npm", "run", "preview"]
   ```

2. **构建和运行**
   ```bash
   docker build -t luminet .
   docker run -p 8080:8080 luminet
   ```

## 域名和 SSL

### 自定义域名

1. 在部署平台（Vercel/Netlify）中添加自定义域名
2. 配置 DNS 记录指向部署平台
3. SSL 证书会自动配置

### 更新 Supabase 配置

在 Supabase 项目设置中更新：
- 站点 URL
- 重定向 URL
- CORS 设置

## 监控和日志

### 错误监控

推荐集成 Sentry：

```bash
npm install @sentry/react @sentry/vite-plugin
```

### 性能监控

使用 Vercel Analytics 或 Google Analytics。

### 日志管理

Supabase Edge Functions 的日志可以在 Supabase 控制台中查看。

## 备份和恢复

### 数据库备份

Supabase 提供自动备份，也可以手动备份：

```bash
# 导出数据库架构
supabase db dump --schema-only > schema.sql

# 导出数据
supabase db dump --data-only > data.sql
```

### 代码备份

确保代码推送到 GitHub，并定期创建 release。

## 安全检查清单

- [ ] 所有环境变量已正确配置
- [ ] Supabase RLS 策略已启用
- [ ] API 密钥已安全存储
- [ ] HTTPS 已启用
- [ ] CORS 设置正确
- [ ] 错误监控已配置
- [ ] 备份策略已实施

## 故障排除

### 常见问题

1. **构建失败**
   - 检查 Node.js 版本
   - 清除 node_modules 并重新安装
   - 检查环境变量

2. **Supabase 连接失败**
   - 验证 URL 和 API 密钥
   - 检查网络连接
   - 确认 CORS 设置

3. **Edge Functions 错误**
   - 检查函数日志
   - 验证环境变量
   - 确认函数部署状态

### 获取帮助

- 查看 [Supabase 文档](https://supabase.com/docs)
- 查看 [Vercel 文档](https://vercel.com/docs)
- 提交 GitHub Issue
