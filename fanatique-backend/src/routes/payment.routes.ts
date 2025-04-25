import { Router } from 'express';
import paymentController from '../controllers/payment.controller';

const router = Router();

/**
 * @route POST /api/payment/signature
 * @desc Gera uma assinatura para pagamento
 * @access Public
 * @body { purchaseId: number, buyer: string, clubId: number, amount: string }
 * @returns { success: boolean, data: { purchaseId, buyer, clubId, amount, contractAddress, chainId, signature } }
 */
router.post('/signature', paymentController.generateSignature);

/**
 * @route POST /api/payment/verify
 * @desc Verifica se uma assinatura é válida
 * @access Public
 * @body { purchaseId: number, buyer: string, clubId: number, amount: string, signature: string }
 * @returns { success: boolean, isValid: boolean }
 */
router.post('/verify', paymentController.verifySignature);

export default router; 