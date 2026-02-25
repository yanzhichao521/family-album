# Render 找不到 GitHub 仓库的解决方案

## 常见原因

1. **Render 还未同步 GitHub 仓库**
2. **缺少仓库访问权限**
3. **网络延迟**
4. **仓库是私有的**

---

## 解决方案

### 方案一：手动同步 GitHub 仓库

1. **进入 Render Dashboard**
   - 访问 https://dashboard.render.com/

2. **点击 "New +" → "Web Service"**

3. **在 "Connect a repository" 页面**
   - 滚动到底部
   - 点击 "Configure GitHub App..."

4. **授权 Render 访问你的仓库**
   - 在 GitHub 授权页面，选择你的 GitHub 账号
   - 选择 "All repositories" 或 "Only select repositories"
   - 如果你选择 "Only select repositories"，确保选中你的相册项目仓库
   - 点击 "Install"

5. **回到 Render**
   - 刷新页面
   - 现在应该能看到你的仓库了！

---

### 方案二：直接导入仓库 URL

1. **在 "Connect a repository" 页面**
   - 找到 "Public Git repository" 输入框
   - 粘贴你的 GitHub 仓库 URL，格式：
     ```
     https://github.com/你的用户名/你的仓库名.git
     ```
   - 点击 "Continue"

---

### 方案三：检查 GitHub 推送状态

确保你的代码真的推送到了 GitHub：

```bash
# 检查远程仓库
$ git remote -v
origin  https://github.com/你的用户名/你的仓库名.git (fetch)
origin  https://github.com/你的用户名/你的仓库名.git (push)

# 检查推送状态
$ git push origin main
```

---

### 方案四：等待同步

有时候 GitHub 和 Render 之间的同步需要一点时间：
- 等待 1-2 分钟
- 刷新 Render 页面
- 再次尝试

---

## 快速排查步骤

1. ✅ 确认代码已推送到 GitHub
2. ✅ 确认 Render 已授权访问该仓库
3. ✅ 尝试直接粘贴仓库 URL
4. ✅ 等待 2 分钟后刷新
5. ✅ 检查仓库是否为公开

---

## 如果仍然看不到

### 重新授权 Render

1. **在 GitHub 中**
   - 访问 https://github.com/settings/apps
   - 找到 "Render"
   - 点击 "Configure"
   - 重新授权你的仓库

### 检查网络连接

- 确保你能正常访问 GitHub
- 尝试使用不同的浏览器
- 清除浏览器缓存

---

## 成功标志

当你看到以下界面时，表示成功：

![Render 选择仓库界面](https://render.com/static/images/repo-selection.png)

---

## 下一步

选择你的仓库后，按照之前的配置步骤部署后端和前端即可！
