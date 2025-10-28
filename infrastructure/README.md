# CodeMate AWS Infrastructure

This directory contains Terraform configurations and deployment scripts for deploying CodeMate to AWS.

## Architecture

- **Compute**: ECS Fargate for containerized applications
- **Database**: RDS PostgreSQL 17
- **Cache**: ElastiCache Redis 7
- **Storage**: S3 for file uploads
- **Networking**: VPC with public/private subnets, Application Load Balancer
- **Domain & SSL**: Route 53 + ACM for HTTPS
- **Monitoring**: CloudWatch dashboards and alarms

## Prerequisites

1. **AWS CLI** configured with appropriate credentials
   ```bash
   aws configure
   ```

2. **Terraform** installed (version >= 1.0)
   ```bash
   brew install terraform  # macOS
   ```

3. **Docker** installed for building images
   ```bash
   brew install docker  # macOS
   ```

4. **Route 53 Hosted Zone** for `code1398.io` (must be created manually)

## Directory Structure

```
infrastructure/
├── terraform/
│   ├── modules/              # Reusable Terraform modules
│   │   ├── vpc/             # VPC and networking
│   │   ├── ecr/             # Container registry
│   │   ├── ecs/             # ECS cluster and services
│   │   ├── rds/             # PostgreSQL database
│   │   ├── elasticache/     # Redis cache
│   │   ├── s3/              # S3 buckets
│   │   ├── alb/             # Application Load Balancer
│   │   ├── route53/         # DNS and SSL certificates
│   │   ├── cloudwatch/      # Monitoring and alarms
│   │   └── codepipeline/    # CI/CD pipeline
│   └── environments/
│       ├── dev/             # Development environment
│       └── prod/            # Production environment
└── infra.md                 # Detailed infrastructure documentation
```

## Initial Setup

### 1. Configure Terraform Variables

Copy the example variables file and fill in your values:

```bash
cd terraform/environments/dev
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and set:
- `db_username` and `db_password` for RDS
- `anthropic_api_key` for Claude API
- `nextauth_secret` (generate with `openssl rand -base64 32`)

**⚠️ Important**: Never commit `terraform.tfvars` to version control!

### 2. Deploy Infrastructure

```bash
cd terraform/environments/dev
terraform init
terraform plan
terraform apply
```

This will:
1. Initialize Terraform
2. Validate configuration
3. Show execution plan
4. Deploy all AWS resources (VPC, ECS, RDS, CodePipeline, etc.)

**Note**: Initial deployment takes ~15-20 minutes.

### 3. Setup GitHub Connection

After infrastructure is deployed, you need to activate the CodeStar connection to GitHub:

1. Go to AWS Console → Developer Tools → Connections
2. Find the connection `codemate-dev-github`
3. Click "Update pending connection"
4. Complete the GitHub authorization flow

### 4. Automatic Deployment

Once the GitHub connection is activated, CodePipeline will automatically:
1. Monitor your repository for changes
2. Build Docker images using CodeBuild
3. Push images to ECR
4. Deploy to ECS

**Note**: Push to your configured branch (default: `main`) to trigger deployment.

## Environment Variables

### Required for Backend
- `DATABASE_HOST` - RDS endpoint (auto-configured)
- `DATABASE_PORT` - Database port (auto-configured)
- `DATABASE_NAME` - Database name
- `DATABASE_USER` - Database username
- `DATABASE_PASSWORD` - Database password
- `REDIS_HOST` - Redis endpoint (auto-configured)
- `REDIS_PORT` - Redis port (auto-configured)
- `AWS_S3_BUCKET_NAME` - S3 bucket name (auto-configured)
- `AWS_REGION` - AWS region (auto-configured)
- `ANTHROPIC_API_KEY` - Claude API key

### Required for Frontend
- `NEXT_PUBLIC_API_URL` - Backend API URL (auto-configured)
- `NEXTAUTH_SECRET` - NextAuth secret key
- `NEXTAUTH_URL` - Application URL (auto-configured)

## Deployment

### Application Deployment

Application deployment is fully automated through CodePipeline:
- Push code to the configured branch (e.g., `main`) in your GitHub repository
- CodePipeline will automatically trigger and handle the entire deployment process
- Monitor deployment progress in AWS Console → CodePipeline

### Manual ECS Service Update

If you need to force a redeployment without code changes:

```bash
aws ecs update-service \
  --cluster codemate-dev-cluster \
  --service codemate-dev-backend \
  --force-new-deployment \
  --region ap-northeast-2
```

### Infrastructure Changes

```bash
# Plan changes
cd terraform/environments/dev
terraform plan

# Apply changes
terraform apply

# Destroy everything (⚠️ DANGER!)
terraform destroy
```

## Monitoring

### CloudWatch Dashboard

Access the CloudWatch dashboard for monitoring:
- Go to AWS Console → CloudWatch → Dashboards
- Select `codemate-dev-dashboard`

### View Logs

```bash
# Backend logs
aws logs tail /ecs/codemate-dev/backend --follow

# Frontend logs
aws logs tail /ecs/codemate-dev/frontend --follow
```

### ECS Service Status

```bash
# Check service status
aws ecs describe-services \
  --cluster codemate-dev-cluster \
  --services codemate-dev-backend \
  --region ap-northeast-2

aws ecs describe-services \
  --cluster codemate-dev-cluster \
  --services codemate-dev-frontend \
  --region ap-northeast-2
```

## Troubleshooting

### ECS Task Fails to Start

1. Check CloudWatch logs for error messages
2. Verify environment variables in task definition
3. Ensure Docker image builds successfully locally

### Database Connection Issues

1. Verify security groups allow ECS tasks to access RDS
2. Check database credentials in Secrets Manager or terraform.tfvars
3. Ensure RDS is in the correct subnet and security group

### SSL Certificate Not Validating

1. Verify Route 53 hosted zone exists for `code1398.io`
2. Check ACM certificate validation records in Route 53
3. Wait up to 30 minutes for DNS propagation

## Cost Optimization

### Development Environment (~$198/month)

- Use single-AZ RDS (no Multi-AZ)
- Minimal ECS task counts (1 per service)
- Small instance types (t3.micro)
- Consider stopping development environment when not in use

### Production Environment (~$675/month)

- Enable Multi-AZ for RDS
- Increase ECS task counts for high availability
- Use larger instance types as needed
- Enable Performance Insights for database monitoring

## Security Best Practices

1. **Secrets Management**: Never commit sensitive values to version control
2. **IAM Roles**: Use least-privilege IAM policies
3. **Network Security**: Keep databases in private subnets
4. **SSL/TLS**: Always use HTTPS (enforced by ALB redirect)
5. **Container Security**: Regularly update base images and scan for vulnerabilities

## Support

For detailed infrastructure documentation, see [infra.md](./infra.md).

For application-level issues, refer to the main project README.
