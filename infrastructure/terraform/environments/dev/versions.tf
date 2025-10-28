terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Terraform 상태를 S3에 저장 (선택사항 - 로컬로 시작할 수도 있음)
  # backend "s3" {
  #   bucket         = "codemate-terraform-state-dev"
  #   key            = "dev/terraform.tfstate"
  #   region         = "ap-northeast-2"
  #   encrypt        = true
  #   dynamodb_table = "codemate-terraform-locks"
  # }
}

provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
    }
  }
}
