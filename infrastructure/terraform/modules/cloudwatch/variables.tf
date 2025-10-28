variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-2"
}

variable "ecs_cluster_name" {
  description = "ECS cluster name"
  type        = string
}

variable "alb_arn_suffix" {
  description = "ALB ARN suffix"
  type        = string
}

variable "db_instance_id" {
  description = "RDS instance ID"
  type        = string
}

variable "redis_cluster_id" {
  description = "Redis cluster ID"
  type        = string
}
