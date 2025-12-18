/**
 * Customer Domain Events
 */

export interface DomainEvent {
  eventType: string;
  occurredAt: Date;
  aggregateId: string;
  payload: Record<string, any>;
}

export class CustomerRegisteredEvent implements DomainEvent {
  readonly eventType = 'customer.registered';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: { customerId: string; email: string; firstName: string; lastName: string };

  constructor(customerId: string, email: string, firstName: string, lastName: string) {
    this.occurredAt = new Date();
    this.aggregateId = customerId;
    this.payload = { customerId, email, firstName, lastName };
  }
}

export class CustomerUpdatedEvent implements DomainEvent {
  readonly eventType = 'customer.updated';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: { customerId: string; updatedFields: string[] };

  constructor(customerId: string, updatedFields: string[]) {
    this.occurredAt = new Date();
    this.aggregateId = customerId;
    this.payload = { customerId, updatedFields };
  }
}

export class CustomerVerifiedEvent implements DomainEvent {
  readonly eventType = 'customer.verified';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: { customerId: string; email: string };

  constructor(customerId: string, email: string) {
    this.occurredAt = new Date();
    this.aggregateId = customerId;
    this.payload = { customerId, email };
  }
}

export class CustomerDeactivatedEvent implements DomainEvent {
  readonly eventType = 'customer.deactivated';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: { customerId: string; reason?: string };

  constructor(customerId: string, reason?: string) {
    this.occurredAt = new Date();
    this.aggregateId = customerId;
    this.payload = { customerId, reason };
  }
}

export class CustomerAddressAddedEvent implements DomainEvent {
  readonly eventType = 'customer.address_added';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: { customerId: string; addressId: string; addressType: string };

  constructor(customerId: string, addressId: string, addressType: string) {
    this.occurredAt = new Date();
    this.aggregateId = customerId;
    this.payload = { customerId, addressId, addressType };
  }
}

export class CustomerDeletedEvent implements DomainEvent {
  readonly eventType = 'customer.deleted';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: { customerId: string; email: string };

  constructor(customerId: string, email: string) {
    this.occurredAt = new Date();
    this.aggregateId = customerId;
    this.payload = { customerId, email };
  }
}

export class CustomerLoggedInEvent implements DomainEvent {
  readonly eventType = 'customer.logged_in';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: { customerId: string; email: string; ipAddress?: string; userAgent?: string };

  constructor(customerId: string, email: string, ipAddress?: string, userAgent?: string) {
    this.occurredAt = new Date();
    this.aggregateId = customerId;
    this.payload = { customerId, email, ipAddress, userAgent };
  }
}

export class CustomerPasswordChangedEvent implements DomainEvent {
  readonly eventType = 'customer.password_changed';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: { customerId: string };

  constructor(customerId: string) {
    this.occurredAt = new Date();
    this.aggregateId = customerId;
    this.payload = { customerId };
  }
}

export class CustomerPasswordResetRequestedEvent implements DomainEvent {
  readonly eventType = 'customer.password_reset_requested';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: { customerId: string; email: string };

  constructor(customerId: string, email: string) {
    this.occurredAt = new Date();
    this.aggregateId = customerId;
    this.payload = { customerId, email };
  }
}

export class CustomerAddedToGroupEvent implements DomainEvent {
  readonly eventType = 'customer.added_to_group';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: { customerId: string; groupId: string; groupName: string };

  constructor(customerId: string, groupId: string, groupName: string) {
    this.occurredAt = new Date();
    this.aggregateId = customerId;
    this.payload = { customerId, groupId, groupName };
  }
}

export class CustomerRemovedFromGroupEvent implements DomainEvent {
  readonly eventType = 'customer.removed_from_group';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: { customerId: string; groupId: string; groupName: string };

  constructor(customerId: string, groupId: string, groupName: string) {
    this.occurredAt = new Date();
    this.aggregateId = customerId;
    this.payload = { customerId, groupId, groupName };
  }
}

export class CustomerReactivatedEvent implements DomainEvent {
  readonly eventType = 'customer.reactivated';
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: { customerId: string };

  constructor(customerId: string) {
    this.occurredAt = new Date();
    this.aggregateId = customerId;
    this.payload = { customerId };
  }
}
