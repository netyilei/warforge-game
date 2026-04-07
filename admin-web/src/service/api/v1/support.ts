import { request } from '../../request';

export const supportApi = {
    sendEmail: (data: { to: string | string[]; subject: string; content: string }) =>
        request<{ message: string; taskId?: string; count?: number }>({
            url: '/support/email',
            method: 'POST',
            data
        })
};
