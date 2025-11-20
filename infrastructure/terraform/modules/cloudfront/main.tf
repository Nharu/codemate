# ==================================
# CloudFront Origin Access Control (OAC)
# ==================================
# OAC is the recommended way to secure S3 origins (replaces legacy OAI)
resource "aws_cloudfront_origin_access_control" "oac" {
  name                              = "${var.project_name}-${var.environment}-s3-oac"
  description                       = "Origin Access Control for S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# ==================================
# Legacy OAI (for zero-downtime migration)
# ==================================
# TODO: Remove after OAC verification is complete
resource "aws_cloudfront_origin_access_identity" "oai" {
  comment = "${var.project_name}-${var.environment}-s3-oai"
}

# ==================================
# CloudFront Distribution
# ==================================
resource "aws_cloudfront_distribution" "cdn" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.project_name}-${var.environment}-cdn"
  price_class         = "PriceClass_200" # Asia, North America, Europe
  aliases             = [var.domain_name]

  # S3 Origin with OAC
  origin {
    domain_name              = var.s3_bucket_regional_domain_name
    origin_id                = "S3-${var.s3_bucket_id}"
    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
  }

  # Default Cache Behavior
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "S3-${var.s3_bucket_id}"

    forwarded_values {
      query_string = false
      headers      = ["Origin", "Access-Control-Request-Headers", "Access-Control-Request-Method"]

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 86400    # 1 day
    max_ttl                = 31536000 # 1 year
    compress               = true
  }

  # Avatars cache behavior (longer TTL)
  ordered_cache_behavior {
    path_pattern     = "avatars/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "S3-${var.s3_bucket_id}"

    forwarded_values {
      query_string = false
      headers      = ["Origin", "Access-Control-Request-Headers", "Access-Control-Request-Method"]

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 604800   # 7 days
    max_ttl                = 31536000 # 1 year
    compress               = true
  }

  # SSL Certificate
  viewer_certificate {
    acm_certificate_arn      = var.acm_certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  # Restrictions
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # Custom Error Response (optional)
  custom_error_response {
    error_code         = 403
    response_code      = 404
    response_page_path = "/404.html"
    error_caching_min_ttl = 10
  }

  custom_error_response {
    error_code         = 404
    response_code      = 404
    response_page_path = "/404.html"
    error_caching_min_ttl = 10
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-cdn"
    Environment = var.environment
  }
}
