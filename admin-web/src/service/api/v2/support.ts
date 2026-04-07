import { requestV2 } from '../../request';

export const supportApi = {
    sendEmail: (data: { to: string | string[]; subject: string; content: string }) =>
        requestV2<{ message: string; taskId?: string; count?: number }>({
            url: '/support/email',
            method: 'POST',
            data
        })
};
