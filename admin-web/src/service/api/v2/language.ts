import { request } from '../../request';

export interface Language {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  icon: string;
  status: number;
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  isSupported?: boolean;
}

export const languageApi = {
  getLanguages: () =>
    request<{ languages: Language[] }>({
      url: '/languages',
      method: 'GET'
    }),

  getSupportedLanguages: () =>
    request<{ languages: Language[] }>({
      url: '/languages/supported',
      method: 'GET'
    }),

  createLanguage: (data: Partial<Language>) =>
    request<Language>({
      url: '/languages',
      method: 'POST',
      data
    }),

  updateLanguage: (data: Partial<Language>) =>
    request<Language>({
      url: `/languages/${data.id}`,
      method: 'PUT',
      data
    }),

  deleteLanguage: (id: string) =>
    request<{ success: boolean }>({
      url: `/languages/${id}`,
      method: 'DELETE'
    }),

  setDefaultLanguage: (id: string) =>
    request<{ success: boolean }>({
      url: `/languages/${id}/default`,
      method: 'PUT'
    }),

  setSupportedLanguages: (languageIds: string[]) =>
    request<{ success: boolean }>({
      url: '/languages/supported',
      method: 'PUT',
      data: { languageIds }
    })
};
