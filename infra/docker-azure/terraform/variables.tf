# Azure Configuration
variable "subscription_id" {
  description = "Azure Subscription ID"
  type        = string
}

variable "location" {
  description = "Azure Region"
  type        = string
  default     = "East US 2"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod"
  }
}

# Application Configuration
variable "app_name" {
  description = "Application name"
  type        = string
  default     = "commercefull"
}

variable "domain" {
  description = "Domain name for the application"
  type        = string
}

variable "container_image" {
  description = "Container image URL"
  type        = string
  default     = ""
}

variable "container_cpu" {
  description = "Container CPU cores"
  type        = number
  default     = 0.5
}

variable "container_memory" {
  description = "Container memory"
  type        = string
  default     = "1Gi"
}

# Database Configuration
variable "db_sku" {
  description = "Database SKU"
  type        = string
  default     = "GP_Standard_D2s_v3"
}

variable "db_storage_mb" {
  description = "Database storage in MB"
  type        = number
  default     = 32768
}

variable "db_backup_retention_days" {
  description = "Database backup retention in days"
  type        = number
  default     = 7
}

# Storage Configuration
variable "storage_account_tier" {
  description = "Storage account tier"
  type        = string
  default     = "Standard"
}

variable "storage_replication_type" {
  description = "Storage replication type"
  type        = string
  default     = "LRS"
}

# Networking Configuration
variable "create_dns_zone" {
  description = "Create DNS zone in Azure"
  type        = bool
  default     = false
}

variable "enable_frontdoor" {
  description = "Enable Azure Front Door CDN"
  type        = bool
  default     = true
}

# Monitoring Configuration
variable "log_retention_days" {
  description = "Log retention in days"
  type        = number
  default     = 30
}

variable "enable_monitoring" {
  description = "Enable Azure Monitor"
  type        = bool
  default     = true
}

# Security Configuration
variable "enable_key_vault" {
  description = "Enable Azure Key Vault"
  type        = bool
  default     = true
}

variable "key_vault_sku" {
  description = "Key Vault SKU"
  type        = string
  default     = "standard"
}

# Scaling Configuration
variable "min_replicas" {
  description = "Minimum container replicas"
  type        = number
  default     = 1
}

variable "max_replicas" {
  description = "Maximum container replicas"
  type        = number
  default     = 10
}

# Tags
variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
