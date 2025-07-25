import { Request, Response } from 'express';
import checkoutRepo, {
  Address,
} from './checkoutRepo';

export const initializeCheckout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { basketId, customerId, guestEmail } = req.body;

    if (!basketId) {
      res.status(400).json({
        success: false,
        error: 'Basket ID is required'
      });
      return;
    }

    // Check if there's an existing active session for this basket
    const existingSession = await checkoutRepo.findCheckoutSessionByBasketId(basketId);

    if (existingSession) {
      res.status(200).json({
        success: true,
        data: existingSession,
        message: 'Existing checkout session found'
      });
      return;
    }

    // Create a new checkout session
    const session = await checkoutRepo.createCheckoutSession(
      basketId,
      customerId,
      guestEmail
    );

    res.status(201).json({
      success: true,
      data: session,
      message: 'Checkout session created successfully'
    });
  } catch (error) {
    console.error('Failed to initialize checkout:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize checkout'
    });
  }
}

// Get checkout session by ID
export const getCheckoutSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    const session = await checkoutRepo.findCheckoutSessionById(sessionId);

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Checkout session not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Failed to get checkout session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get checkout session'
    });
  }
}

// Update shipping address
export const updateShippingAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const address: Address = req.body;

    // Validate address
    if (!validateAddress(address)) {
      res.status(400).json({
        success: false,
        error: 'Invalid shipping address'
      });
      return;
    }

    const updatedSession = await checkoutRepo.updateShippingAddress(sessionId, address);

    if (!updatedSession) {
      res.status(404).json({
        success: false,
        error: 'Checkout session not found'
      });
      return;
    }

    // Recalculate totals (may affect tax based on shipping location)
    const sessionWithTotals = await checkoutRepo.calculateTaxes(sessionId);

    res.status(200).json({
      success: true,
      data: sessionWithTotals,
      message: 'Shipping address updated successfully'
    });
  } catch (error) {
    console.error('Failed to update shipping address:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update shipping address'
    });
  }
}

// Update billing address
export const updateBillingAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const address: Address = req.body;

    // Validate address
    if (!validateAddress(address)) {
      res.status(400).json({
        success: false,
        error: 'Invalid billing address'
      });
      return;
    }

    const updatedSession = await checkoutRepo.updateBillingAddress(sessionId, address);

    if (!updatedSession) {
      res.status(404).json({
        success: false,
        error: 'Checkout session not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: updatedSession,
      message: 'Billing address updated successfully'
    });
  } catch (error) {
    console.error('Failed to update billing address:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update billing address'
    });
  }
}

// Get all available shipping methods
export const getShippingMethods = async (req: Request, res: Response): Promise<void> => {
  try {
    const methods = await checkoutRepo.getShippingMethods();

    res.status(200).json({
      success: true,
      data: methods
    });
  } catch (error) {
    console.error('Failed to get shipping methods:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get shipping methods'
    });
  }
}

// Select shipping method
export const selectShippingMethod = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { shippingMethodId } = req.body;

    if (!shippingMethodId) {
      res.status(400).json({
        success: false,
        error: 'Shipping method ID is required'
      });
      return;
    }

    const updatedSession = await checkoutRepo.selectShippingMethod(sessionId, shippingMethodId);

    if (!updatedSession) {
      res.status(404).json({
        success: false,
        error: 'Checkout session or shipping method not found'
      });
      return;
    }

    // Recalculate totals (shipping cost changed)
    const sessionWithTotals = await checkoutRepo.calculateTaxes(sessionId);

    res.status(200).json({
      success: true,
      data: sessionWithTotals,
      message: 'Shipping method selected successfully'
    });
  } catch (error) {
    console.error('Failed to select shipping method:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to select shipping method'
    });
  }
}

// Get all available payment methods
export const getPaymentMethods = async (req: Request, res: Response): Promise<void> => {
  try {
    const methods = await checkoutRepo.getPaymentMethods();

    res.status(200).json({
      success: true,
      data: methods
    });
  } catch (error) {
    console.error('Failed to get payment methods:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payment methods'
    });
  }
}

// Select payment method
export const selectPaymentMethod = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { paymentMethodId } = req.body;

    if (!paymentMethodId) {
      res.status(400).json({
        success: false,
        error: 'Payment method ID is required'
      });
      return;
    }

    const updatedSession = await checkoutRepo.selectPaymentMethod(sessionId, paymentMethodId);

    if (!updatedSession) {
      res.status(404).json({
        success: false,
        error: 'Checkout session or payment method not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: updatedSession,
      message: 'Payment method selected successfully'
    });
  } catch (error) {
    console.error('Failed to select payment method:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to select payment method'
    });
  }
}

// Calculate order totals
export const calculateTotals = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    const updatedSession = await checkoutRepo.calculateTaxes(sessionId);

    if (!updatedSession) {
      res.status(404).json({
        success: false,
        error: 'Checkout session not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: updatedSession
    });
  } catch (error) {
    console.error('Failed to calculate order totals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate order totals'
    });
  }
}

// Complete checkout and create order
export const completeCheckout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    // Validate checkout session
    const validation = await checkoutRepo.validateCheckout(sessionId);

    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        errors: validation.errors
      });
      return;
    }

    // Complete checkout and create order
    const result = await checkoutRepo.createOrder(sessionId);

    if (!result.success) {
      res.status(400).json({
        success: false,
        errors: result.errors
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: {
        orderId: result.orderId
      },
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('Failed to complete checkout:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete checkout'
    });
  }
}

// Abandon checkout session
export const abandonCheckout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    // Updated: abandonCheckoutSession is no longer available
    // Instead, we'll update the session status to 'abandoned'
    await checkoutRepo.updateCheckoutSession(sessionId, { status: 'abandoned' });

    res.status(200).json({
      success: true,
      message: 'Checkout session abandoned successfully'
    });
  } catch (error) {
    console.error('Failed to abandon checkout:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to abandon checkout'
    });
  }
}

// Helper method to validate address
const validateAddress = (address: Address): boolean => {
  const requiredFields = [
    'firstName',
    'lastName',
    'addressLine1',
    'city',
    'postalCode',
    'country'
  ];

  return requiredFields.every(field => Boolean((address as any)[field]));
}
