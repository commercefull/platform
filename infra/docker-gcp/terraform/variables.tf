# Project Configuration
variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region for resources"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "GCP Zone for resources"
  type        = string
  default     = "us-central1-a"
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

variable "container_port" {
  description = "Container port"
  type        = number
  default     = 3000
}

# Database Configuration
variable "db_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "POSTGRES_18"
}

variable "db_tier" {
  description = "Database instance tier"
  type        = string
  default     = "db-f1-micro"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "commercefull"
}

variable "db_user" {
  description = "Database username"
  type        = string
  default     = "commercefull"
}

# Storage Configuration
variable "storage_class" {
  description = "Cloud Storage class"
  type        = string
  default     = "STANDARD"
}

variable "storage_location" {
  description = "Cloud Storage location"
  type        = string
  default     = ""
}

# Networking Configuration
variable "vpc_name" {
  description = "VPC network name"
  type        = string
  default     = ""
}

variable "subnet_cidr" {
  description = "Subnet CIDR range"
  type        = string
  default     = "10.0.0.0/24"
}

# Security Configuration
variable "enable_ssl" {
  description = "Enable SSL certificate"
  type        = bool
  default     = true
}

variable "enable_cdn" {
  description = "Enable Cloud CDN"
  type        = bool
  default     = true
}

# Monitoring Configuration
variable "enable_monitoring" {
  description = "Enable Cloud Monitoring"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "Log retention in days"
  type        = number
  default     = 30
}

# Cost Optimization
variable "enable_deletion_protection" {
  description = "Enable deletion protection for critical resources"
  type        = bool
  default     = true
}

# Tags
variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
