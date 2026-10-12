# 云阅图书馆前端

独立的 Vue 3 应用。读者可以浏览、收藏、借阅和阅读图书；管理员可以管理图书、借阅、轮播、公告和账号。后端源码在单独的 `yunyue-library-backend` 仓库。

## 本地启动（Windows PowerShell）

先按后端 README 启动数据库和 API，再在本仓库目录运行：

```powershell
npm.cmd install
npm.cmd run dev
```

打开 [http://localhost:5173](http://localhost:5173)。PowerShell 如提示禁止运行 `npm.ps1`，继续使用上面的 `npm.cmd` 即可。本地开发时，Vite 会将 `/api` 转发到后端 `127.0.0.1:8000`。

第一次使用可用后端初始管理员账号 `admin` / `admin` 登录，然后按页面提示修改密码。普通读者在注册页创建账号。管理员上传 PDF 或 EPUB 图书后，读者即可借阅并在线阅读。

## 检查与部署

```powershell
npm.cmd run build
npx.cmd oxlint .
npx.cmd eslint . --no-fix
```

前端单独部署在其他域名时，在构建前设置 `VITE_API_BASE_URL` 为后端地址（例如 `https://api.example.com`，不带末尾斜杠）。后端 `.env` 的 `FRONTEND_ORIGIN` 要填写前端的完整来源地址。若使用同域反向代理 `/api`，该变量可留空。

PDF 使用浏览器内置阅读器；EPUB 使用 epub.js。界面不提供下载按钮，但浏览器接收正文后仍可能保存文件，因此无法保证防复制。
