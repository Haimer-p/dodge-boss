import { generateId } from "./utils";

export interface DocAuthor {
  userId: string;
  username: string;
}

export interface RoomDocPage {
  id: string;
  title: string;
  content: string;
  parentId: string | null;
  createdAt: number;
  updatedAt: number;
  createdBy: DocAuthor;
  updatedBy: DocAuthor;
}

export interface RoomDocFile {
  id: string;
  pageId: string | null;
  name: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: number;
  uploadedBy: DocAuthor;
}

export interface RoomDocsState {
  version: number;
  pages: RoomDocPage[];
  files: RoomDocFile[];
  updatedAt: number;
}

export function createInitialDocsState(): RoomDocsState {
  const now = Date.now();
  const welcomeId = generateId();
  return {
    version: 1,
    pages: [
      {
        id: welcomeId,
        title: "Welcome",
        content:
          "<h2>Room workspace</h2><p>Collaborative docs for everyone in this room. Create pages, write notes, and upload files.</p><ul><li>Use <strong>New page</strong> in the sidebar</li><li>Edits auto-save for all members</li><li>Attach files from the toolbar</li></ul>",
        parentId: null,
        createdAt: now,
        updatedAt: now,
        createdBy: { userId: "system", username: "System" },
        updatedBy: { userId: "system", username: "System" },
      },
    ],
    files: [],
    updatedAt: now,
  };
}

export function bumpDocsState(state: RoomDocsState): RoomDocsState {
  return {
    ...state,
    version: state.version + 1,
    updatedAt: Date.now(),
  };
}

export function createPage(
  state: RoomDocsState,
  userId: string,
  username: string,
  title = "Untitled",
  parentId: string | null = null
): RoomDocsState {
  const now = Date.now();
  const author = { userId, username };
  const page: RoomDocPage = {
    id: generateId(),
    title: title ?? "Untitled",
    content: "<p></p>",
    parentId,
    createdAt: now,
    updatedAt: now,
    createdBy: author,
    updatedBy: author,
  };
  return bumpDocsState({
    ...state,
    pages: [...state.pages, page],
  });
}

export function updatePage(
  state: RoomDocsState,
  pageId: string,
  userId: string,
  username: string,
  patch: { title?: string; content?: string }
): { state: RoomDocsState; error?: string } {
  const idx = state.pages.findIndex((p) => p.id === pageId);
  if (idx < 0) return { state, error: "Page not found" };

  const now = Date.now();
  const pages = [...state.pages];
  const current = pages[idx];
  pages[idx] = {
    ...current,
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.content !== undefined ? { content: patch.content } : {}),
    updatedAt: now,
    updatedBy: { userId, username },
  };

  return {
    state: bumpDocsState({ ...state, pages }),
  };
}

export function deletePage(
  state: RoomDocsState,
  pageId: string
): { state: RoomDocsState; error?: string } {
  if (state.pages.length <= 1) {
    return { state, error: "Cannot delete the last page" };
  }
  const childIds = new Set<string>();
  const collect = (id: string) => {
    childIds.add(id);
    state.pages.filter((p) => p.parentId === id).forEach((p) => collect(p.id));
  };
  collect(pageId);

  return {
    state: bumpDocsState({
      ...state,
      pages: state.pages.filter((p) => !childIds.has(p.id)),
      files: state.files.map((f) =>
        f.pageId && childIds.has(f.pageId) ? { ...f, pageId: null } : f
      ),
    }),
  };
}

export function addFile(
  state: RoomDocsState,
  file: Omit<RoomDocFile, "id" | "uploadedAt">
): RoomDocsState {
  return bumpDocsState({
    ...state,
    files: [
      ...state.files,
      {
        ...file,
        id: generateId(),
        uploadedAt: Date.now(),
      },
    ],
  });
}

export function deleteFile(
  state: RoomDocsState,
  fileId: string
): { state: RoomDocsState; file?: RoomDocFile } {
  const file = state.files.find((f) => f.id === fileId);
  return {
    state: bumpDocsState({
      ...state,
      files: state.files.filter((f) => f.id !== fileId),
    }),
    file,
  };
}
