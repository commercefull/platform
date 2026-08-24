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

export const getCustomerUseCase = new GetCustomerUseCase(customerRepo);
export const updateCustomerUseCase = new UpdateCustomerUseCase(customerRepo);
export const deactivateCustomerUseCase = new DeactivateCustomerUseCase(customerRepo);
export const reactivateCustomerUseCase = new ReactivateCustomerUseCase(customerRepo);
export const verifyCustomerUseCase = new VerifyCustomerUseCase(customerRepo);
export const manageAddressesUseCase = new ManageAddressesUseCase(customerRepo);
export const authenticateCustomerUseCase = new AuthenticateCustomerUseCase(customerRepo);
export const registerCustomerUseCase = new RegisterCustomerUseCase(customerRepo);
export const changePasswordUseCase = new ChangePasswordUseCase(customerRepo);
