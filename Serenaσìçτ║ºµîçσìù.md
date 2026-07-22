# 五色 App v2.0 升级指南（给 Serena）

> 这次大升级把"手动填 URL/Key"换成了真正的账号系统。你需要在 Supabase 控制台做 3 件事，然后部署新代码。

---

## ⏱ 总时间：15 分钟

## 🎯 升级后会怎样

**对你和朋友的体验：**
- 打开网址 → 看到登录页（注册 / 登录）
- 输入邮箱密码 → 进入 App
- 数据自动按账号隔离同步
- 顶部显示用户名 + 真印章 + 头像

**对你的数据：**
- 之前用 `serenalin732@gmail.com` 作为用户标识同步的数据**不会自动迁移**
- 你需要：① 用 `serenalin732@gmail.com` 注册新账号 ② 然后手动把之前的数据迁移过来（步骤 5 会教）

---

## 📋 操作步骤

### 第 1 步：升级 Supabase 数据库（5 分钟）

打开你的 Supabase 项目：

1. 左侧菜单 → **SQL Editor**
2. 全选清空当前代码框
3. 粘贴以下完整 SQL：

```sql
-- 删除旧表（数据会丢，所以下面会教你迁移）
DROP TABLE IF EXISTS wuse_days;

-- 创建新表，user_id 改为 UUID 类型，关联到 Auth 用户
CREATE TABLE wuse_days (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date text NOT NULL,
  data jsonb,
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, date)
);

-- 开启行级安全
ALTER TABLE wuse_days ENABLE ROW LEVEL SECURITY;

-- 关键策略：只能看/改自己的数据
CREATE POLICY "users_own_data" ON wuse_days
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

4. 点 **Run**（或 Cmd+Enter）
5. 看到 **Success** 就 OK

### 第 2 步：开启 / 关闭 Auth 相关设置（5 分钟）

1. 左侧菜单 → **Authentication** → **Providers**
2. 确认 **Email** 是 **Enabled**（默认应该是开的）

3. 点 **Email** 进入详细设置：
   - 关闭 **Confirm email**（这样朋友注册不用收邮件就能直接登录）
   - 关闭 **Secure password change**（如果有这个选项）
   - 保存

4. 左侧菜单 → **Authentication** → **URL Configuration**
   - **Site URL**：填 `https://wuse-9u5.pages.dev`
   - **Redirect URLs**：填 `https://wuse-9u5.pages.dev/*`
   - 保存

5. 左侧菜单 → **Authentication** → **Email Templates** → **Confirm signup**
   - 不用改（既然关掉了 Confirm email，这个模板用不到）

### 第 3 步：（可选）控制谁能注册

如果你**只想让特定的人能注册**，去：

- 左侧菜单 → **Authentication** → **Settings**
- 找到 **Enable sign ups**
- 你有两个选择：
  - **保持开启**：任何人能注册（适合公开分享）
  - **关闭注册**：只能由你在控制台手动添加用户

如果想要邀请制：
1. 关闭 sign ups
2. 当朋友想用时：去 **Authentication → Users → Add user**，输入他们的邮箱和初始密码
3. 把邮箱和密码发给朋友，让他们登录后立刻去改密码

---

### 第 4 步：部署新代码（3 分钟）

1. 下载 `wuse-deploy.zip` → 解压
2. Cloudflare → wuse 项目 → **Create deployment** → 拖入 `wuse-deploy` 文件夹 → Deploy
3. 等部署完成

### 第 5 步：迁移你的旧数据（重要！）

这一步是为了不丢之前打卡的数据：

1. **在升级前**，回到旧版 App（如果还能打开），点设置 → 数据 → **导出 JSON 备份**，保存到电脑
2. **打开新版** App → 看到登录页 → 用 `serenalin732@gmail.com` 注册一个账号
3. 登录后，去设置 → 数据 → **导入 JSON**
4. 选刚才那个备份文件
5. 看到"导入 X 天数据"提示后，点设置里的"**立即同步**"
6. 你的数据就传到云端了

✅ 升级完成。这一切完成后：
- 在手机上打开 App
- 用同样的邮箱密码登录
- 数据立刻同步过来

---

## 🤝 邀请朋友（2 分钟）

把这两样东西发给朋友：

1. **网址**：https://wuse-9u5.pages.dev
2. **入门指南**：发给他们看 `朋友入门指南.md`（在 zip 包里）

朋友的流程是：

```
打开网址 → 看到登录页 → 点"注册" → 填邮箱+密码 → 完成
        ↓
直接进入 App，开始打卡
        ↓
（可选）添加到主屏幕、配置 OpenAI Key
```

---

## 🔒 关于数据安全

我做了这些保护：

1. **Row Level Security**：数据库层面，A 用户用任何方法都看不到 B 用户的数据
2. **JWT Token**：用户登录后用 token 访问，不传密码
3. **本地副本**：所有数据除了云端还存一份在本地浏览器，断网也能用
4. **可导出**：朋友随时能"导出 JSON"，数据是他们自己的

---

## ❓ 常见问题

**Q：朋友注册不了，提示什么 "signups not allowed"？**
A：去 Supabase → Auth → Settings → Enable sign ups 打开。

**Q：登录提示 "Email not confirmed"？**
A：你没关掉 Confirm email。去 Auth → Providers → Email，关掉 Confirm email。

**Q：能看到所有用户的列表吗？**
A：能。Supabase → Authentication → Users，会列出所有注册用户。

**Q：朋友数据存了多少？我能看到吗？**
A：Supabase → Table Editor → wuse_days 表能看到所有行，但数据是 JSON 形式。每行有 user_id（uuid），你可以对照 Users 列表看是谁。

**Q：如何删除朋友账号？**
A：Supabase → Authentication → Users → 找到那个用户 → 点 "..." → Delete user。删除后他名下所有数据也会因为外键级联自动删除。

**Q：我之前自己手动填的 Supabase URL 和 Key，还需要再填吗？**
A：不需要了！新版本是内置的，朋友打开就能用，零配置。

---

## 🆘 出问题了怎么办？

如果升级过程中卡住，**最坏情况你的数据不会丢**——之前导出的 JSON 备份永远在你电脑里。

把截图和具体问题发给我，我帮你解决。
