import { request } from '../../request';

export const supportApi = {
    sendEmail: (data: { to: string; subject: string; content: string }) =>
        request<{ message: string }>({
            url: '/support/email',
            method: 'POST',
            data
        })
};
