"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { RoomDocFile, RoomDocPage, RoomDocsState } from "@/lib/room-docs";
import { DOCS_CHANNEL } from "@/lib/realtime-channels";
import { formatTime } from "@/lib/utils";

interface DocumentModeProps {
  roomId: string;
  userId: string;
  username: string;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function ToolbarBtn({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        active
          ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
          : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
      }`}
    >
      {children}
    </button>
  );
}

export default function DocumentMode({ roomId, userId, username }: DocumentModeProps) {
  const [state, setState] = useState<RoomDocsState | null>(null);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [uploading, setUploading] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localVersionRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const skipEditorUpdateRef = useRef(false);

  const activePage = state?.pages.find((p) => p.id === activePageId) ?? null;

  const postAction = useCallback(
    async (action: string, extra?: Record<string, unknown>) => {
      setError(null);
      const res = await fetch("/api/room/docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, userId, username, action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      if (data.state) {
        localVersionRef.current = data.state.version;
        setState(data.state);
      }
      return data.state as RoomDocsState;
    },
    [roomId, userId, username]
  );

  const loadState = useCallback(async () => {
    try {
      const res = await fetch(`/api/room/docs?roomId=${encodeURIComponent(roomId)}`);
      const data = await res.json();
        if (data.state) {
        localVersionRef.current = data.state.version;
        setState(data.state);
        setActivePageId((prev) => prev ?? data.state.pages[0]?.id ?? null);
      }
    } catch {
      setError("Could not load workspace");
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    loadState();
  }, [loadState]);

  useEffect(() => {
    const es = new EventSource(
      `/api/chat/subscribe?roomId=${encodeURIComponent(roomId)}`
    );
    es.onmessage = (event) => {
      try {
        if (!event.data) return;
        const data = JSON.parse(event.data);
        if (data.type === DOCS_CHANNEL && data.payload) {
          const incoming = data.payload as RoomDocsState;
          if (incoming.version > localVersionRef.current) {
            localVersionRef.current = incoming.version;
            setState(incoming);
          }
        }
      } catch {
        // ignore
      }
    };
    return () => es.close();
  }, [roomId]);

  useEffect(() => {
    if (activePage) setTitleDraft(activePage.title ?? "");
  }, [activePage?.id, activePage?.title]);

  const scheduleSave = useCallback(
    (pageId: string, patch: { title?: string; content?: string }) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      setSaveStatus("saving");
      saveTimerRef.current = setTimeout(async () => {
        try {
          await postAction("updatePage", { pageId, ...patch });
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 2000);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Save failed");
          setSaveStatus("idle");
        }
      }, 1200);
    },
    [postAction]
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Start writing…" }),
    ],
    content: activePage?.content || "<p></p>",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none min-h-[320px] outline-none focus:outline-none px-1",
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (skipEditorUpdateRef.current || !activePageId) return;
      scheduleSave(activePageId, { content: ed.getHTML() });
    },
  });

  useEffect(() => {
    if (!editor || !activePage) return;
    skipEditorUpdateRef.current = true;
    editor.commands.setContent(activePage.content || "<p></p>", { emitUpdate: false });
    skipEditorUpdateRef.current = false;
  }, [editor, activePage?.id]);

  const handleNewPage = async () => {
    try {
      const next = await postAction("createPage", { title: "Untitled" });
      const created = next.pages[next.pages.length - 1];
      if (created) setActivePageId(created.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create page");
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (!confirm("Delete this page and sub-pages?")) return;
    try {
      const next = await postAction("deletePage", { pageId });
      if (activePageId === pageId) {
        setActivePageId(next.pages[0]?.id ?? null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete");
    }
  };

  const handleTitleBlur = () => {
    if (!activePageId || !activePage) return;
    const trimmed = titleDraft.trim() || "Untitled";
    if (trimmed !== activePage.title) {
      scheduleSave(activePageId, { title: trimmed });
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("roomId", roomId);
        form.append("userId", userId);
        form.append("username", username);
        if (activePageId) form.append("pageId", activePageId);
        form.append("file", file);
        const res = await fetch("/api/room/docs/upload", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        if (data.state) {
          localVersionRef.current = data.state.version;
          setState(data.state);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm("Remove this file?")) return;
    try {
      const res = await fetch("/api/room/docs/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, userId, username, fileId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      if (data.state) {
        localVersionRef.current = data.state.version;
        setState(data.state);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const pageFiles = (pageId: string | null): RoomDocFile[] =>
    state?.files.filter((f) => f.pageId === pageId) ?? [];

  const rootPages = state?.pages.filter((p) => !p.parentId) ?? [];

  const renderPageRow = (page: RoomDocPage, depth = 0) => {
    const children = state?.pages.filter((p) => p.parentId === page.id) ?? [];
    const isActive = page.id === activePageId;
    return (
      <div key={page.id}>
        <div
          className={`group flex items-center gap-1 rounded-lg pr-1 ${
            isActive
              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
              : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
          }`}
          style={{ paddingLeft: `${8 + depth * 12}px` }}
        >
          <button
            type="button"
            onClick={() => setActivePageId(page.id)}
            className="flex-1 text-left text-sm py-2 px-2 truncate"
          >
            {page.title || "Untitled"}
          </button>
          <button
            type="button"
            onClick={() => handleDeletePage(page.id)}
            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
            title="Delete page"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children.map((c) => renderPageRow(c, depth + 1))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-900 text-gray-500 text-sm">
        Loading workspace…
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm min-h-0">
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 py-2 flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => setSidebarOpen((v) => !v)}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 lg:hidden"
          aria-label="Toggle sidebar"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <svg className="w-5 h-5 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
        </svg>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
          Room workspace
        </span>
        <span className="text-xs text-gray-400 hidden sm:inline">· shared docs</span>
        <div className="ml-auto flex items-center gap-2 text-xs">
          {saveStatus === "saving" && <span className="text-amber-600">Saving…</span>}
          {saveStatus === "saved" && <span className="text-green-600">Saved</span>}
          {error && <span className="text-red-500 truncate max-w-[10rem]">{error}</span>}
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <aside
          className={`${
            sidebarOpen ? "flex" : "hidden"
          } lg:flex flex-col w-56 shrink-0 border-r border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/50`}
        >
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleNewPage}
              className="w-full btn-3d btn-3d-primary py-2 text-xs rounded-xl"
            >
              + New page
            </button>
          </div>
          <div className="flex-1 overflow-y-auto thin-scrollbar p-2">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 px-2 mb-2">Pages</p>
            {rootPages.map((p) => renderPageRow(p))}
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 p-2 max-h-40 overflow-y-auto thin-scrollbar">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 px-2 mb-2">All files</p>
            {(state?.files.length ?? 0) === 0 ? (
              <p className="text-xs text-gray-500 px-2">No files yet</p>
            ) : (
              state?.files.map((f) => (
                <div key={f.id} className="flex items-center gap-1 px-2 py-1 group">
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-xs text-blue-600 dark:text-blue-400 truncate hover:underline"
                    title={f.name}
                  >
                    {f.name}
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDeleteFile(f.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 min-h-0">
          {activePage ? (
            <>
              <div className="border-b border-gray-200 dark:border-gray-700 px-3 py-2 flex flex-wrap items-center gap-1 bg-gray-50 dark:bg-gray-800 shrink-0">
                <ToolbarBtn
                  active={editor?.isActive("bold")}
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  title="Bold"
                >
                  B
                </ToolbarBtn>
                <ToolbarBtn
                  active={editor?.isActive("italic")}
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  title="Italic"
                >
                  <em>I</em>
                </ToolbarBtn>
                <ToolbarBtn
                  active={editor?.isActive("underline")}
                  onClick={() => editor?.chain().focus().toggleUnderline().run()}
                  title="Underline"
                >
                  <span className="underline">U</span>
                </ToolbarBtn>
                <ToolbarBtn
                  active={editor?.isActive("heading", { level: 2 })}
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                  title="Heading"
                >
                  H2
                </ToolbarBtn>
                <ToolbarBtn
                  active={editor?.isActive("bulletList")}
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  title="Bullet list"
                >
                  • List
                </ToolbarBtn>
                <ToolbarBtn
                  active={editor?.isActive("orderedList")}
                  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                  title="Numbered list"
                >
                  1. List
                </ToolbarBtn>
                <ToolbarBtn
                  active={editor?.isActive("codeBlock")}
                  onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                  title="Code block"
                >
                  {"</>"}
                </ToolbarBtn>
                <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleUpload(e.target.files)}
                />
                <ToolbarBtn
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload file"
                >
                  {uploading ? "…" : "↑ File"}
                </ToolbarBtn>
              </div>

              <div
                className="flex-1 overflow-y-auto thin-scrollbar p-4 md:p-8"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleUpload(e.dataTransfer.files);
                }}
              >
                <div className="max-w-3xl mx-auto">
                  <input
                    value={titleDraft ?? ""}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onBlur={handleTitleBlur}
                    placeholder="Untitled"
                    className="w-full text-2xl md:text-3xl font-bold bg-transparent border-none outline-none text-gray-900 dark:text-white mb-4 placeholder:text-gray-400"
                  />
                  <EditorContent editor={editor} />

                  {pageFiles(activePageId).length > 0 && (
                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                        Attachments
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {pageFiles(activePageId).map((f) => (
                          <div
                            key={f.id}
                            className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 group"
                          >
                            {f.mimeType.startsWith("image/") ? (
                              <img
                                src={f.url}
                                alt=""
                                className="w-12 h-12 rounded-lg object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 text-xs font-bold shrink-0">
                                {f.name.split(".").pop()?.toUpperCase().slice(0, 4)}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <a
                                href={f.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 dark:text-blue-400 truncate block hover:underline"
                              >
                                {f.name}
                              </a>
                              <p className="text-[10px] text-gray-500">
                                {formatBytes(f.size)} · {f.uploadedBy.username}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteFile(f.id)}
                              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="mt-8 text-[10px] text-gray-400">
                    Updated {formatTime(activePage.updatedAt)} by {activePage.updatedBy.username}
                    · Drop files anywhere to upload
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
              Select or create a page
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
