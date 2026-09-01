# Itera

Itera 是一个基于 Tauri 2、React 19、TypeScript、CodeMirror 6、React Aria、Tailwind CSS 和 Zustand 的本地桌面 IDE。

## 开发命令

```bash
bun install
bun run dev
```

启动桌面应用：

```bash
bun run tauri
```

提交前检查：

```bash
bun run check
bun run build
cd src-tauri && cargo fmt --check && cargo check
```

## 目录结构

```text
src/
├── app/                         # 应用入口和顶层装配
├── features/
│   ├── editor/
│   │   ├── codemirror/          # CodeMirror 语言、主题和扩展
│   │   └── components/          # 编辑器 React 封装
│   └── workspace/
│       ├── components/          # 工作区页面和业务组件
│       └── store/               # Zustand 状态、类型和选择器
├── services/
│   └── tauri/                   # Tauri 文件、对话框、监听和运行时适配
├── shared/
│   ├── components/              # 无业务依赖的共享组件
│   └── utils/                   # 无副作用的通用工具
├── styles/
│   ├── globals.css              # 全局基础样式和 Tailwind 入口
│   └── tokens.css               # 设计 token
└── main.tsx                     # React 挂载入口
```

Rust 和 Tauri 配置集中在 `src-tauri/`：

- `src-tauri/src/lib.rs`：插件初始化和 Rust 命令入口。
- `src-tauri/capabilities/default.json`：桌面窗口能力与文件权限。
- `src-tauri/tauri.conf.json`：窗口、构建和打包配置。

## 分层约定

- `app` 只负责组合功能模块，不承载具体业务实现。
- `features` 按业务能力组织；工作区和编辑器通过明确的 props、store 类型或选择器协作。
- `services/tauri` 是本地系统能力的唯一入口，React 组件不直接调用 Tauri 插件 API。
- `shared` 不依赖任何业务 feature，不存放工作区状态或文件系统逻辑。
- Zustand store 负责状态和业务动作；类型放在 `types.ts`，派生数据放在 `selectors.ts`。
- 页面布局使用 Tailwind 工具类；仅 CodeMirror 内部结构样式保留在编辑器主题和 `CodeEditor.css`。

推荐依赖方向：

```text
app → features → services
             ↘ shared
```

禁止 `services`、`shared` 反向依赖 `features`，也不要通过跨层相对路径绕过职责边界。

## 编码规范

- TypeScript 开启严格检查，避免 `any`；外部错误先按 `unknown` 处理并显式格式化。
- React 组件和文件使用 `PascalCase`，hooks 使用 `useXxx`，普通函数和变量使用 `camelCase`。
- 组件以受控 props 和事件回调表达交互；异步文件操作放在 store 或 service 中。
- 仅使用不可变方式更新 Zustand 状态，不在组件中直接修改 store 对象。
- 设计色、字体、尺寸和编辑器基础指标优先写入 `src/styles/tokens.css`，避免新增无来源的全局常量。
- SVG 图标保持装饰语义；按钮、菜单、标签、对话框和查找输入优先使用 React Aria Components。
- 使用 Biome 统一 lint 和格式，基础缩进为 2 个空格、LF 换行、双引号和分号。
- Git 提交信息使用中文，不超过 50 字；一次提交只覆盖一个清晰问题域。

## 编辑器约束

- `src/features/editor/components/CodeEditor.tsx` 是 CodeMirror 的唯一 React 生命周期边界。
- 语言识别和扩展注册放在 `src/features/editor/codemirror/languages.ts`。
- 主题和语法高亮放在 `src/features/editor/codemirror/theme.ts`。
- 查找、光标和匹配计算等辅助能力放在 `src/features/editor/codemirror/extensions.ts`。
- 当前编辑器使用 JetBrains Mono Variable，正文 `13.5px / 22px / 500`；行号与正文共享行高，修改时必须同时验证对齐。

## 本地文件能力

工作区通过 Tauri 插件选择和读取真实本地目录，并忽略 `.git`、`node_modules` 和 `dist`。文件读写、UTF-8 判断、目录监听和错误格式化统一由 `src/services/tauri/` 提供。

浏览器中的 `bun run dev` 仅用于界面开发，目录选择和本地文件读写必须在 Tauri 桌面环境中验证。

## AI 协作

AI 编码代理在修改仓库前必须先读取根目录的 `AGENTS.md`。该文件定义任务范围、架构边界、CodeMirror 视觉基线、Tauri 文件安全、验证要求和 Git 操作规则。
