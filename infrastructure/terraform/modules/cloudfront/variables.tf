variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "s3_bucket_id" {
  description = "S3 bucket ID"
  type        = string
}

variable "s3_bucket_arn" {
  description = "S3 bucket ARN"
  type        = string
}

variable "s3_bucket_regional_domain_name" {
  description = "S3 bucket regional domain name"
  type        = string
}

variable "domain_name" {
  description = "CloudFront custom domain name (e.g., codemate-statics.code1398.io)"
  type        = string
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN (must be in us-east-1)"
  type        = string
}
