terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }

  backend "gcs" {
    bucket = "commercefull-terraform-state"
    prefix = "terraform/state"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "commercefull"
}

variable "domain" {
  description = "Domain name"
  type        = string
}

variable "db_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "POSTGRES_18"
}

variable "db_tier" {
  description = "Database tier"
  type        = string
  default     = "db-f1-micro"
}

variable "container_image" {
  description = "Container image URL"
  type        = string
  default     = "gcr.io/${var.project_id}/commercefull:latest"
}

# Enable required APIs
resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "sqladmin.googleapis.com",
    "secretmanager.googleapis.com",
    "storage-api.googleapis.com",
    "cloudbuild.googleapis.com",
    "vpcaccess.googleapis.com",
    "servicenetworking.googleapis.com"
  ])

  service = each.value

  disable_dependent_services = false
}

# VPC Network
resource "google_compute_network" "vpc" {
  name                    = "${var.app_name}-vpc-${var.environment}"
  auto_create_subnetworks = false
}

# Subnets
resource "google_compute_subnetwork" "subnet" {
  name          = "${var.app_name}-subnet-${var.environment}"
  ip_cidr_range = "10.0.0.0/24"
  region        = var.region
  network       = google_compute_network.vpc.id
}

# Cloud SQL PostgreSQL
resource "google_sql_database_instance" "postgres" {
  name             = "${var.app_name}-db-${var.environment}"
  database_version = var.db_version
  region           = var.region

  settings {
    tier = var.db_tier

    backup_configuration {
      enabled  = true
      start_time = "02:00"
    }

    ip_configuration {
      ipv4_enabled = false
      private_network = google_compute_network.vpc.id
    }
  }

  deletion_protection = var.environment == "prod"
}

# Cloud SQL Database
resource "google_sql_database" "database" {
  name     = var.app_name
  instance = google_sql_database_instance.postgres.name
}

# Cloud SQL User
resource "google_sql_user" "user" {
  name     = var.app_name
  instance = google_sql_database_instance.postgres.name
  password = random_password.db_password.result
}

# Random password for database
resource "random_password" "db_password" {
  length  = 16
  special = true
}

# Cloud Storage bucket
resource "google_storage_bucket" "media" {
  name     = "${var.project_id}-${var.app_name}-media-${var.environment}"
  location = var.region

  uniform_bucket_level_access = true

  cors {
    origin          = ["https://${var.domain}"]
    method          = ["GET", "POST", "PUT"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
}

# Service Account for Cloud Run
resource "google_service_account" "cloud_run" {
  account_id   = "${var.app_name}-sa-${var.environment}"
  display_name = "CommerceFull Cloud Run Service Account"
}

# IAM roles for service account
resource "google_project_iam_member" "cloud_run_roles" {
  for_each = toset([
    "roles/cloudsql.client",
    "roles/secretmanager.secretAccessor",
    "roles/storage.objectViewer"
  ])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

# Secrets in Secret Manager
resource "google_secret_manager_secret" "database_url" {
  secret_id = "DATABASE_URL"

  replication {
    user_managed {
      replicas {
        location = var.region
      }
    }
  }
}

resource "google_secret_manager_secret_version" "database_url" {
  secret      = google_secret_manager_secret.database_url.id
  secret_data = "postgresql://${google_sql_user.user.name}:${random_password.db_password.result}@${google_sql_database_instance.postgres.private_ip_address}/${google_sql_database.database.name}"
}

resource "google_secret_manager_secret" "session_secret" {
  secret_id = "SESSION_SECRET"

  replication {
    user_managed {
      replicas {
        location = var.region
      }
    }
  }
}

resource "google_secret_manager_secret_version" "session_secret" {
  secret      = google_secret_manager_secret.session_secret.id
  secret_data = random_password.session_secret.result
}

# Random session secret
resource "random_password" "session_secret" {
  length  = 32
  special = true
}

# Cloud Run service
resource "google_cloud_run_service" "app" {
  name     = "${var.app_name}-app-${var.environment}"
  location = var.region

  template {
    spec {
      service_account_name = google_service_account.cloud_run.email

      containers {
        image = var.container_image

        ports {
          container_port = 3000
        }

        env {
          name  = "NODE_ENV"
          value = "production"
        }

        env {
          name  = "DOMAIN"
          value = "https://${var.domain}"
        }

        env {
          name  = "STORAGE_BUCKET"
          value = google_storage_bucket.media.name
        }

        env {
          name  = "GCS_PROJECT_ID"
          value = var.project_id
        }
      }
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale" = "10"
        "autoscaling.knative.dev/minScale" = "0"
        "run.googleapis.com/cloudsql-instances" = google_sql_database_instance.postgres.connection_name
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

# Allow public access to Cloud Run
resource "google_cloud_run_service_iam_member" "public" {
  service  = google_cloud_run_service.app.name
  location = google_cloud_run_service.app.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Load Balancer for custom domain
resource "google_compute_global_address" "lb_ip" {
  name = "${var.app_name}-lb-ip-${var.environment}"
}

resource "google_compute_backend_service" "backend" {
  name                  = "${var.app_name}-backend-${var.environment}"
  protocol              = "HTTP"
  timeout_sec           = 30
  load_balancing_scheme = "EXTERNAL"

  backend {
    group = google_cloud_run_service.app.id
  }
}

resource "google_compute_url_map" "url_map" {
  name            = "${var.app_name}-url-map-${var.environment}"
  default_service = google_compute_backend_service.backend.id
}

resource "google_compute_target_http_proxy" "http_proxy" {
  name    = "${var.app_name}-http-proxy-${var.environment}"
  url_map = google_compute_url_map.url_map.id
}

resource "google_compute_global_forwarding_rule" "http_forwarding" {
  name                  = "${var.app_name}-http-forwarding-${var.environment}"
  target                = google_compute_target_http_proxy.http_proxy.id
  port_range            = "80"
  ip_address            = google_compute_global_address.lb_ip.address
  load_balancing_scheme = "EXTERNAL"
}

# SSL Certificate
resource "google_compute_managed_ssl_certificate" "ssl_cert" {
  name = "${var.app_name}-ssl-cert-${var.environment}"

  managed {
    domains = [var.domain, "www.${var.domain}"]
  }
}

resource "google_compute_target_https_proxy" "https_proxy" {
  name             = "${var.app_name}-https-proxy-${var.environment}"
  url_map          = google_compute_url_map.url_map.id
  ssl_certificates = [google_compute_managed_ssl_certificate.ssl_cert.id]
}

resource "google_compute_global_forwarding_rule" "https_forwarding" {
  name                  = "${var.app_name}-https-forwarding-${var.environment}"
  target                = google_compute_target_https_proxy.https_proxy.id
  port_range            = "443"
  ip_address            = google_compute_global_address.lb_ip.address
  load_balancing_scheme = "EXTERNAL"
}

# Outputs
output "cloud_run_url" {
  description = "Cloud Run service URL"
  value       = google_cloud_run_service.app.status[0].url
}

output "load_balancer_ip" {
  description = "Load Balancer IP address"
  value       = google_compute_global_address.lb_ip.address
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
