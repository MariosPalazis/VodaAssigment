import { api } from "./http";

export interface Post {
  _id: string;
  userId: string;
  title: string;
  body: string;
  createdAt?: string;
  updatedAt?: string;
  liked?: boolean;
}

export interface ListPostsResponse {
  items: Post[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  search: string | null;
  likedEnabled: boolean;
}

export interface ListPostsParams {
  page?: number;
  limit?: number;
  search?: string;
  token?: string | null;
}

export async function listPostsApi(params: ListPostsParams) {
  const { page = 1, limit = 10, search = "", token } = params;

  const res = await api.post<ListPostsResponse>(
    `/posts?page=${page}&limit=${limit}`,
    { search: search || undefined },
    {
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : undefined,
    }
  );

  return res.data;
}

export interface CreatePostRequest {
  title: string;
  body: string;
  token: string;
}

export async function createPostApi(payload: CreatePostRequest) {
  const { title, body, token } = payload;
  const res = await api.post(
    "/posts/create",
    { title, body },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return res.data as Post;
}

export async function likePostApi(postId: string, token: string) {
  const res = await api.post(
    `/posts/${postId}/like`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data as { liked: boolean };
}

export async function unlikePostApi(postId: string, token: string) {
  const res = await api.delete(`/posts/${postId}/like`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data as { liked: boolean };
}

export async function clearLikesApi(token: string) {
  const res = await api.delete("/posts/clear/likes", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data as { deletedCount: number };
}
