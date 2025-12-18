output "project_id" {
  description = "GCP Project ID"
  value       = var.project_id
}

output "region" {
  description = "GCP Region"
  value       = var.region
}

output "environment" {
  description = "Deployment environment"
  value       = var.environment
}

output "cloud_run_service_url" {
  description = "Cloud Run service URL"
  value       = google_cloud_run_service.app.status[0].url
}

output "load_balancer_ip" {
  description = "Global load balancer IP address"
  value       = google_compute_global_address.lb_ip.address
}

output "database_instance_name" {
  description = "Cloud SQL instance name"
  value       = google_sql_database_instance.postgres.name
}

output "database_connection_name" {
  description = "Cloud SQL connection name"
  value       = google_sql_database_instance.postgres.connection_name
}

output "storage_bucket_name" {
  description = "Cloud Storage bucket name"
  value       = google_storage_bucket.media.name
}

output "service_account_email" {
  description = "Service account email"
  value       = google_service_account.cloud_run.email
}

output "ssl_certificate_name" {
  description = "SSL certificate name"
  value       = google_compute_managed_ssl_certificate.ssl_cert.name
}

output "domain" {
  description = "Configured domain"
  value       = var.domain
}
