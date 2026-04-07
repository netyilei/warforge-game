import { requestV2 } from '../../request';

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
  extraData: BannerExtraData;
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
    requestV2<{ categories: ContentCategory[] }>({
      url: '/categories',
      method: 'GET'
    }),

  createCategory: (data: Partial<ContentCategory>) =>
    requestV2<ContentCategory>({
      url: '/categories',
      method: 'POST',
      data
    }),

  updateCategory: (data: Partial<ContentCategory>) =>
    requestV2<ContentCategory>({
      url: `/categories/${data.id}`,
      method: 'PUT',
      data
    }),

  deleteCategory: (id: string) =>
    requestV2<{ success: boolean }>({
      url: `/categories/${id}`,
      method: 'DELETE'
    }),

  getContents: (categoryId?: string, page = 1, pageSize = 20) =>
    requestV2<{ list: ContentWithTranslations[]; total: number; page: number; pageSize: number }>({
      url: '/contents',
      method: 'GET',
      params: { categoryId, page, pageSize }
    }),

  getContent: (id: string) =>
    requestV2<ContentWithTranslations>({
      url: `/contents/${id}`,
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
    requestV2<ContentWithTranslations>({
      url: '/contents',
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
    requestV2<ContentWithTranslations>({
      url: `/contents/${id}`,
      method: 'PUT',
      data
    }),

  deleteContent: (id: string) =>
    requestV2<{ success: boolean }>({
      url: `/contents/${id}`,
      method: 'DELETE'
    }),

  getBannerGroups: () =>
    requestV2<{ groups: BannerGroup[] }>({
      url: '/banner-groups',
      method: 'GET'
    }),

  createBannerGroup: (data: Partial<BannerGroup>) =>
    requestV2<BannerGroup>({
      url: '/banner-groups',
      method: 'POST',
      data
    }),

  updateBannerGroup: (data: Partial<BannerGroup>) =>
    requestV2<BannerGroup>({
      url: `/banner-groups/${data.id}`,
      method: 'PUT',
      data
    }),

  deleteBannerGroup: (id: string) =>
    requestV2<{ success: boolean }>({
      url: `/banner-groups/${id}`,
      method: 'DELETE'
    }),

  getBanners: (groupId: string) =>
    requestV2<{ banners: BannerWithTranslations[] }>({
      url: '/banners',
      method: 'GET',
      params: { groupId }
    }),

  createBanner: (data: {
    groupId: string;
    imageUrl: string;
    linkUrl?: string;
    linkTarget?: string;
    extraData?: BannerExtraData;
    sortOrder?: number;
    status?: number;
    translations?: BannerTranslation[];
  }) =>
    requestV2<BannerWithTranslations>({
      url: '/banners',
      method: 'POST',
      data
    }),

  updateBanner: (data: {
    id: string;
    imageUrl: string;
    linkUrl?: string;
    linkTarget?: string;
    extraData?: BannerExtraData;
    sortOrder?: number;
    status?: number;
    translations?: BannerTranslation[];
  }) =>
    requestV2<{ success: boolean }>({
      url: `/banners/${data.id}`,
      method: 'PUT',
      data
    }),

  deleteBanner: (id: string) =>
    requestV2<{ success: boolean }>({
      url: `/banners/${id}`,
      method: 'DELETE'
    })
};
