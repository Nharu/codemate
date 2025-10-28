variable "aws_region" {
  description = "AWS Region"
  type        = string
  default     = "ap-northeast-2"
}

variable "aws_profile" {
  description = "AWS CLI profile name"
  type        = string
  default     = "codemate"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "codemate"
}

variable "domain_name" {
  description = "Base domain name (e.g., code1398.io)"
  type        = string
  default     = "code1398.io"
}

variable "subdomain" {
  description = "Subdomain for the application (e.g., codemate)"
  type        = string
  default     = "codemate"
}

# VPC Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["ap-northeast-2a", "ap-northeast-2c"]
}

# Database Configuration
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage (GB)"
  type        = number
  default     = 20
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "codemate"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

# Redis Configuration
variable "redis_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "redis_num_cache_nodes" {
  description = "Number of cache nodes"
  type        = number
  default     = 1
}

# ECS Configuration
variable "backend_task_cpu" {
  description = "Backend task CPU units"
  type        = number
  default     = 256
}

variable "backend_task_memory" {
  description = "Backend task memory (MB)"
  type        = number
  default     = 512
}

variable "backend_desired_count" {
  description = "Desired number of backend tasks"
  type        = number
  default     = 1
}

variable "frontend_task_cpu" {
  description = "Frontend task CPU units"
  type        = number
  default     = 256
}

variable "frontend_task_memory" {
  description = "Frontend task memory (MB)"
  type        = number
  default     = 512
}

variable "frontend_desired_count" {
  description = "Desired number of frontend tasks"
  type        = number
  default     = 1
}

# S3/MinIO Configuration
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

# Application Configuration
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
  description = "NextAuth URL (will be constructed from subdomain and domain_name if not provided)"
  type        = string
  default     = ""
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

# AWS Account Configuration
variable "aws_account_id" {
  description = "AWS Account ID"
  type        = string
}

# CI/CD Configuration
variable "github_repo" {
  description = "GitHub repository (format: owner/repo)"
  type        = string
  default     = "Nharu/codemate"
}

variable "github_branch" {
  description = "GitHub branch to trigger CI/CD pipeline"
  type        = string
  default     = "main"
}

# Bastion Configuration
variable "bastion_public_key" {
  description = "SSH public key for bastion host"
  type        = string
  default     = ""
}

variable "bastion_allowed_cidr_blocks" {
  description = "CIDR blocks allowed to SSH into bastion"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}
