export type StoreRole = 'cashier' | 'manager' | 'admin';

export interface UserStoreAssignmentProps {
  userStoreId: string;
  userId: string;
  storeId: string;
  role: StoreRole;
  isPrimary: boolean;
  isActive: boolean;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class UserStoreAssignment {
  private props: UserStoreAssignmentProps;

  private constructor(props: UserStoreAssignmentProps) {
    this.props = props;
  }

  static create(props: {
    userStoreId: string;
    userId: string;
    storeId: string;
    role: StoreRole;
    isPrimary?: boolean;
    isActive?: boolean;
    permissions?: string[];
  }): UserStoreAssignment {
    const now = new Date();

    return new UserStoreAssignment({
      userStoreId: props.userStoreId,
      userId: props.userId,
      storeId: props.storeId,
      role: props.role,
      isPrimary: props.isPrimary ?? false,
      isActive: props.isActive ?? true,
      permissions: props.permissions ?? [],
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: UserStoreAssignmentProps): UserStoreAssignment {
    return new UserStoreAssignment(props);
  }

  get userStoreId(): string {
    return this.props.userStoreId;
  }

  get userId(): string {
    return this.props.userId;
  }

  get storeId(): string {
    return this.props.storeId;
  }

  get role(): StoreRole {
    return this.props.role;
  }

  get isPrimary(): boolean {
    return this.props.isPrimary;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get permissions(): string[] {
    return [...this.props.permissions];
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  activate(): void {
    this.props.isActive = true;
    this.touch();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.touch();
  }

  markPrimary(): void {
    this.props.isPrimary = true;
    this.touch();
  }

  unmarkPrimary(): void {
    this.props.isPrimary = false;
    this.touch();
  }

  changeRole(role: StoreRole): void {
    this.props.role = role;
    this.touch();
  }

  updatePermissions(permissions: string[]): void {
    this.props.permissions = [...permissions];
    this.touch();
  }

  toJSON(): UserStoreAssignmentProps {
    return {
      ...this.props,
      permissions: [...this.props.permissions],
    };
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }
}
