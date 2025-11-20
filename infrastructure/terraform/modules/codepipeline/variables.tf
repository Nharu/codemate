variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository (format: owner/repo)"
  type        = string
}

variable "github_branch" {
  description = "GitHub branch to trigger pipeline"
  type        = string
  default     = "main"
}

variable "backend_ecr_repository_url" {
  description = "Backend ECR repository URL"
  type        = string
}

variable "frontend_ecr_repository_url" {
  description = "Frontend ECR repository URL"
  type        = string
}

variable "backend_ecs_service_name" {
  description = "Backend ECS service name"
  type        = string
}

variable "frontend_ecs_service_name" {
  description = "Frontend ECS service name"
  type        = string
}

variable "ecs_cluster_name" {
  description = "ECS cluster name"
  type        = string
}

variable "aws_account_id" {
  description = "AWS Account ID"
  type        = string
}

variable "aws_region" {
  description = "AWS Region"
  type        = string
}

variable "frontend_api_url" {
  description = "Frontend API URL for NEXT_PUBLIC_API_URL"
  type        = string
}

variable "cdn_domain" {
  description = "CloudFront CDN domain for static assets"
  type        = string
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}
