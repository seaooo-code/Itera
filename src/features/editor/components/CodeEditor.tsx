import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { indentWithTab } from "@codemirror/commands";
import { SearchQuery, search, setSearchQuery } from "@codemirror/search";
import { EditorState, Compartment } from "@codemirror/state";
import { EditorView, keymap, placeholder as codeMirrorPlaceholder } from "@codemirror/view";
import type { FileLanguage } from "../../../services/tauri/filesystem";
import type { CursorState } from "../../workspace/store/types";
import {
  collectMatches,
  cursorFromView,
  editorSetup,
  lineChangeExtension,
} from "../codemirror/extensions";
import { languageExtension } from "../codemirror/languages";
import { editorLayoutTheme, syntaxTheme } from "../codemirror/theme";
import "./CodeEditor.css";

export interface CodeEditorHandle {
  focus: () => void;
  findNext: (
    query: string,
    caseSensitive: boolean,
    direction: 1 | -1,
  ) => { index: number; total: number };
}

export interface CodeEditorProps {
  value: string;
  originalValue: string;
  onChange: (value: string) => void;
  language: FileLanguage;
  readOnly?: boolean;
  cursor?: CursorState;
  scrollTop?: number;
  onCursorChange?: (cursor: CursorState) => void;
  onScrollChange?: (scrollTop: number) => void;
  searchQuery?: string;
  searchCaseSensitive?: boolean;
  ariaLabel?: string;
  placeholder?: string;
}

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(function CodeEditor(
  {
    value,
    originalValue,
    onChange,
    language,
    readOnly = false,
    cursor,
    scrollTop = 0,
    onCursorChange,
    onScrollChange,
    searchQuery = "",
    searchCaseSensitive = false,
    ariaLabel = "代码编辑器",
    placeholder = "请输入代码…",
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView>(null);
  const languageCompartment = useRef(new Compartment());
  const readOnlyCompartment = useRef(new Compartment());
  const lineChangeCompartment = useRef(new Compartment());
  const onChangeRef = useRef(onChange);
  const onCursorChangeRef = useRef(onCursorChange);
  const onScrollChangeRef = useRef(onScrollChange);
  const suppressChangeRef = useRef(false);
  const valueRef = useRef(value);
  const languageRef = useRef(language);
  const readOnlyRef = useRef(readOnly);
  const originalValueRef = useRef(originalValue);

  valueRef.current = value;
  languageRef.current = language;
  readOnlyRef.current = readOnly;
  originalValueRef.current = originalValue;

  useEffect(() => {
    onChangeRef.current = onChange;
    onCursorChangeRef.current = onCursorChange;
    onScrollChangeRef.current = onScrollChange;
  }, [onChange, onCursorChange, onScrollChange]);

  useImperativeHandle(
    ref,
    () => ({
      focus: () => viewRef.current?.focus(),
      findNext: (query, caseSensitive, direction) => {
        const view = viewRef.current;
        if (!view || !query) return { index: 0, total: 0 };
        const matches = collectMatches(view, query, caseSensitive);
        if (!matches.length) return { index: 0, total: 0 };

        const current = view.state.selection.main.head;
        let index =
          direction > 0
            ? matches.findIndex((match) => match.from > current)
            : [...matches].reverse().findIndex((match) => match.to < current);

        if (direction < 0 && index >= 0) index = matches.length - 1 - index;
        if (index < 0) index = direction > 0 ? 0 : matches.length - 1;

        const match = matches[index];
        view.dispatch({
          selection: { anchor: match.from, head: match.to },
          effects: EditorView.scrollIntoView(match.from, { y: "center" }),
        });
        view.focus();
        return { index, total: matches.length };
      },
    }),
    [],
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const view = new EditorView({
      state: EditorState.create({
        doc: valueRef.current,
        extensions: [
          editorSetup,
          keymap.of([indentWithTab]),
          search({ top: true }),
          languageCompartment.current.of(languageExtension(languageRef.current)),
          readOnlyCompartment.current.of([
            EditorState.readOnly.of(readOnlyRef.current),
            EditorView.editable.of(!readOnlyRef.current),
          ]),
          lineChangeCompartment.current.of(lineChangeExtension(originalValueRef.current)),
          syntaxTheme,
          editorLayoutTheme,
          codeMirrorPlaceholder(placeholder),
          EditorView.contentAttributes.of({
            "aria-label": ariaLabel,
            autocapitalize: "off",
            autocomplete: "off",
            spellcheck: "false",
          }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged && !suppressChangeRef.current) {
              onChangeRef.current(update.state.doc.toString());
            }

            if (update.selectionSet) {
              onCursorChangeRef.current?.(cursorFromView(update.view));
            }
          }),
        ],
      }),
      parent: containerRef.current,
    });

    const scroller = view.scrollDOM;
    const handleScroll = () => onScrollChangeRef.current?.(scroller.scrollTop);
    scroller.addEventListener("scroll", handleScroll, { passive: true });
    viewRef.current = view;
    onCursorChangeRef.current?.(cursorFromView(view));
    onScrollChangeRef.current?.(scroller.scrollTop);

    return () => {
      scroller.removeEventListener("scroll", handleScroll);
      view.destroy();
      viewRef.current = null;
    };
  }, [ariaLabel, placeholder]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: languageCompartment.current.reconfigure(languageExtension(language)),
    });
  }, [language]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: readOnlyCompartment.current.reconfigure([
        EditorState.readOnly.of(readOnly),
        EditorView.editable.of(!readOnly),
      ]),
    });
  }, [readOnly]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: lineChangeCompartment.current.reconfigure(lineChangeExtension(originalValue)),
    });
  }, [originalValue]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: setSearchQuery.of(
        new SearchQuery({
          search: searchQuery,
          caseSensitive: searchCaseSensitive,
          literal: true,
        }),
      ),
    });
  }, [searchCaseSensitive, searchQuery]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || view.state.doc.toString() === value) return;
    suppressChangeRef.current = true;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value },
    });
    suppressChangeRef.current = false;
  }, [value]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || !cursor) return;
    const max = view.state.doc.length;
    const anchor = Math.min(max, cursor.anchor);
    const head = Math.min(max, cursor.head);
    if (view.state.selection.main.anchor !== anchor || view.state.selection.main.head !== head) {
      view.dispatch({ selection: { anchor, head } });
    }
  }, [cursor]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || view.scrollDOM.scrollTop === scrollTop) return;
    view.scrollDOM.scrollTop = scrollTop;
  }, [scrollTop]);

  return <div className="code-editor" ref={containerRef} />;
});
