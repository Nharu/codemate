variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for ECS tasks"
  type        = list(string)
}

variable "alb_security_group_id" {
  description = "ALB security group ID"
  type        = string
}

# ECR
variable "backend_ecr_url" {
  description = "Backend ECR repository URL"
  type        = string
}

variable "frontend_ecr_url" {
  description = "Frontend ECR repository URL"
  type        = string
}

# Task Configuration
variable "backend_task_cpu" {
  description = "Backend task CPU units"
  type        = number
}

variable "backend_task_memory" {
  description = "Backend task memory (MB)"
  type        = number
}

variable "backend_desired_count" {
  description = "Desired number of backend tasks"
  type        = number
}

variable "frontend_task_cpu" {
  description = "Frontend task CPU units"
  type        = number
}

variable "frontend_task_memory" {
  description = "Frontend task memory (MB)"
  type        = number
}

variable "frontend_desired_count" {
  description = "Desired number of frontend tasks"
  type        = number
}

# Target Groups
variable "backend_target_group_arn" {
  description = "Backend ALB target group ARN"
  type        = string
}

variable "frontend_target_group_arn" {
  description = "Frontend ALB target group ARN"
  type        = string
}

# Database
variable "db_host" {
  description = "Database host"
  type        = string
}

variable "db_port" {
  description = "Database port"
  type        = number
  default     = 5432
}

variable "db_name" {
  description = "Database name"
  type        = string
}

variable "db_username" {
  description = "Database username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

# Redis
variable "redis_host" {
  description = "Redis host"
  type        = string
}

variable "redis_port" {
  description = "Redis port"
  type        = number
  default     = 6379
}

# S3
variable "s3_bucket_name" {
  description = "S3 bucket name for uploads"
  type        = string
}

variable "s3_region" {
  description = "AWS region for S3"
  type        = string
}

variable "s3_endpoint" {
  description = "S3 endpoint URL (MinIO or AWS S3)"
  type        = string
}

variable "s3_public_url" {
  description = "S3 public access URL"
  type        = string
}

variable "aws_access_key_id" {
  description = "AWS Access Key ID for S3"
  type        = string
  sensitive   = true
}

variable "aws_secret_access_key" {
  description = "AWS Secret Access Key for S3"
  type        = string
  sensitive   = true
}

# Application Secrets
variable "anthropic_api_key" {
  description = "Anthropic API Key"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT Secret for authentication"
  type        = string
  sensitive   = true
}

variable "nextauth_secret" {
  description = "NextAuth Secret"
  type        = string
  sensitive   = true
}

variable "nextauth_url" {
  description = "NextAuth URL"
  type        = string
}

variable "api_url" {
  description = "API URL for frontend"
  type        = string
}

variable "frontend_url" {
  description = "Frontend URL for backend CORS"
  type        = string
}

# OAuth Configuration
variable "github_client_id" {
  description = "GitHub OAuth Client ID"
  type        = string
  sensitive   = true
}

variable "github_client_secret" {
  description = "GitHub OAuth Client Secret"
  type        = string
  sensitive   = true
}

variable "google_client_id" {
  description = "Google OAuth Client ID"
  type        = string
  sensitive   = true
}

variable "google_client_secret" {
  description = "Google OAuth Client Secret"
  type        = string
  sensitive   = true
}
