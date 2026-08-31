import { useEffect, useRef } from "react";
import { indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import {
  EditorView,
  keymap,
  placeholder as codeMirrorPlaceholder,
} from "@codemirror/view";
import { basicSetup } from "codemirror";
import "./CodeEditor.css";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  placeholder?: string;
}

const editorLayoutTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "14px",
  },
  ".cm-scroller": {
    fontFamily:
      '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
    lineHeight: "1.65",
  },
  ".cm-content": {
    padding: "16px 0 48px",
  },
  ".cm-line": {
    padding: "0 18px",
  },
  ".cm-gutters": {
    paddingTop: "16px",
  },
});

export function CodeEditor({
  value,
  onChange,
  ariaLabel = "代码编辑器",
  placeholder = "请输入代码…",
}: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const view = new EditorView({
      doc: value,
      extensions: [
        basicSetup,
        javascript({ jsx: true, typescript: true }),
        keymap.of([indentWithTab]),
        oneDark,
        editorLayoutTheme,
        codeMirrorPlaceholder(placeholder),
        EditorView.contentAttributes.of({
          "aria-label": ariaLabel,
          autocapitalize: "off",
          autocomplete: "off",
          spellcheck: "false",
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
      ],
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [ariaLabel, placeholder]);

  useEffect(() => {
    const view = viewRef.current;

    if (!view) {
      return;
    }

    const currentValue = view.state.doc.toString();

    if (currentValue === value) {
      return;
    }

    view.dispatch({
      changes: {
        from: 0,
        to: currentValue.length,
        insert: value,
      },
    });
  }, [value]);

  return <div className="code-editor" ref={containerRef} />;
}
