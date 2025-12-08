import { BaseEntity } from "~/orm/base-repository.orm";

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  LOCKED = 'locked'
}

export interface IUser extends BaseEntity {
  id: number;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role_id: number;
  status: UserStatus;
  email_verified: boolean;
  email_verified_at?: string;
  last_login_at?: string;
  failed_login_attempts: number;
  locked_until?: string;
  password_changed_at: Date | undefined | string;
  must_change_password: boolean;
  two_factor_enabled: boolean;
  two_factor_secret?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  created_by?: number;
  updated_by?: number;
  deleted_by?: number;
}

export interface Role extends BaseEntity {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
}



export interface Permission extends BaseEntity {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  resource: string;
  action: string;
  created_at: string;
  updated_at: string;
}

export interface RolePermission {
  id: number;
  role_id: number;
  permission_id: number;
  created_at: string;
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
  user_count: number;
}

export interface RefreshToken extends BaseEntity {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: string;
  revoked: boolean;
  revoked_at?: string;
  replaced_by_token?: string;
  device_info?: string;
  ip_address: string;
  created_at: string;
}

export interface PasswordHistory extends BaseEntity {
  id: number;
  user_id: number;
  password_hash: string;
  created_at: string;
}

export interface LoginAttempt extends BaseEntity {
  id: number;
  user_id?: number;
  email: string;
  ip_address: string;
  user_agent: string;
  success: boolean;
  failure_reason?: string;
  created_at: Date;
}


export interface CreateUserDto {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role_id: number;
}

export interface UpdateUserDto {
  first_name?: string;
  last_name?: string;
  phone?: string;
  role_id?: number;
  status?: UserStatus;
}

export interface ChangePasswordDto {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface UserResponse {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: {
    id: number;
    name: string;
    display_name: string;
  };
  permissions: string[];
  status: UserStatus;
  email_verified: boolean;
  two_factor_enabled: boolean;
  last_login_at?: string;
  created_at: string;
}

export interface AuthResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RequestContext {
  userId: number;
  email: string;
  roleId: number;
  permissions: string[];
  ip: string;
  userAgent: string;
}
