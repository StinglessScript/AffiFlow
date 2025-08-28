import {
  Post,
  PostProduct,
  Product,
  User,
  UserWorkspace,
  Workspace,
} from "@prisma/client";

// Extended types with relations
export type UserWithWorkspaces = User & {
  workspaces: (UserWorkspace & {
    workspace: Workspace;
  })[];
};

export type WorkspaceWithUsers = Workspace & {
  users: (UserWorkspace & {
    user: User;
  })[];
};

export type PostWithProducts = Post & {
  products: (PostProduct & {
    product: Product;
  })[];
  workspace: Workspace;
};

export type ProductWithPosts = Product & {
  posts: (PostProduct & {
    post: Post;
  })[];
};

// Form types
export interface CreateWorkspaceData {
  name: string;
  slug: string;
  description?: string;
}

export interface CreatePostData {
  title: string;
  content?: string;
  videoUrl?: string;
  videoType?: "YOUTUBE" | "TIKTOK" | "INSTAGRAM";
  workspaceId: string;
}

export interface CreateProductData {
  name: string;
  description?: string;
  image?: string;
  price?: number;
  currency?: string;
  categoryId?: string;
  activeAffiliateLinkId?: string;
  workspaceId: string;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  image?: string;
  price?: number;
  currency?: string;
  categoryId?: string;
  activeAffiliateLinkId?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Video embed types
export interface VideoEmbedData {
  url: string;
  type: "YOUTUBE" | "TIKTOK" | "INSTAGRAM";
  embedUrl: string;
  thumbnail?: string;
  title?: string;
  duration?: number;
}
