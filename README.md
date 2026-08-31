# Itera

基于 Tauri、React、TypeScript、CodeMirror 6、React Aria、Tailwind CSS 和 Zustand 的桌面编辑器项目。

## 开发

```bash
bun install
bun run dev
```

启动桌面应用：

```bash
bun run tauri dev
```

## 编辑器

`src/components/CodeEditor.tsx` 封装 CodeMirror 6，当前支持：

- TypeScript 和 JSX 语法高亮
- 行号、代码折叠、搜索等基础能力
- Tab 缩进快捷键
- React 受控值同步
- 深色主题与无障碍标签

## UI 基础设施

- `react-aria-components` 提供按钮、工具栏等可访问交互组件
- Tailwind CSS 通过 `@tailwindcss/vite` 接入 Vite
- 页面级布局和视觉样式使用 Tailwind 工具类
- `src/stores/editorStore.ts` 使用 Zustand 管理编辑器内容和保存快照
