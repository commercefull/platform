import customerDataRepository from '../../infrastructure/repositories/CustomerDataRepository';

const customerRepo = customerDataRepository.customers;
import { GetCustomerUseCase } from './GetCustomer';
import { UpdateCustomerUseCase } from './UpdateCustomer';
import { DeactivateCustomerUseCase } from './DeactivateCustomer';
import { ReactivateCustomerUseCase } from './ReactivateCustomer';
import { VerifyCustomerUseCase } from './VerifyCustomer';
import { ManageAddressesUseCase } from './ManageAddresses';
import { AuthenticateCustomerUseCase } from './AuthenticateCustomer';
import { RegisterCustomerUseCase } from './RegisterCustomer';
import { ChangePasswordUseCase } from './ChangePassword';
import { ManageCustomersUseCase } from './ManageCustomers';
import { ManageCustomerAddressesUseCase } from './ManageCustomerAddresses';
import { ManageWishlistUseCase } from './ManageWishlist';
import { ManageStorefrontAddressesUseCase } from './ManageStorefrontAddresses';
import { ManageStorefrontWishlistUseCase } from './ManageStorefrontWishlist';

export const manageCustomersUseCase = new ManageCustomersUseCase(customerDataRepository.customers);
export const manageCustomerAddressesUseCase = new ManageCustomerAddressesUseCase(customerDataRepository.addresses);
export const manageWishlistUseCase = new ManageWishlistUseCase(customerDataRepository.wishlist);
export const manageStorefrontAddressesUseCase = new ManageStorefrontAddressesUseCase(customerDataRepository.addresses);
export const manageStorefrontWishlistUseCase = new ManageStorefrontWishlistUseCase(customerDataRepository.wishlist);

export const getCustomerUseCase = new GetCustomerUseCase(customerRepo);
export const updateCustomerUseCase = new UpdateCustomerUseCase(customerRepo);
export const deactivateCustomerUseCase = new DeactivateCustomerUseCase(customerRepo);
export const reactivateCustomerUseCase = new ReactivateCustomerUseCase(customerRepo);
export const verifyCustomerUseCase = new VerifyCustomerUseCase(customerRepo);
export const manageAddressesUseCase = new ManageAddressesUseCase(customerRepo);
export const authenticateCustomerUseCase = new AuthenticateCustomerUseCase(customerRepo);
export const registerCustomerUseCase = new RegisterCustomerUseCase(customerRepo);
export const changePasswordUseCase = new ChangePasswordUseCase(customerRepo);
