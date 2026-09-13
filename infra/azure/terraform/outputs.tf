output "subscription_id" {
  description = "Azure Subscription ID"
  value       = var.subscription_id
}

output "location" {
  description = "Azure Region"
  value       = var.location
}

output "environment" {
  description = "Deployment environment"
  value       = var.environment
}

output "resource_group_name" {
  description = "Resource group name"
  value       = azurerm_resource_group.rg.name
}

output "container_app_url" {
  description = "Container App URL"
  value       = "https://${azurerm_container_app.app.ingress[0].fqdn}"
}

output "frontdoor_url" {
  description = "Front Door URL"
  value       = var.enable_frontdoor ? "https://${azurerm_cdn_frontdoor_endpoint.endpoint.host_name}" : null
}

output "database_server_name" {
  description = "PostgreSQL server name"
  value       = azurerm_postgresql_flexible_server.db.name
}

output "database_connection_string" {
  description = "Database connection string"
  value       = "postgresql://${var.app_name}:${random_password.db_password.result}@${azurerm_postgresql_flexible_server.db.fqdn}/${var.app_name}"
  sensitive   = true
}

output "storage_account_name" {
  description = "Storage account name"
  value       = azurerm_storage_account.storage.name
}

output "storage_account_key" {
  description = "Storage account key"
  value       = azurerm_storage_account.storage.primary_access_key
  sensitive   = true
}

output "key_vault_name" {
  description = "Key Vault name"
  value       = var.enable_key_vault ? azurerm_key_vault.kv.name : null
}

output "user_assigned_identity_id" {
  description = "User assigned identity ID"
  value       = azurerm_user_assigned_identity.app.id
}

output "log_analytics_workspace_id" {
  description = "Log Analytics workspace ID"
  value       = azurerm_log_analytics_workspace.workspace.id
}

output "application_insights_key" {
  description = "Application Insights instrumentation key"
  value       = azurerm_application_insights.appinsights.instrumentation_key
  sensitive   = true
}

output "domain" {
  description = "Configured domain"
  value       = var.domain
}
