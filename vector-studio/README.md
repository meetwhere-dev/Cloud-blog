# 线迹 · Vector Studio

独立的矢量绘图与测量项目，基于原生 JavaScript、SVG 和 Node.js，无第三方依赖，可整目录移出博客单独使用。需要 Node.js 22 或更高版本，无需安装依赖。

## 开始使用

在本目录运行：

```sh
npm run dev
```

访问 http://127.0.0.1:3340。可使用 `PORT=3341 npm run dev` 更换端口。

```sh
npm test          # 几何回归测试
npm run build     # 输出静态网站到 dist/
npm run preview   # 本地预览 dist/
```

部署时将 dist/ 上传至任意静态网站托管服务即可。

## 源码与操作

- `studio.js`：绘图状态、指针交互、撤销/重做、侦测与 SVG 导出。
- `studio.css`：桌面三栏工作台及窄屏布局。
- `geometry.mjs`：纯几何计算，直线距离、贝塞尔自适应细分和最近点投影。

直线依次点击起点和终点；曲线依次点击起点、终点、两个控制点。选择模式可拖动整条路径或控制点，侦测模式以 12 个画布单位为命中范围，显示最近点、鼠标距离和从起点沿路径的累计长度。快捷键 V/L/B/D 切换模式、Esc 取消、Delete 删除，Cmd/Ctrl+Z 撤销、Shift+Cmd/Ctrl+Z 重做。

画布坐标固定为 1000 × 700，长度单位 px，不代表现实物理尺寸。贝塞尔弧长采用 de Casteljau 自适应细分，初始控制多边形与弦长差容差为 0.001，逐层平分容差；最近点基于同一细分折线投影。最多递归 18 层。

当前绘图保存在页面内存中，刷新即重置。导出 SVG 可保存路径；不提供旧版实验性的 SVG 拖入解析。

## 博客 Projects 入口

博客的 Projects 页面通过 `/vector-studio/index.html` 打开此项目。博客启动和构建前会自动将本目录的页面资源同步到 `public/vector-studio/`，该目录为忽略版本控制的生成文件，请勿直接修改。独立项目开发仍使用本目录的 `npm run dev`。需要更新已运行的博客预览时，在博客根目录运行 `node scripts/sync-vector-studio.mjs`。
