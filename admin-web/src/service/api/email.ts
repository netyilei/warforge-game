import { request } from '../request';

export interface EmailConfig {
  id: string;
  name: string;
  code: string;
  protocol: 'smtp' | 'smtps' | 'starttls';
  encryption: 'tls' | 'ssl' | 'none';
  host: string;
  port: number;
  username: string;
  password?: string;
  fromName: string;
  fromEmail: string;
  isDefault: boolean;
  status: number;
  sortOrder: number;
}

export interface EmailTemplate {
  id: string;
  name: string;
  code: string;
  subject: string;
  contentType: 'html' | 'text';
  content: string;
  description: string;
  variables: Record<string, { description: string; example: string }>;
  status: number;
}

export interface EmailConfigListResponse {
  configs: EmailConfig[];
}

export interface EmailTemplateListResponse {
  templates: EmailTemplate[];
}

export const emailApi = {
  getConfigs: () =>
    request<EmailConfigListResponse>({
      url: '/email/configs',
      method: 'GET'
    }),

  getConfig: (id: string) =>
    request<EmailConfig>({
      url: `/email/configs/${id}`,
      method: 'GET'
    }),

  createConfig: (data: Partial<EmailConfig>) =>
    request<EmailConfig>({
      url: '/email/configs',
      method: 'POST',
      data
    }),

  updateConfig: (id: string, data: Partial<EmailConfig>) =>
    request<void>({
      url: `/email/configs/${id}`,
      method: 'PUT',
      data
    }),

  deleteConfig: (id: string) =>
    request<{ success: boolean }>({
      url: `/email/configs/${id}`,
      method: 'DELETE'
    }),

  getTemplates: () =>
    request<EmailTemplateListResponse>({
      url: '/email/templates',
      method: 'GET'
    }),

  getTemplate: (id: string) =>
    request<EmailTemplate>({
      url: `/email/templates/${id}`,
      method: 'GET'
    }),

  createTemplate: (data: Partial<EmailTemplate>) =>
    request<EmailTemplate>({
      url: '/email/templates',
      method: 'POST',
      data
    }),

  updateTemplate: (id: string, data: Partial<EmailTemplate>) =>
    request<void>({
      url: `/email/templates/${id}`,
      method: 'PUT',
      data
    }),

  deleteTemplate: (id: string) =>
    request<{ success: boolean }>({
      url: `/email/templates/${id}`,
      method: 'DELETE'
    }),

  sendTestEmail: (data: { configId?: string; toEmail: string; subject: string; content: string }) =>
    request<{ success: boolean; message: string }>({
      url: '/email/send-test',
      method: 'POST',
      data
    })
};
