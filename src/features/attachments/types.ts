export type AttachmentTypeFilter = "all" | "image" | "pdf" | "text";
export type AttachmentOrder = "asc" | "desc";

export type AttachmentListItem = {
  id: string;
  filename: string;
  mediaType: string;
  size: number;
  storagePath: string;
  url: string;
  createdAt: Date;
  isLinked: boolean;
};

export type Cursor = {
  createdAt: string;
  id: string;
};
