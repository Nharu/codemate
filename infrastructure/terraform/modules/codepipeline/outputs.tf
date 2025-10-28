output "codepipeline_name" {
  description = "CodePipeline name"
  value       = aws_codepipeline.main.name
}

output "codepipeline_arn" {
  description = "CodePipeline ARN"
  value       = aws_codepipeline.main.arn
}

output "backend_codebuild_project_name" {
  description = "Backend CodeBuild project name"
  value       = aws_codebuild_project.backend.name
}

output "frontend_codebuild_project_name" {
  description = "Frontend CodeBuild project name"
  value       = aws_codebuild_project.frontend.name
}

output "github_connection_arn" {
  description = "GitHub connection ARN (needs manual approval)"
  value       = aws_codestarconnections_connection.github.arn
}

output "artifacts_bucket_name" {
  description = "S3 bucket name for pipeline artifacts"
  value       = aws_s3_bucket.codepipeline_artifacts.bucket
}
