# ==================================
# VPC Module
# ==================================
module "vpc" {
  source = "../../modules/vpc"

  environment        = var.environment
  project_name       = var.project_name
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
}

# ==================================
# ECR Module
# ==================================
module "ecr" {
  source = "../../modules/ecr"

  environment  = var.environment
  project_name = var.project_name
}

# ==================================
# S3 Module
# ==================================
module "s3" {
  source = "../../modules/s3"

  environment  = var.environment
  project_name = var.project_name
}

# ==================================
# Bastion Module
# ==================================
module "bastion" {
  source = "../../modules/bastion"

  environment      = var.environment
  project_name     = var.project_name
  vpc_id           = module.vpc.vpc_id
  public_subnet_id = module.vpc.public_subnet_ids[0]

  # SSH key configuration
  public_key = var.bastion_public_key

  # Allow SSH from your IP (or 0.0.0.0/0 for testing)
  allowed_cidr_blocks = var.bastion_allowed_cidr_blocks
}

# ==================================
# RDS Module
# ==================================
module "rds" {
  source = "../../modules/rds"

  environment          = var.environment
  project_name         = var.project_name
  vpc_id               = module.vpc.vpc_id
  database_subnet_ids  = module.vpc.database_subnet_ids
  db_instance_class    = var.db_instance_class
  db_allocated_storage = var.db_allocated_storage
  db_name              = var.db_name
  db_username          = var.db_username
  db_password          = var.db_password
  multi_az             = false # Dev environment uses single-AZ

  # Security group for database access
  allowed_security_group_ids = [module.ecs.ecs_security_group_id, module.bastion.bastion_security_group_id]
}

# ==================================
# ElastiCache Module
# ==================================
module "elasticache" {
  source = "../../modules/elasticache"

  environment      = var.environment
  project_name     = var.project_name
  vpc_id           = module.vpc.vpc_id
  cache_subnet_ids = module.vpc.database_subnet_ids
  node_type        = var.redis_node_type
  num_cache_nodes  = var.redis_num_cache_nodes

  # Security group for cache access
  allowed_security_group_ids = [module.ecs.ecs_security_group_id]
}

# ==================================
# ACM Certificate (for Cloudflare DNS)
# ==================================
# Note: ACM 인증서 생성 후, Cloudflare에서 검증 레코드를 수동으로 추가해야 합니다.
# terraform apply 후 AWS Console에서 ACM 인증서의 CNAME 레코드를 확인하고
# Cloudflare DNS에 해당 레코드를 추가하세요.
resource "aws_acm_certificate" "main" {
  domain_name               = "${var.subdomain}.${var.domain_name}"
  subject_alternative_names = ["${var.subdomain}-api.${var.domain_name}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-cert"
  }
}

# ==================================
# ACM Certificate for CloudFront (us-east-1)
# ==================================
# CloudFront requires ACM certificates to be in us-east-1 region
# Note: Cloudflare에서 DNS 검증 레코드를 수동으로 추가해야 합니다.
resource "aws_acm_certificate" "cloudfront" {
  provider = aws.us_east_1

  domain_name       = var.cloudfront_domain
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-cloudfront-cert"
  }
}

# ==================================
# ALB Module
# ==================================
module "alb" {
  source = "../../modules/alb"

  environment       = var.environment
  project_name      = var.project_name
  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
  certificate_arn   = aws_acm_certificate.main.arn
  domain_name       = var.domain_name
  subdomain         = var.subdomain
}

# ==================================
# ECS Module
# ==================================
module "ecs" {
  source = "../../modules/ecs"

  environment           = var.environment
  project_name          = var.project_name
  vpc_id                = module.vpc.vpc_id
  private_subnet_ids    = module.vpc.private_app_subnet_ids
  alb_security_group_id = module.alb.alb_security_group_id

  # ECR repositories
  backend_ecr_url  = module.ecr.backend_repository_url
  frontend_ecr_url = module.ecr.frontend_repository_url

  # Task configurations
  backend_task_cpu      = var.backend_task_cpu
  backend_task_memory   = var.backend_task_memory
  backend_desired_count = var.backend_desired_count

  frontend_task_cpu      = var.frontend_task_cpu
  frontend_task_memory   = var.frontend_task_memory
  frontend_desired_count = var.frontend_desired_count

  # Target groups from ALB
  backend_target_group_arn  = module.alb.backend_target_group_arn
  frontend_target_group_arn = module.alb.frontend_target_group_arn

  # Environment variables
  db_host     = module.rds.db_address
  db_port     = module.rds.db_port
  db_name     = var.db_name
  db_username = var.db_username
  db_password = var.db_password

  redis_host = module.elasticache.redis_endpoint
  redis_port = module.elasticache.redis_port

  s3_bucket_name        = module.s3.uploads_bucket_name
  s3_region             = var.aws_region
  s3_endpoint           = var.s3_endpoint
  s3_public_url         = var.s3_public_url
  aws_access_key_id     = var.aws_access_key_id
  aws_secret_access_key = var.aws_secret_access_key

  anthropic_api_key = var.anthropic_api_key
  jwt_secret        = var.jwt_secret
  nextauth_secret   = var.nextauth_secret
  nextauth_url      = var.nextauth_url != "" ? var.nextauth_url : "https://${var.subdomain}.${var.domain_name}"
  api_url           = "https://${var.subdomain}-api.${var.domain_name}"
  frontend_url      = "https://${var.subdomain}.${var.domain_name}"

  github_client_id     = var.github_client_id
  github_client_secret = var.github_client_secret
  google_client_id     = var.google_client_id
  google_client_secret = var.google_client_secret
  cloudfront_domain    = var.cloudfront_domain
}

# ==================================
# CloudWatch Module
# ==================================
module "cloudwatch" {
  source = "../../modules/cloudwatch"

  environment      = var.environment
  project_name     = var.project_name
  ecs_cluster_name = module.ecs.ecs_cluster_name
  alb_arn_suffix   = module.alb.alb_arn_suffix
  db_instance_id   = module.rds.db_instance_id
  redis_cluster_id = module.elasticache.redis_cluster_id
}

# ==================================
# CodePipeline Module (CI/CD)
# ==================================
module "codepipeline" {
  source = "../../modules/codepipeline"

  environment  = var.environment
  project_name = var.project_name

  # GitHub configuration
  github_repo   = var.github_repo
  github_branch = var.github_branch

  # ECR repositories
  backend_ecr_repository_url  = module.ecr.backend_repository_url
  frontend_ecr_repository_url = module.ecr.frontend_repository_url

  # ECS services
  backend_ecs_service_name  = module.ecs.backend_service_name
  frontend_ecs_service_name = module.ecs.frontend_service_name
  ecs_cluster_name          = module.ecs.ecs_cluster_name

  # AWS configuration
  aws_account_id = var.aws_account_id
  aws_region     = var.aws_region

  # Frontend API URL for build
  frontend_api_url = "https://${var.subdomain}-api.${var.domain_name}"

  # CloudFront CDN domain
  cdn_domain = var.cloudfront_domain
}

# ==================================
# CloudFront Module
# ==================================
module "cloudfront" {
  source = "../../modules/cloudfront"

  environment  = var.environment
  project_name = var.project_name

  # S3 bucket configuration
  s3_bucket_id                     = module.s3.uploads_bucket_name
  s3_bucket_arn                    = module.s3.uploads_bucket_arn
  s3_bucket_regional_domain_name   = module.s3.uploads_bucket_regional_domain_name

  # CloudFront domain and certificate
  domain_name         = var.cloudfront_domain
  acm_certificate_arn = aws_acm_certificate.cloudfront.arn
}

# ==================================
# S3 Bucket Policy for CloudFront (OAI + OAC)
# ==================================
# Allows both OAI (legacy) and OAC (new) for zero-downtime migration
resource "aws_s3_bucket_policy" "cloudfront_access" {
  bucket = module.s3.uploads_bucket_name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      # Legacy OAI access (to be removed after OAC verification)
      {
        Sid    = "CloudFrontOAIAccess"
        Effect = "Allow"
        Principal = {
          AWS = module.cloudfront.oai_iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${module.s3.uploads_bucket_arn}/*"
      },
      # New OAC access (recommended by AWS)
      {
        Sid    = "AllowCloudFrontServicePrincipalReadOnly"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${module.s3.uploads_bucket_arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = module.cloudfront.cloudfront_distribution_arn
          }
        }
      }
    ]
  })

  depends_on = [module.cloudfront]
}
