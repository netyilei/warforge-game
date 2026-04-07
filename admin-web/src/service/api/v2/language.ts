import { requestV2 } from '../../request';

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
    requestV2<{ languages: Language[] }>({
      url: '/languages',
      method: 'GET'
    }),

  getSupportedLanguages: () =>
    requestV2<{ languages: Language[] }>({
      url: '/languages/supported',
      method: 'GET'
    }),

  createLanguage: (data: Partial<Language>) =>
    requestV2<Language>({
      url: '/languages',
      method: 'POST',
      data
    }),

  updateLanguage: (data: Partial<Language>) =>
    requestV2<Language>({
      url: `/languages/${data.id}`,
      method: 'PUT',
      data
    }),

  deleteLanguage: (id: string) =>
    requestV2<{ success: boolean }>({
      url: `/languages/${id}`,
      method: 'DELETE'
    }),

  setDefaultLanguage: (id: string) =>
    requestV2<{ success: boolean }>({
      url: `/languages/${id}/default`,
      method: 'PUT'
    }),

  setSupportedLanguages: (languageIds: string[]) =>
    requestV2<{ success: boolean }>({
      url: '/languages/supported',
      method: 'PUT',
      data: { languageIds }
    })
};
