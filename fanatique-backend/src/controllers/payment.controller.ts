import { Request, Response } from 'express';
import paymentService from '../services/payment.service';

/**
 * Controller para gerenciar requisições relacionadas a pagamentos
 */
class PaymentController {
  /**
   * Gera uma assinatura para uma compra
   * Esta assinatura será usada pelo front-end para executar o smart contract
   * 
   * @param req Request
   * @param res Response
   */
  async generateSignature(req: Request, res: Response) {
    try {
      const { purchaseId, buyer, clubId, amount } = req.body;
      
      if (!purchaseId || !buyer || !clubId || !amount) {
        return res.status(400).json({
          success: false,
          message: 'Dados incompletos. purchaseId, buyer, clubId e amount são obrigatórios.'
        });
      }
      
      // Gera a assinatura usando o serviço de pagamento
      const paymentData = await paymentService.signPayment(
        parseInt(purchaseId, 10),
        buyer,
        parseInt(clubId, 10),
        amount
      );
      
      return res.status(200).json({
        success: true,
        data: paymentData
      });
    } catch (error: any) {
      console.error('Erro ao gerar assinatura:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao gerar assinatura de pagamento'
      });
    }
  }

  /**
   * Verifica se uma assinatura é válida
   * Útil para debugging e testes
   * 
   * @param req Request
   * @param res Response
   */
  async verifySignature(req: Request, res: Response) {
    try {
      const { purchaseId, buyer, clubId, amount, signature } = req.body;
      
      if (!purchaseId || !buyer || !clubId || !amount || !signature) {
        return res.status(400).json({
          success: false,
          message: 'Dados incompletos. purchaseId, buyer, clubId, amount e signature são obrigatórios.'
        });
      }
      
      const isValid = await paymentService.verifySignature(
        parseInt(purchaseId, 10),
        buyer,
        parseInt(clubId, 10),
        amount,
        signature
      );
      
      return res.status(200).json({
        success: true,
        isValid
      });
    } catch (error: any) {
      console.error('Erro ao verificar assinatura:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao verificar assinatura de pagamento'
      });
    }
  }
}

export default new PaymentController(); 