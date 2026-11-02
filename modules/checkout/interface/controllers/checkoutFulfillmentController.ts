/**
 * Checkout Fulfillment Controller
 * HTTP interface for checkout fulfillment operations (shipping/pickup/local delivery)
 */

import type { HttpRequest, HttpResponse } from 'libs/http';
import { getCheckoutPorts } from '../../application/wired';
import {
  getPickupSlotsUseCase,
  manageCheckoutSessionUseCase,
  setPickupLocationUseCase,
} from '../../application/useCases/wired';
import { respond, respondError } from './CheckoutController';

type CheckoutPorts = ReturnType<typeof getCheckoutPorts>;
type CheckoutSession = NonNullable<Awaited<ReturnType<typeof manageCheckoutSessionUseCase.findById>>>;

interface PickupLocationBody {
  pickupLocationId: string;
}

/**
 * Get available shipping methods
 * GET /checkout/:checkoutId/shipping-methods
 */
export const getShippingMethods = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { checkoutId } = req.params;

  const session = await manageCheckoutSessionUseCase.findById(checkoutId);
  if (!session) {
    respondError(req, res, 'Checkout session not found', 404);
    return;
  }

  if (!session.shippingAddress) {
    respondError(req, res, 'Shipping address must be set first', 400);
    return;
  }

  // Fetch basket for order details
  let subtotalCents = 0;

  try {
    const ports = getCheckoutPorts();
    const basket = await ports.basketSnapshot.getSnapshot(session.basketId);
    if (basket) {
      subtotalCents = basket.subtotal?.cents ?? 0;
    }
  } catch {
    // Basket lookup is best-effort; fall back to defaults
  }

  const ports = getCheckoutPorts();
  const shippingOptions = await ports.shippingQuote.getShippingOptions({
    basketId: session.basketId,
    shippingAddress: {
      country: session.shippingAddress.country,
      region: session.shippingAddress.region,
      city: session.shippingAddress.city,
      postalCode: session.shippingAddress.postalCode,
    },
    totalValueCents: subtotalCents,
  });

  if (shippingOptions.length === 0) {
    respondError(req, res, 'No shipping methods available', 400);
    return;
  }

  // Map shipping options to the format expected by the checkout UI
  const methods = shippingOptions.map(rate => ({
    id: rate.methodId,
    name: rate.methodName,
    description: rate.estimatedDays ? `${rate.estimatedDays} day(s) delivery` : '',
    priceCents: rate.amountCents,
    currency: rate.currency,
    estimatedDeliveryDays: rate.estimatedDays,
  }));

  respond(req, res, methods as unknown as unknown, 200);
};

/**
 * Get available pickup locations
 * GET /checkout/pickup-locations
 */
export const getPickupLocations = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { latitude, longitude, radius } = req.query;

  const ports = getCheckoutPorts();

  if (latitude && longitude) {
    const lat = parseFloat(String(latitude));
    const lng = parseFloat(String(longitude));
    const rad = radius ? parseFloat(String(radius)) : 50;
    const locations = await ports.storeFulfillment.findNearestPickupLocations(lat, lng, rad);
    respond(req, res, locations as unknown as unknown, 200);
    return;
  }

  const locations = await ports.storeFulfillment.getAllPickupLocations();
  respond(req, res, locations as unknown as unknown, 200);
};

/**
 * Set pickup location for checkout (BOPIS flow)
 * PUT /checkout/:checkoutId/pickup-location
 */
export const setPickupLocation = async (
  req: HttpRequest<Record<string, string>, unknown, PickupLocationBody>,
  res: HttpResponse,
): Promise<void> => {
  const { checkoutId } = req.params;
  const { pickupLocationId } = req.body;

  if (!pickupLocationId) {
    respondError(req, res, 'Pickup location ID is required', 400);
    return;
  }

  const { session, inventoryWarnings } = await setPickupLocationUseCase.execute(checkoutId, pickupLocationId);

  const responseData = session as unknown as Record<string, unknown>;
  if (inventoryWarnings.length > 0) {
    responseData.inventoryWarnings = inventoryWarnings;
  }
  respond(req, res, responseData as unknown, 200);
};

/**
 * Get local delivery options for a checkout session
 * GET /checkout/:checkoutId/local-delivery-options
 */
export const getLocalDeliveryOptions = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { checkoutId } = req.params;

  const session = await manageCheckoutSessionUseCase.findById(checkoutId);
  if (!session) {
    respondError(req, res, 'Checkout session not found', 404);
    return;
  }

  const address = session.shippingAddress
    ? {
        latitude: undefined as number | undefined,
        longitude: undefined as number | undefined,
        postalCode: session.shippingAddress.postalCode,
        city: session.shippingAddress.city,
        country: session.shippingAddress.country,
      }
    : undefined;

  if (!address) {
    respondError(req, res, 'Shipping address must be set first', 400);
    return;
  }

  const ports = getCheckoutPorts();
  const result = await ports.storeFulfillment.checkLocalDeliveryEligibility(address);

  respond(req, res, result as unknown as unknown, 200);
};

/** Inspect the basket to detect digital vs physical items (best-effort). */
async function detectItemTypes(
  ports: CheckoutPorts,
  basketId: string,
): Promise<{ hasDigitalItems: boolean; hasPhysicalItems: boolean }> {
  try {
    const basket = await ports.basketSnapshot.getSnapshot(basketId);
    if (!basket) return { hasDigitalItems: false, hasPhysicalItems: false };
    return {
      hasDigitalItems: basket.items.some(item => item.isDigital),
      hasPhysicalItems: basket.items.some(item => item.itemType === 'physical'),
    };
  } catch {
    // Best-effort
    return { hasDigitalItems: false, hasPhysicalItems: false };
  }
}

function fulfillmentTypesFor(itemTypes: { hasDigitalItems: boolean; hasPhysicalItems: boolean }): string[] {
  if (itemTypes.hasPhysicalItems) return ['shipping', 'pickup', 'local_delivery'];
  if (itemTypes.hasDigitalItems) return ['digital'];
  return ['shipping', 'pickup'];
}

async function fetchShippingMethods(ports: CheckoutPorts, session: CheckoutSession): Promise<unknown[]> {
  if (!session.shippingAddress) return [];
  try {
    const shippingOptions = await ports.shippingQuote.getShippingOptions({
      basketId: session.basketId,
      shippingAddress: {
        country: session.shippingAddress.country,
        region: session.shippingAddress.region,
        city: session.shippingAddress.city,
        postalCode: session.shippingAddress.postalCode,
      },
      totalValueCents: session.subtotal.cents,
    });
    return shippingOptions.map(rate => ({
      id: rate.methodId,
      name: rate.methodName,
      priceCents: rate.amountCents,
      currency: rate.currency,
      estimatedDeliveryDays: rate.estimatedDays,
    }));
  } catch {
    // Best-effort
    return [];
  }
}

async function fetchPickupLocations(ports: CheckoutPorts): Promise<unknown[]> {
  try {
    return await ports.storeFulfillment.getAllPickupLocations();
  } catch {
    // Best-effort
    return [];
  }
}

async function fetchLocalDeliveryOptions(ports: CheckoutPorts, session: CheckoutSession): Promise<unknown[]> {
  if (!session.shippingAddress) return [];
  try {
    const deliveryResult = await ports.storeFulfillment.checkLocalDeliveryEligibility({
      postalCode: session.shippingAddress.postalCode,
      city: session.shippingAddress.city,
      country: session.shippingAddress.country,
    });
    return deliveryResult.options;
  } catch {
    // Best-effort
    return [];
  }
}

/**
 * Get all available fulfillment options for a checkout session
 * GET /checkout/:checkoutId/fulfillment-options
 */
export const getFulfillmentOptions = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { checkoutId } = req.params;

  const session = await manageCheckoutSessionUseCase.findById(checkoutId);
  if (!session) {
    respondError(req, res, 'Checkout session not found', 404);
    return;
  }

  const ports = getCheckoutPorts();
  const types = fulfillmentTypesFor(await detectItemTypes(ports, session.basketId));

  const options = {
    fulfillmentTypes: types,
    shippingMethods: types.includes('shipping') || types.includes('local_delivery') ? await fetchShippingMethods(ports, session) : [],
    pickupLocations: await fetchPickupLocations(ports),
    localDeliveryOptions: types.includes('local_delivery') ? await fetchLocalDeliveryOptions(ports, session) : [],
  };

  respond(req, res, options as unknown as unknown, 200);
};

/**
 * Get available pickup time slots
 * GET /checkout/:checkoutId/pickup-slots
 */
export const getPickupSlots = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { checkoutId } = req.params;
  const daysAhead = req.query.days ? parseInt(String(req.query.days), 10) : 7;

  const session = await manageCheckoutSessionUseCase.findById(checkoutId);
  if (!session) {
    respondError(req, res, 'Checkout session not found', 404);
    return;
  }

  const meta = session.metadata || {};
  const pickupLocationId = meta.pickupLocationId as string | undefined;
  if (!pickupLocationId) {
    respondError(req, res, 'Pickup location not set', 400);
    return;
  }

  const ports = getCheckoutPorts();
  const location = await ports.storeFulfillment.getPickupLocation(pickupLocationId);
  if (!location) {
    respondError(req, res, 'Pickup location not found', 404);
    return;
  }

  const useCase = getPickupSlotsUseCase;
  const slots = useCase.execute(
    {
      maxOrdersPerSlot: location.maxOrdersPerSlot ?? 10,
      prepareTimeMinutes: location.prepareTimeMinutes ?? 60,
      operatingHours: location.operatingHours ?? {},
    },
    daysAhead,
  );

  respond(req, res, slots as unknown as unknown, 200);
};
