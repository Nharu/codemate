# VPC Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

# ECR Outputs
output "backend_ecr_url" {
  description = "Backend ECR repository URL"
  value       = module.ecr.backend_repository_url
}

output "frontend_ecr_url" {
  description = "Frontend ECR repository URL"
  value       = module.ecr.frontend_repository_url
}

# RDS Outputs
output "db_endpoint" {
  description = "RDS endpoint"
  value       = module.rds.db_endpoint
  sensitive   = true
}

# ElastiCache Outputs
output "redis_endpoint" {
  description = "Redis endpoint"
  value       = module.elasticache.redis_endpoint
  sensitive   = true
}

# S3 Outputs
output "uploads_bucket_name" {
  description = "S3 uploads bucket name"
  value       = module.s3.uploads_bucket_name
}

# ALB Outputs
output "alb_dns_name" {
  description = "ALB DNS name"
  value       = module.alb.alb_dns_name
}

output "application_url" {
  description = "Application URL"
  value       = "https://${var.domain_name}"
}

# ECS Outputs
output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.ecs_cluster_name
}

# CodePipeline Outputs
output "codepipeline_name" {
  description = "CodePipeline name"
  value       = module.codepipeline.codepipeline_name
}

output "github_connection_arn" {
  description = "GitHub CodeStar connection ARN (requires manual approval in AWS Console)"
  value       = module.codepipeline.github_connection_arn
}

output "pipeline_artifacts_bucket" {
  description = "S3 bucket for CodePipeline artifacts"
  value       = module.codepipeline.artifacts_bucket_name
}

# Bastion Outputs
output "bastion_public_ip" {
  description = "Bastion host public IP"
  value       = module.bastion.bastion_public_ip
}

output "bastion_ssh_command" {
  description = "SSH command to connect to bastion"
  value       = "ssh -i /Users/ian/Documents/grad/codemate-bastion-key ec2-user@${module.bastion.bastion_public_ip}"
}
