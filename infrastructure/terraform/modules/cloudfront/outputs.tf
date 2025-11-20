output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.cdn.id
}

output "cloudfront_distribution_arn" {
  description = "CloudFront distribution ARN"
  value       = aws_cloudfront_distribution.cdn.arn
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.cdn.domain_name
}

output "cloudfront_hosted_zone_id" {
  description = "CloudFront hosted zone ID (for Route53 alias)"
  value       = aws_cloudfront_distribution.cdn.hosted_zone_id
}

output "oac_id" {
  description = "Origin Access Control ID"
  value       = aws_cloudfront_origin_access_control.oac.id
}

# Legacy OAI output (for zero-downtime migration)
# TODO: Remove after OAC verification is complete
output "oai_iam_arn" {
  description = "Origin Access Identity IAM ARN (legacy)"
  value       = aws_cloudfront_origin_access_identity.oai.iam_arn
}
