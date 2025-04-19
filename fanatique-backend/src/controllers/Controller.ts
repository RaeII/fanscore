import { Response } from 'express';
import { getErrorStatusCode } from '@/helpers/response_collection';

class Controller {
    /**
     * Resposta para mensagens de sucesso
     * @param res Resposta do express
     * @param data Dados para resposta
     */
    protected sendSuccessResponse(res: Response, data: any): void {
        res.status(200).json({
            status: 'SUCCESS',
            ...data
        });
    }

    /**
     * Trata e exibe mensagens de erro
     * @param res Resposta do express
     * @param error Objeto de erro
     * @param defaultMsg Mensagem padrão caso o erro não tenha mensagem
     */
    protected async sendErrorMessage(res: Response, error: any, defaultMsg = 'Ocorreu um erro inesperado'): Promise<void> {
        console.error(error);
        const message = error?.message || defaultMsg;
        
        res.status(getErrorStatusCode('badRequest')).json({
            status: 'ERROR',
            message
        });
    }
}

export default Controller;