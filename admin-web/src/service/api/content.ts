import { request } from '../request';

export interface ContentCategory {
  id: string;
  name: string;
  code: string;
  description: string;
  contentType: 'text' | 'html' | 'markdown';
  icon: string;
  sortOrder: number;
  status: number;
  createdAt: string;
  updatedAt: string;
}

export interface Content {
  id: string;
  categoryId: string;
  position: string;
  coverImage: string;
  linkUrl: string;
  linkTarget: string;
  isMarquee: boolean;
  isPopup: boolean;
  startTime: string | null;
  endTime: string | null;
  sortOrder: number;
  status: number;
  authorId: string;
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

export interface BannerPosition {
  id: string;
  name: string;
  code: string;
  description: string;
  width: number;
  height: number;
  maxItems: number;
  status: number;
  createdAt: string;
  updatedAt: string;
}

export interface Banner {
  id: string;
  positionId: string;
  sortOrder: number;
  status: number;
  startTime: string | null;
  endTime: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BannerTranslation {
  id: string;
  bannerId: string;
  lang: string;
  imageUrl: string;
  altText: string;
  linkUrl: string;
  gameId: string;
  linkTarget: string;
  createdAt: string;
  updatedAt: string;
}

export interface BannerWithTranslations {
  banner: Banner;
  translations: BannerTranslation[];
  position?: BannerPosition;
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
    request<{ contents: ContentWithTranslations[]; total: number; page: number; pageSize: number }>({
      url: '/content',
      method: 'GET',
      params: { categoryId, page, pageSize }
    }),

  getContent: (id: string) =>
    request<ContentWithTranslations>({
      url: `/content/${id}`,
      method: 'GET'
    }),

  createContent: (data: { content: Partial<Content>; translations: Partial<ContentTranslation>[] }) =>
    request<{ content: Content; translations: ContentTranslation[] }>({
      url: '/content',
      method: 'POST',
      data
    }),

  updateContent: (data: { content: Partial<Content>; translations: Partial<ContentTranslation>[] }) =>
    request<{ content: Content; translations: ContentTranslation[] }>({
      url: `/content/${data.content.id}`,
      method: 'PUT',
      data
    }),

  deleteContent: (id: string) =>
    request<{ success: boolean }>({
      url: `/content/${id}`,
      method: 'DELETE'
    }),

  getBannerPositions: () =>
    request<{ positions: BannerPosition[] }>({
      url: '/banners/positions',
      method: 'GET'
    }),

  createBannerPosition: (data: Partial<BannerPosition>) =>
    request<BannerPosition>({
      url: '/banners/positions',
      method: 'POST',
      data
    }),

  updateBannerPosition: (data: Partial<BannerPosition>) =>
    request<BannerPosition>({
      url: `/banners/positions/${data.id}`,
      method: 'PUT',
      data
    }),

  deleteBannerPosition: (id: string) =>
    request<{ success: boolean }>({
      url: `/banners/positions/${id}`,
      method: 'DELETE'
    }),

  getBanners: (positionId?: string) =>
    request<{ banners: BannerWithTranslations[] }>({
      url: '/banners',
      method: 'GET',
      params: { positionId }
    }),

  getBanner: (id: string) =>
    request<BannerWithTranslations>({
      url: `/banners/${id}`,
      method: 'GET'
    }),

  createBanner: (data: { banner: Partial<Banner>; translations: Partial<BannerTranslation>[] }) =>
    request<{ banner: Banner; translations: BannerTranslation[] }>({
      url: '/banners',
      method: 'POST',
      data
    }),

  updateBanner: (data: { banner: Partial<Banner>; translations: Partial<BannerTranslation>[] }) =>
    request<{ banner: Banner; translations: BannerTranslation[] }>({
      url: `/banners/${data.banner.id}`,
      method: 'PUT',
      data
    }),

  deleteBanner: (id: string) =>
    request<{ success: boolean }>({
      url: `/banners/${id}`,
      method: 'DELETE'
    })
};
