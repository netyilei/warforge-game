import { request } from '../request';

export interface ContentCategory {
  id: string;
  name: string;
  code: string;
  description: string;
  contentType: 'text' | 'html' | 'markdown';
  icon: string;
  parentId: string;
  sortOrder: number;
  status: number;
  createdAt: string;
  updatedAt: string;
}

export interface Content {
  id: string;
  categoryId: string;
  authorId: string;
  coverImage: string;
  isMarquee: boolean;
  isPopup: boolean;
  startTime: string | null;
  endTime: string | null;
  sortOrder: number;
  status: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContentTranslation {
  id: string;
  contentId: string;
  lang: string;
  title: string;
  summary: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentWithTranslations {
  content: Content;
  translations: ContentTranslation[];
  category?: ContentCategory;
}

export interface BannerGroup {
  id: string;
  name: string;
  code: string;
  description: string;
  width: number;
  height: number;
  status: number;
  sortOrder: number;
  bannerCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BannerExtraData {
  [key: string]: string | number | boolean;
}

export interface Banner {
  id: string;
  groupId: string;
  imageUrl: string;
  linkUrl: string;
  linkTarget: string;
  isExternal: boolean;
  extraData: BannerExtraData;
  startTime: string | null;
  endTime: string | null;
  sortOrder: number;
  status: number;
  createdAt: string;
  updatedAt: string;
}

export interface BannerTranslation {
  lang: string;
  title: string;
  content: string;
}

export interface BannerWithTranslations {
  banner: Banner;
  translations: BannerTranslation[];
}

export const contentApi = {
  getCategories: () =>
    request<{ categories: ContentCategory[] }>({
      url: '/content/categories',
      method: 'GET'
    }),

  createCategory: (data: Partial<ContentCategory>) =>
    request<ContentCategory>({
      url: '/content/categories',
      method: 'POST',
      data
    }),

  updateCategory: (data: Partial<ContentCategory>) =>
    request<ContentCategory>({
      url: `/content/categories/${data.id}`,
      method: 'PUT',
      data
    }),

  deleteCategory: (id: string) =>
    request<{ success: boolean }>({
      url: `/content/categories/${id}`,
      method: 'DELETE'
    }),

  getContents: (categoryId?: string, page = 1, pageSize = 20) =>
    request<{ list: ContentWithTranslations[]; total: number; page: number; pageSize: number }>({
      url: '/content',
      method: 'GET',
      params: { categoryId, page, pageSize }
    }),

  getContent: (id: string) =>
    request<ContentWithTranslations>({
      url: `/content/${id}`,
      method: 'GET'
    }),

  createContent: (data: {
    categoryId: string;
    authorId?: string;
    coverImage?: string;
    isMarquee?: boolean;
    isPopup?: boolean;
    startTime?: string;
    endTime?: string;
    sortOrder?: number;
    status?: number;
    translations: { lang: string; title: string; summary?: string; content?: string }[];
  }) =>
    request<ContentWithTranslations>({
      url: '/content',
      method: 'POST',
      data
    }),

  updateContent: (id: string, data: {
    categoryId: string;
    coverImage?: string;
    isMarquee?: boolean;
    isPopup?: boolean;
    startTime?: string;
    endTime?: string;
    sortOrder?: number;
    status?: number;
    translations?: { lang: string; title: string; summary?: string; content?: string }[];
  }) =>
    request<ContentWithTranslations>({
      url: `/content/${id}`,
      method: 'PUT',
      data
    }),

  deleteContent: (id: string) =>
    request<{ success: boolean }>({
      url: `/content/${id}`,
      method: 'DELETE'
    }),

  getBannerGroups: () =>
    request<{ groups: BannerGroup[] }>({
      url: '/banner-groups',
      method: 'GET'
    }),

  createBannerGroup: (data: Partial<BannerGroup>) =>
    request<BannerGroup>({
      url: '/banner-groups',
      method: 'POST',
      data
    }),

  updateBannerGroup: (data: Partial<BannerGroup>) =>
    request<BannerGroup>({
      url: `/banner-groups/${data.id}`,
      method: 'PUT',
      data
    }),

  deleteBannerGroup: (id: string) =>
    request<{ success: boolean }>({
      url: `/banner-groups/${id}`,
      method: 'DELETE'
    }),

  getBanners: (groupId: string) =>
    request<{ banners: BannerWithTranslations[] }>({
      url: '/banners',
      method: 'GET',
      params: { groupId }
    }),

  createBanner: (data: {
    groupId: string;
    imageUrl: string;
    linkUrl?: string;
    linkTarget?: string;
    isExternal?: boolean;
    extraData?: BannerExtraData;
    startTime?: string;
    endTime?: string;
    sortOrder?: number;
    status?: number;
    translations?: BannerTranslation[];
  }) =>
    request<BannerWithTranslations>({
      url: '/banners',
      method: 'POST',
      data
    }),

  updateBanner: (data: {
    id: string;
    imageUrl: string;
    linkUrl?: string;
    linkTarget?: string;
    isExternal?: boolean;
    extraData?: BannerExtraData;
    startTime?: string;
    endTime?: string;
    sortOrder?: number;
    status?: number;
    translations?: BannerTranslation[];
  }) =>
    request<{ success: boolean }>({
      url: `/banners/${data.id}`,
      method: 'PUT',
      data
    }),

  deleteBanner: (id: string) =>
    request<{ success: boolean }>({
      url: `/banners/${id}`,
      method: 'DELETE'
    })
};
