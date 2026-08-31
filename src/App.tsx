import { useMemo } from "react";
import { Button, Toolbar } from "react-aria-components";
import { CodeEditor } from "./components/CodeEditor";
import { useEditorStore } from "./stores/editorStore";
import "./App.css";

function App() {
  const code = useEditorStore((state) => state.code);
  const hasChanges = useEditorStore(
    (state) => state.code !== state.savedCode,
  );
  const setCode = useEditorStore((state) => state.setCode);
  const saveCode = useEditorStore((state) => state.saveCode);
  const restoreCode = useEditorStore((state) => state.restoreCode);
  const lineCount = useMemo(() => code.split("\n").length, [code]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080a0f] px-4 py-6 text-[#f5f7ff] sm:p-10 lg:p-16">
      <div
        className="pointer-events-none absolute -left-40 -top-48 h-[520px] w-[520px] rounded-full bg-[#5270ff]/20 blur-[130px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-48 -right-40 h-[520px] w-[520px] rounded-full bg-[#8144ff]/15 blur-[140px]"
        aria-hidden="true"
      />

      <section
        className="relative mx-auto w-full max-w-[1180px]"
        aria-labelledby="workspace-title"
      >
        <header className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 text-xs font-bold tracking-[0.12em] text-[#9fa9c7] uppercase">
              <span
                className="h-2 w-2 rounded-full bg-[#7c96ff] shadow-[0_0_16px_rgba(124,150,255,0.9)]"
                aria-hidden="true"
              />
              CodeMirror 6 · React Aria · Tailwind CSS · Zustand
            </div>
            <h1
              id="workspace-title"
              className="m-0 text-[clamp(2rem,5vw,3.25rem)] leading-none font-bold tracking-[-0.05em]"
            >
              Itera Editor
            </h1>
            <p className="mt-3.5 mb-0 text-[#8e96ad]">
              支持 TypeScript、JSX、无障碍交互和 Zustand 状态管理。
            </p>
          </div>

          <Toolbar
            aria-label="编辑器操作"
            className="flex flex-wrap items-center gap-2.5"
          >
            <div
              role="status"
              aria-live="polite"
              className="mr-1 inline-flex w-full items-center gap-2 text-[13px] whitespace-nowrap text-[#8f98af] sm:w-auto"
            >
              <span
                className={`h-[7px] w-[7px] rounded-full ${
                  hasChanges ? "bg-[#f4b860]" : "bg-[#4fd1a5]"
                }`}
                aria-hidden="true"
              />
              {hasChanges ? "有未保存修改" : "已保存"}
            </div>

            <Button
              className="min-h-[38px] cursor-pointer rounded-[10px] border border-white/10 bg-white/[0.055] px-[15px] text-[13px] font-semibold text-[#f7f8ff] transition duration-150 outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-[0.38] data-[focus-visible]:ring-2 data-[focus-visible]:ring-[#8ea3ff] data-[focus-visible]:ring-offset-2 data-[focus-visible]:ring-offset-[#080a0f] data-[hovered]:-translate-y-px data-[hovered]:border-white/20 data-[hovered]:bg-white/[0.09] data-[pressed]:translate-y-0"
              isDisabled={!hasChanges}
              onPress={restoreCode}
            >
              恢复已保存
            </Button>
            <Button
              className="min-h-[38px] cursor-pointer rounded-[10px] border border-[#8299ff] bg-[#6e87f5] px-[15px] text-[13px] font-semibold text-[#f7f8ff] transition duration-150 outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-[0.38] data-[focus-visible]:ring-2 data-[focus-visible]:ring-[#8ea3ff] data-[focus-visible]:ring-offset-2 data-[focus-visible]:ring-offset-[#080a0f] data-[hovered]:-translate-y-px data-[hovered]:bg-[#7b92f8] data-[pressed]:translate-y-0"
              isDisabled={!hasChanges}
              onPress={saveCode}
            >
              保存
            </Button>
          </Toolbar>
        </header>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0f1117] shadow-[0_28px_90px_rgba(0,0,0,0.38),inset_0_1px_rgba(255,255,255,0.035)]">
          <div className="flex min-h-11 items-center border-b border-white/[0.07] bg-[#13161e] px-4 text-xs text-[#858da3]">
            <div className="mr-[18px] flex gap-[7px]" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff645d]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd44]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#00ca4e]" />
            </div>
            <span className="font-semibold text-[#d5d9e7]">main.ts</span>
            <span className="ml-auto">TypeScript</span>
          </div>

          <CodeEditor value={code} onChange={setCode} />

          <footer className="flex min-h-[34px] items-center justify-end gap-[18px] border-t border-white/[0.07] bg-[#13161e] px-4 text-xs text-[#858da3]">
            <span>UTF-8</span>
            <span>{lineCount} 行</span>
            <span>{code.length} 字符</span>
          </footer>
        </div>
      </section>
    </main>
  );
}

export default App;
