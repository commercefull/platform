terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }

  backend "azurerm" {
    resource_group_name  = "commercefull-tfstate"
    storage_account_name = "commercefulltfstate"
    container_name       = "tfstate"
    key                  = "terraform.tfstate"
  }
}

provider "azurerm" {
  features {}
}

# Resource Group
resource "azurerm_resource_group" "rg" {
  name     = "${var.app_name}-rg-${var.environment}"
  location = var.location

  tags = {
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
  }
}

# Container App Environment
resource "azurerm_container_app_environment" "env" {
  name                       = "${var.app_name}-env-${var.environment}"
  location                   = azurerm_resource_group.rg.location
  resource_group_name        = azurerm_resource_group.rg.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.workspace.id
}

# PostgreSQL Flexible Server
resource "azurerm_postgresql_flexible_server" "db" {
  name                  = "${var.app_name}-db-${var.environment}"
  location              = azurerm_resource_group.rg.location
  resource_group_name   = azurerm_resource_group.rg.name
  version               = "16"
  sku_name              = var.db_sku
  storage_mb            = var.db_storage_mb
  backup_retention_days = var.db_backup_retention_days

  administrator_login    = var.app_name
  administrator_password = random_password.db_password.result

  zone = "1"

  tags = {
    Environment = var.environment
    Purpose     = "database"
  }
}

# PostgreSQL Database
resource "azurerm_postgresql_flexible_server_database" "db" {
  name      = var.app_name
  server_id = azurerm_postgresql_flexible_server.db.id
  collation = "en_US.utf8"
  charset   = "utf8"
}

# Random password for database
resource "random_password" "db_password" {
  length  = 16
  special = true
}

# Storage Account
resource "azurerm_storage_account" "storage" {
  name                     = "commercefullstorage${random_string.storage_suffix.result}"
  location                 = azurerm_resource_group.rg.location
  resource_group_name      = azurerm_resource_group.rg.name
  account_tier             = var.storage_account_tier
  account_replication_type = var.storage_replication_type
  account_kind             = "StorageV2"

  tags = {
    Environment = var.environment
    Purpose     = "media-storage"
  }
}

# Storage Container
resource "azurerm_storage_container" "media" {
  name                  = "media"
  storage_account_name  = azurerm_storage_account.storage.name
  container_access_type = "blob"
}

# Log Analytics Workspace
resource "azurerm_log_analytics_workspace" "workspace" {
  name                = "${var.app_name}-logs-${var.environment}"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  sku                 = "PerGB2018"
  retention_in_days   = var.log_retention_days

  tags = {
    Environment = var.environment
    Purpose     = "monitoring"
  }
}

# Application Insights
resource "azurerm_application_insights" "appinsights" {
  name                = "${var.app_name}-appinsights-${var.environment}"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  application_type    = "web"

  tags = {
    Environment = var.environment
    Purpose     = "monitoring"
  }
}

# Key Vault
resource "azurerm_key_vault" "kv" {
  name                        = "${var.app_name}-kv-${var.environment}"
  location                    = azurerm_resource_group.rg.location
  resource_group_name         = azurerm_resource_group.rg.name
  enabled_for_disk_encryption = true
  tenant_id                   = data.azurerm_client_config.current.tenant_id
  soft_delete_retention_days  = 7
  purge_protection_enabled    = false

  sku_name = "standard"

  tags = {
    Environment = var.environment
    Purpose     = "secrets"
  }
}

# Key Vault Access Policy
resource "azurerm_key_vault_access_policy" "kv_policy" {
  key_vault_id = azurerm_key_vault.kv.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = azurerm_user_assigned_identity.app.principal_id

  secret_permissions = [
    "Get",
    "List"
  ]
}

# User Assigned Identity
resource "azurerm_user_assigned_identity" "app" {
  name                = "${var.app_name}-identity-${var.environment}"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name

  tags = {
    Environment = var.environment
    Purpose     = "identity"
  }
}

# Database URL Secret
resource "azurerm_key_vault_secret" "database_url" {
  name         = "DATABASE-URL"
  value        = "postgresql://${var.app_name}:${random_password.db_password.result}@${azurerm_postgresql_flexible_server.db.fqdn}/${var.app_name}"
  key_vault_id = azurerm_key_vault.kv.id
}

# Session Secret
resource "azurerm_key_vault_secret" "session_secret" {
  name         = "SESSION-SECRET"
  value        = random_password.session_secret.result
  key_vault_id = azurerm_key_vault.kv.id
}

# Random session secret
resource "random_password" "session_secret" {
  length  = 32
  special = true
}

# Random string for storage account
resource "random_string" "storage_suffix" {
  length  = 8
  special = false
  upper   = false
}

# Container App
resource "azurerm_container_app" "app" {
  name                         = "${var.app_name}-app-${var.environment}"
  resource_group_name          = azurerm_resource_group.rg.name
  container_app_environment_id = azurerm_container_app_environment.env.id
  revision_mode                = "Single"

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.app.id]
  }

  template {
    min_replicas = var.min_replicas
    max_replicas = var.max_replicas

    container {
      name   = var.app_name
      image  = var.container_image
      cpu    = var.container_cpu
      memory = var.container_memory

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "DOMAIN"
        value = "https://${var.domain}"
      }

      env {
        name  = "STORAGE_ACCOUNT"
        value = azurerm_storage_account.storage.name
      }

      env {
        name  = "POSTGRES_HOST"
        value = azurerm_postgresql_flexible_server.db.fqdn
      }

      env {
        name  = "POSTGRES_PORT"
        value = "5432"
      }

      env {
        name  = "POSTGRES_DB"
        value = azurerm_postgresql_flexible_server_database.db.name
      }

      env {
        name  = "POSTGRES_USER"
        value = var.app_name
      }

      env {
        name        = "DATABASE_URL"
        secret_name = "database-url"
      }

      env {
        name        = "SESSION_SECRET"
        secret_name = "session-secret"
      }

      env {
        name        = "POSTGRES_PASSWORD"
        secret_name = "database-password"
      }
    }
  }

  ingress {
    external_enabled = true
    target_port      = 3000
    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  secret {
    name  = "database-url"
    value = azurerm_key_vault_secret.database_url.value
  }

  secret {
    name  = "session-secret"
    value = azurerm_key_vault_secret.session_secret.value
  }

  secret {
    name  = "database-password"
    value = random_password.db_password.result
  }

  tags = {
    Environment = var.environment
    Purpose     = "application"
  }
}

# Azure Front Door (CDN)
resource "azurerm_cdn_frontdoor_profile" "frontdoor" {
  name                = "${var.app_name}-frontdoor-${var.environment}"
  resource_group_name = azurerm_resource_group.rg.name
  sku_name            = "Standard_AzureFrontDoor"

  tags = {
    Environment = var.environment
    Purpose     = "cdn"
  }
}

resource "azurerm_cdn_frontdoor_endpoint" "endpoint" {
  name                     = "${var.app_name}-endpoint-${var.environment}"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.frontdoor.id
}

resource "azurerm_cdn_frontdoor_origin_group" "origin_group" {
  name                     = "${var.app_name}-origin-group-${var.environment}"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.frontdoor.id

  load_balancing {
    sample_size                 = 4
    successful_samples_required = 3
  }

  health_probe {
    path                = "/health"
    protocol            = "Https"
    interval_in_seconds = 100
  }
}

resource "azurerm_cdn_frontdoor_origin" "origin" {
  name                           = "${var.app_name}-origin-${var.environment}"
  cdn_frontdoor_origin_group_id  = azurerm_cdn_frontdoor_origin_group.origin_group.id
  host_name                      = azurerm_container_app.app.ingress[0].fqdn
  http_port                      = 80
  https_port                     = 443
  origin_host_header             = azurerm_container_app.app.ingress[0].fqdn
  certificate_name_check_enabled = true
}

resource "azurerm_cdn_frontdoor_route" "route" {
  name                          = "${var.app_name}-route-${var.environment}"
  cdn_frontdoor_endpoint_id     = azurerm_cdn_frontdoor_endpoint.endpoint.id
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.origin_group.id
  cdn_frontdoor_origin_ids      = [azurerm_cdn_frontdoor_origin.origin.id]

  patterns_to_match   = ["/*"]
  supported_protocols = ["Https"]
  forwarding_protocol = "HttpsOnly"

  cdn_frontdoor_custom_domain_ids = [azurerm_cdn_frontdoor_custom_domain.custom_domain.id]
}

resource "azurerm_cdn_frontdoor_custom_domain" "custom_domain" {
  name                     = "${var.app_name}-domain-${var.environment}"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.frontdoor.id
  host_name                = var.domain

  tls {
    certificate_type = "ManagedCertificate"
  }
}

# DNS Zone (if using Azure DNS)
resource "azurerm_dns_zone" "zone" {
  count               = var.create_dns_zone ? 1 : 0
  name                = var.domain
  resource_group_name = azurerm_resource_group.rg.name

  tags = {
    Environment = var.environment
    Purpose     = "dns"
  }
}

# Data source for current client config
data "azurerm_client_config" "current" {}

