output "uploads_bucket_name" {
  description = "Uploads bucket name"
  value       = aws_s3_bucket.uploads.id
}

output "uploads_bucket_arn" {
  description = "Uploads bucket ARN"
  value       = aws_s3_bucket.uploads.arn
}

output "uploads_bucket_domain_name" {
  description = "Uploads bucket domain name"
  value       = aws_s3_bucket.uploads.bucket_domain_name
}

output "uploads_bucket_regional_domain_name" {
  description = "Uploads bucket regional domain name"
  value       = aws_s3_bucket.uploads.bucket_regional_domain_name
}
