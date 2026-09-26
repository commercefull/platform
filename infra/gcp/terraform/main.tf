terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
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

# Enable required APIs
resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "sqladmin.googleapis.com",
    "secretmanager.googleapis.com",
    "storage-api.googleapis.com",
    "cloudbuild.googleapis.com",
    "compute.googleapis.com",
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

# Allocate a /24 range for Cloud SQL private services access.
# Required for google_sql_database_instance.private_ip_address to be populated.
resource "google_compute_global_address" "private_service_range" {
  name          = "${var.app_name}-sql-range-${var.environment}"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 24
  network       = google_compute_network.vpc.id
}

resource "google_service_networking_connection" "private_service_access" {
  network                 = google_compute_network.vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_service_range.name]
}

# Serverless VPC connector so Cloud Run can reach the private Cloud SQL IP.
resource "google_vpc_access_connector" "cloud_run" {
  name          = "${var.app_name}-vpc-conn-${var.environment}"
  region        = var.region
  network       = google_compute_network.vpc.name
  ip_cidr_range = "10.8.0.0/28"
}

# Cloud SQL PostgreSQL
resource "google_sql_database_instance" "postgres" {
  name             = "${var.app_name}-db-${var.environment}"
  database_version = var.db_version
  region           = var.region

  settings {
    tier = var.db_tier

    backup_configuration {
      enabled                        = true
      start_time                     = "02:00"
      point_in_time_recovery_enabled = true
    }

    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.vpc.id
      # SECURITY: reject unencrypted connections
      require_ssl = true
    }

    database_flags {
      name  = "log_connections"
      value = "on"
    }

    database_flags {
      name  = "log_disconnections"
      value = "on"
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

# Random password for database (URL-safe specials so DATABASE_URL parses correctly)
resource "random_password" "db_password" {
  length           = 32
  special          = true
  override_special = "-_"
}

# Cloud Storage bucket
resource "google_storage_bucket" "media" {
  name     = "${var.project_id}-${var.app_name}-media-${var.environment}"
  location = var.region

  uniform_bucket_level_access = true
  # SECURITY: the bucket can never be made public (serve media via signed URLs / CDN)
  public_access_prevention = "enforced"

  versioning {
    enabled = true
  }

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
  display_name = "Commercefull Cloud Run Service Account"
}

# IAM roles for service account.
# SECURITY: least privilege — project-wide secretAccessor / storage roles would let
# an RCE read every secret and bucket in the project (including Terraform state).
resource "google_project_iam_member" "cloud_run_roles" {
  for_each = toset([
    "roles/cloudsql.client",
  ])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

resource "google_storage_bucket_iam_member" "cloud_run_media" {
  bucket = google_storage_bucket.media.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.cloud_run.email}"
}

# Per-secret access for the runtime service account
locals {
  runtime_secrets = merge(
    {
      DATABASE_URL      = google_secret_manager_secret.database_url.secret_id
      SESSION_SECRET    = google_secret_manager_secret.session_secret.secret_id
      POSTGRES_PASSWORD = google_secret_manager_secret.db_password.secret_id
    },
    { for k, v in google_secret_manager_secret.app_secrets : k => v.secret_id },
  )
}

resource "google_secret_manager_secret_iam_member" "cloud_run" {
  for_each = local.runtime_secrets

  secret_id = each.value
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run.email}"
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
  length  = 64
  special = false
}

resource "google_secret_manager_secret" "db_password" {
  secret_id = "POSTGRES_PASSWORD_${upper(var.environment)}"

  replication {
    user_managed {
      replicas {
        location = var.region
      }
    }
  }
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = random_password.db_password.result
}

# SECURITY: independent secret per auth realm — a shared JWT secret would let a
# customer token authenticate against the organization/admin APIs.
resource "random_password" "app_secrets" {
  for_each = toset(["CUSTOMER_JWT_SECRET", "ORGANIZATION_JWT_SECRET", "ADMIN_JWT_SECRET", "B2B_JWT_SECRET", "COOKIE_SECRET"])

  length  = 64
  special = false
}

resource "google_secret_manager_secret" "app_secrets" {
  for_each  = random_password.app_secrets
  secret_id = "${each.key}_${upper(var.environment)}"

  replication {
    user_managed {
      replicas {
        location = var.region
      }
    }
  }
}

resource "google_secret_manager_secret_version" "app_secrets" {
  for_each    = random_password.app_secrets
  secret      = google_secret_manager_secret.app_secrets[each.key].id
  secret_data = each.value.result
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

        # Liveness probe — Cloud Run uses this to restart unhealthy containers
        liveness_probe {
          http_get {
            path = "/health"
            port = 3000
          }
          initial_delay_seconds = 30
          period_seconds        = 30
          timeout_seconds       = 5
          failure_threshold     = 3
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

        env {
          name  = "POSTGRES_HOST"
          value = google_sql_database_instance.postgres.private_ip_address
        }

        env {
          name  = "POSTGRES_PORT"
          value = "5432"
        }

        env {
          name  = "POSTGRES_DB"
          value = google_sql_database.database.name
        }

        env {
          name  = "POSTGRES_USER"
          value = google_sql_user.user.name
        }

        # Cloud SQL enforces TLS (require_ssl). Supply the instance CA via
        # POSTGRES_SSL_CA to also verify the server certificate.
        env {
          name  = "POSTGRES_SSL"
          value = "true"
        }

        env {
          name  = "POSTGRES_SSL_REJECT_UNAUTHORIZED"
          value = "false"
        }

        env {
          name  = "ALLOWED_ORIGINS"
          value = "https://${var.domain},https://www.${var.domain}"
        }

        env {
          name  = "COOKIE_DOMAIN"
          value = var.domain
        }

        # Google Cloud Load Balancer → Cloud Run front end → container
        env {
          name  = "TRUST_PROXY"
          value = "2"
        }

        # SECURITY: secrets come from Secret Manager, never plain env values
        # (plain values are readable by anyone with run.services.get)
        dynamic "env" {
          for_each = local.runtime_secrets
          content {
            name = env.key
            value_from {
              secret_key_ref {
                name = env.value
                key  = "latest"
              }
            }
          }
        }
      }
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale"        = "10"
        "autoscaling.knative.dev/minScale"        = "0"
        "run.googleapis.com/cloudsql-instances"   = google_sql_database_instance.postgres.connection_name
        "run.googleapis.com/vpc-access-connector" = google_vpc_access_connector.cloud_run.id
      }
    }
  }

  metadata {
    annotations = {
      # SECURITY: the *.run.app URL is not reachable from the internet — all traffic
      # must go through the load balancer (Cloud Armor, TLS policy, HTTPS redirect)
      "run.googleapis.com/ingress" = "internal-and-cloud-load-balancing"
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  autogenerate_revision_name = true

  depends_on = [
    google_secret_manager_secret_iam_member.cloud_run,
    google_secret_manager_secret_version.app_secrets,
    google_secret_manager_secret_version.db_password,
  ]
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

# Serverless NEG — the only valid way to put Cloud Run behind a global LB
resource "google_compute_region_network_endpoint_group" "cloud_run" {
  name                  = "${var.app_name}-neg-${var.environment}"
  network_endpoint_type = "SERVERLESS"
  region                = var.region

  cloud_run {
    service = google_cloud_run_service.app.name
  }
}

# SECURITY: Cloud Armor WAF — OWASP preconfigured rules + per-IP rate limiting
resource "google_compute_security_policy" "armor" {
  name = "${var.app_name}-armor-${var.environment}"

  rule {
    action   = "deny(403)"
    priority = 1000
    match {
      expr {
        expression = "evaluatePreconfiguredWaf('sqli-v33-stable', {'sensitivity': 1})"
      }
    }
    description = "SQL injection"
  }

  rule {
    action   = "deny(403)"
    priority = 1001
    match {
      expr {
        expression = "evaluatePreconfiguredWaf('lfi-v33-stable', {'sensitivity': 1}) || evaluatePreconfiguredWaf('rce-v33-stable', {'sensitivity': 1}) || evaluatePreconfiguredWaf('scannerdetection-v33-stable', {'sensitivity': 1})"
      }
    }
    description = "LFI / RCE / scanners"
  }

  rule {
    action   = "rate_based_ban"
    priority = 2000
    match {
      expr {
        expression = "request.path.matches('(?i)/(login|signin|signup|auth/|identity/)')"
      }
    }
    rate_limit_options {
      conform_action   = "allow"
      exceed_action    = "deny(429)"
      enforce_on_key   = "IP"
      ban_duration_sec = 600
      rate_limit_threshold {
        count        = 100
        interval_sec = 300
      }
    }
    description = "Brute-force protection on credential endpoints"
  }

  rule {
    action   = "throttle"
    priority = 2001
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    rate_limit_options {
      conform_action = "allow"
      exceed_action  = "deny(429)"
      enforce_on_key = "IP"
      rate_limit_threshold {
        count        = 3000
        interval_sec = 300
      }
    }
    description = "Global per-IP rate limit"
  }

  rule {
    action   = "allow"
    priority = 2147483647
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    description = "Default allow"
  }
}

resource "google_compute_backend_service" "backend" {
  name                  = "${var.app_name}-backend-${var.environment}"
  protocol              = "HTTPS"
  load_balancing_scheme = "EXTERNAL"
  security_policy       = google_compute_security_policy.armor.id

  backend {
    group = google_compute_region_network_endpoint_group.cloud_run.id
  }

  log_config {
    enable      = true
    sample_rate = 1.0
  }
}

resource "google_compute_url_map" "url_map" {
  name            = "${var.app_name}-url-map-${var.environment}"
  default_service = google_compute_backend_service.backend.id
}

# SECURITY: port 80 only redirects to HTTPS — the app is never served in cleartext
resource "google_compute_url_map" "https_redirect" {
  name = "${var.app_name}-https-redirect-${var.environment}"

  default_url_redirect {
    https_redirect         = true
    redirect_response_code = "MOVED_PERMANENTLY_DEFAULT"
    strip_query            = false
  }
}

resource "google_compute_target_http_proxy" "http_proxy" {
  name    = "${var.app_name}-http-proxy-${var.environment}"
  url_map = google_compute_url_map.https_redirect.id
}

# SECURITY: TLS 1.2+ with modern ciphers only
resource "google_compute_ssl_policy" "modern" {
  name            = "${var.app_name}-ssl-policy-${var.environment}"
  profile         = "MODERN"
  min_tls_version = "TLS_1_2"
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
  ssl_policy       = google_compute_ssl_policy.modern.id
}

resource "google_compute_global_forwarding_rule" "https_forwarding" {
  name                  = "${var.app_name}-https-forwarding-${var.environment}"
  target                = google_compute_target_https_proxy.https_proxy.id
  port_range            = "443"
  ip_address            = google_compute_global_address.lb_ip.address
  load_balancing_scheme = "EXTERNAL"
}

