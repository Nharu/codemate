# CodeMate AWS 인프라 구성 문서

## 📋 목차

1. [개요](#개요)
2. [현재 아키텍처](#현재-아키텍처)
3. [AWS 클라우드 아키텍처](#aws-클라우드-아키텍처)
4. [네트워크 구성](#네트워크-구성)
5. [컴퓨팅 리소스](#컴퓨팅-리소스)
6. [데이터베이스 및 캐시](#데이터베이스-및-캐시)
7. [스토리지](#스토리지)
8. [로드 밸런싱 및 라우팅](#로드-밸런싱-및-라우팅)
9. [CI/CD 파이프라인](#cicd-파이프라인)
10. [모니터링 및 로깅](#모니터링-및-로깅)
11. [보안 구성](#보안-구성)
12. [Terraform 구조](#terraform-구조)
13. [배포 프로세스](#배포-프로세스)
14. [예상 비용](#예상-비용)
15. [비용 최적화 전략](#비용-최적화-전략)
16. [단계별 구축 계획](#단계별-구축-계획)

---

## 개요

### 프로젝트 정보

- **프로젝트명**: CodeMate - AI 기반 온라인 코드 협업 플랫폼
- **Infrastructure as Code**: Terraform
- **클라우드 제공자**: Amazon Web Services (AWS)
- **타겟 리전**: ap-northeast-2 (서울)

### 목적

Docker Compose 기반 로컬 개발 환경을 AWS 클라우드로 마이그레이션하여 프로덕션 수준의 확장 가능하고 안정적인 인프라를 구축합니다.

### 주요 요구사항

- **고가용성**: Multi-AZ 배포를 통한 장애 대응
- **확장성**: Auto Scaling을 통한 트래픽 대응
- **보안**: VPC 격리, Security Groups, IAM 역할 기반 접근 제어
- **모니터링**: CloudWatch를 통한 실시간 모니터링 및 알람
- **비용 효율성**: 개발/프로덕션 환경별 리소스 최적화

---

## 현재 아키텍처

### 로컬 개발 환경 (Docker Compose)

```
┌─────────────────────────────────────────────────┐
│           Docker Compose Environment            │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐  ┌──────────────┐            │
│  │  Frontend    │  │   Backend    │            │
│  │  Next.js     │  │   NestJS     │            │
│  │  :3000       │  │   :3001      │            │
│  └──────────────┘  └──────────────┘            │
│         │                 │                     │
│         └─────────┬───────┘                     │
│                   │                             │
│  ┌────────────────┴──────────────────┐          │
│  │                                   │          │
│  │  ┌────────────┐  ┌──────────┐   │          │
│  │  │ PostgreSQL │  │  Redis   │   │          │
│  │  │   :5432    │  │  :6379   │   │          │
│  │  └────────────┘  └──────────┘   │          │
│  │                                   │          │
│  │  ┌────────────┐                  │          │
│  │  │   MinIO    │                  │          │
│  │  │   :9000    │                  │          │
│  │  └────────────┘                  │          │
│  └───────────────────────────────────┘          │
└─────────────────────────────────────────────────┘
```

### 기술 스택

- **Frontend**: Next.js 15.5.2, React 19.1.0
- **Backend**: NestJS 10.4.20
- **Database**: PostgreSQL 17
- **Cache**: Redis 7
- **Storage**: MinIO (S3 호환)
- **Real-time**: Socket.IO 4.8.1
- **AI**: Anthropic Claude SDK 0.62.0

---

## AWS 클라우드 아키텍처

### 전체 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────────────┐
│                           AWS Cloud (Seoul Region)                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                     Route 53 (DNS)                            │  │
│  │                  codemate.code1398.io                         │  │
│  └─────────────────────────┬────────────────────────────────────┘  │
│                            │                                        │
│  ┌─────────────────────────▼────────────────────────────────────┐  │
│  │              CloudFront CDN (Optional)                        │  │
│  │                   Static Assets                               │  │
│  └─────────────────────────┬────────────────────────────────────┘  │
│                            │                                        │
│  ┌─────────────────────────▼────────────────────────────────────┐  │
│  │        Application Load Balancer (ALB)                        │  │
│  │    HTTPS (Port 443) + WebSocket Support                       │  │
│  │              ACM SSL Certificate                              │  │
│  └───────────────┬──────────────────────────┬────────────────────┘  │
│                  │                          │                       │
│  ┌───────────────▼──────────────────────────▼───────────────────┐  │
│  │                        VPC (10.0.0.0/16)                      │  │
│  │                                                               │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │            Public Subnets (Multi-AZ)                    │  │  │
│  │  │  ┌──────────────────┐    ┌──────────────────┐          │  │  │
│  │  │  │  NAT Gateway     │    │  Bastion Host    │          │  │  │
│  │  │  │    (AZ-a)        │    │   (Optional)     │          │  │  │
│  │  │  └──────────────────┘    └──────────────────┘          │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  │                                                               │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │           Private Subnets (Multi-AZ)                    │  │  │
│  │  │                                                          │  │  │
│  │  │  ┌────────────────────────────────────────────────┐    │  │  │
│  │  │  │         ECS Fargate Cluster                     │    │  │  │
│  │  │  │  ┌──────────────┐    ┌──────────────┐          │    │  │  │
│  │  │  │  │  Frontend    │    │   Backend    │          │    │  │  │
│  │  │  │  │  Service     │    │   Service    │          │    │  │  │
│  │  │  │  │  (Next.js)   │    │  (NestJS)    │          │    │  │  │
│  │  │  │  │  Auto Scale  │    │  Auto Scale  │          │    │  │  │
│  │  │  │  └──────────────┘    └──────────────┘          │    │  │  │
│  │  │  └────────────────────────────────────────────────┘    │  │  │
│  │  │                                                          │  │  │
│  │  │  ┌────────────────────────────────────────────────┐    │  │  │
│  │  │  │         Data Layer                              │    │  │  │
│  │  │  │  ┌──────────────┐    ┌──────────────┐          │    │  │  │
│  │  │  │  │  RDS         │    │ ElastiCache  │          │    │  │  │
│  │  │  │  │  PostgreSQL  │    │    Redis     │          │    │  │  │
│  │  │  │  │  Multi-AZ    │    │   Cluster    │          │    │  │  │
│  │  │  │  └──────────────┘    └──────────────┘          │    │  │  │
│  │  │  └────────────────────────────────────────────────┘    │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    S3 Buckets                                 │  │
│  │  - User Files (Private)                                       │  │
│  │  - Static Assets (Public)                                     │  │
│  │  - Logs Archive                                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    ECR (Docker Registry)                      │  │
│  │  - frontend:latest                                            │  │
│  │  - backend:latest                                             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                  CloudWatch                                   │  │
│  │  - Logs Groups (Frontend, Backend, RDS, etc.)                 │  │
│  │  - Metrics & Dashboards                                       │  │
│  │  - Alarms & Notifications                                     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              CI/CD Pipeline                                   │  │
│  │  GitHub → CodePipeline → CodeBuild → ECR → ECS               │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 네트워크 구성

### VPC (Virtual Private Cloud)

**VPC CIDR**: `10.0.0.0/16`

### 서브넷 구성 (Multi-AZ)

#### Public Subnets

- **용도**: ALB, NAT Gateway, Bastion Host
- **AZ-a**: `10.0.1.0/24` (ap-northeast-2a)
- **AZ-c**: `10.0.2.0/24` (ap-northeast-2c)

#### Private Subnets (Application)

- **용도**: ECS Fargate Tasks
- **AZ-a**: `10.0.11.0/24`
- **AZ-c**: `10.0.12.0/24`

#### Private Subnets (Database)

- **용도**: RDS, ElastiCache
- **AZ-a**: `10.0.21.0/24`
- **AZ-c**: `10.0.22.0/24`

### 게이트웨이

- **Internet Gateway**: Public Subnets의 인터넷 접근
- **NAT Gateway**: Private Subnets의 아웃바운드 인터넷 접근 (Multi-AZ 구성)

### 라우팅 테이블

- **Public Route Table**: IGW로 라우팅
- **Private Route Table (App)**: NAT Gateway로 라우팅
- **Private Route Table (DB)**: 격리된 환경 (외부 접근 불가)

---

## 컴퓨팅 리소스

### ECS Fargate

**클러스터**: `codemate-cluster`

#### Frontend Service

- **Image**: `{account-id}.dkr.ecr.ap-northeast-2.amazonaws.com/codemate-frontend:latest`
- **Task Definition**:
    - CPU: 512 (0.5 vCPU)
    - Memory: 1024 MB (1 GB)
    - Container Port: 3000
    - Environment: Next.js Production Mode
- **Service Configuration**:
    - 개발: Desired Count = 1, Min = 1, Max = 2
    - 프로덕션: Desired Count = 2, Min = 2, Max = 5
- **Health Check**: `/api/health` 엔드포인트
- **Auto Scaling**: CPU 70% 기준

#### Backend Service

- **Image**: `{account-id}.dkr.ecr.ap-northeast-2.amazonaws.com/codemate-backend:latest`
- **Task Definition**:
    - CPU: 1024 (1 vCPU)
    - Memory: 2048 MB (2 GB)
    - Container Port: 3001
    - Environment: NestJS Production Mode
- **Service Configuration**:
    - 개발: Desired Count = 1, Min = 1, Max = 2
    - 프로덕션: Desired Count = 2, Min = 2, Max = 6
- **Health Check**: `/health` 엔드포인트
- **Auto Scaling**: CPU 70% 또는 메모리 80% 기준

### 환경 변수 (Secrets Manager 사용)

```bash
# Database
DATABASE_HOST=<rds-endpoint>
DATABASE_PORT=5432
DATABASE_NAME=codemate
DATABASE_USER=<secret>
DATABASE_PASSWORD=<secret>

# Redis
REDIS_HOST=<elasticache-endpoint>
REDIS_PORT=6379

# S3
AWS_S3_BUCKET=codemate-files-{env}
AWS_REGION=ap-northeast-2

# AI Services
ANTHROPIC_API_KEY=<secret>

# NextAuth
NEXTAUTH_URL=https://codemate.code1398.io
NEXTAUTH_SECRET=<secret>
```

---

## 데이터베이스 및 캐시

### Amazon RDS PostgreSQL

#### 개발 환경

- **Instance Class**: `db.t4g.micro`
- **vCPU**: 2
- **Memory**: 1 GB
- **Storage**: 20 GB (gp3)
- **Multi-AZ**: Disabled
- **Backup Retention**: 3일
- **Automated Backups**: 매일 오전 3시 (KST)

#### 프로덕션 환경

- **Instance Class**: `db.t4g.small` (업그레이드 가능)
- **vCPU**: 2
- **Memory**: 2 GB
- **Storage**: 50 GB (gp3, auto-scaling 최대 100GB)
- **Multi-AZ**: Enabled (고가용성)
- **Backup Retention**: 7일
- **Read Replica**: 필요 시 추가 가능

#### 보안

- **Encryption**: At-rest 암호화 (AWS KMS)
- **In-transit**: SSL/TLS 연결 강제
- **Security Group**: Private subnet의 ECS 태스크만 접근 가능

### Amazon ElastiCache Redis

#### 개발 환경

- **Node Type**: `cache.t4g.micro`
- **Memory**: 0.5 GB
- **Nodes**: 1 (단일 노드)
- **Snapshot Retention**: 1일

#### 프로덕션 환경

- **Node Type**: `cache.t4g.small`
- **Memory**: 1.37 GB
- **Cluster Mode**: Enabled (샤딩)
- **Replicas**: 1 replica per shard
- **Nodes**: 2 (Primary + Replica)
- **Snapshot Retention**: 5일
- **Multi-AZ**: Enabled

#### 사용 목적

- 세션 관리 (IDE 상태, 탭 정보)
- WebSocket 연결 상태
- API 응답 캐싱
- Rate Limiting

---

## 스토리지

### Amazon S3

#### Bucket 구성

**1. User Files Bucket** (`codemate-files-{env}-{account-id}`)

- **용도**: 사용자 업로드 파일, 프로필 이미지, 프로젝트 ZIP
- **Access**: Private
- **Versioning**: Enabled
- **Lifecycle Policy**:
    - 30일 후 → S3 Standard-IA
    - 90일 후 → Glacier Instant Retrieval
    - 1년 후 → Glacier Deep Archive
- **Encryption**: AES-256 (SSE-S3)

**2. Static Assets Bucket** (`codemate-static-{env}`)

- **용도**: Next.js 정적 자산 (\_next/static)
- **Access**: Public Read (CloudFront 경유)
- **Versioning**: Disabled
- **Lifecycle Policy**: 30일 후 삭제

**3. Logs Archive Bucket** (`codemate-logs-{account-id}`)

- **용도**: ALB, CloudFront, VPC Flow Logs
- **Access**: Private (CloudWatch 접근 권한)
- **Lifecycle Policy**: 90일 후 Glacier, 1년 후 삭제

#### CORS 설정 (User Files Bucket)

```json
{
    "CORSRules": [
        {
            "AllowedOrigins": ["https://codemate.code1398.io"],
            "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
            "AllowedHeaders": ["*"],
            "MaxAgeSeconds": 3000
        }
    ]
}
```

### ECR (Elastic Container Registry)

**Repositories**:

- `codemate-frontend`
- `codemate-backend`

**설정**:

- **Scan on Push**: Enabled (보안 취약점 스캔)
- **Image Tag Mutability**: Immutable
- **Lifecycle Policy**: 최근 10개 이미지 유지, 나머지 자동 삭제

---

## 로드 밸런싱 및 라우팅

### Application Load Balancer (ALB)

**Name**: `codemate-alb-{env}`

#### 리스너 구성

**HTTPS Listener (Port 443)**

- **SSL Certificate**: ACM 인증서 (\*.code1398.io)
- **Security Policy**: ELBSecurityPolicy-TLS13-1-2-2021-06

**Target Groups**:

1. **Frontend Target Group** (`codemate-frontend-tg`)
    - Protocol: HTTP
    - Port: 3000
    - Health Check: `/api/health`
    - Healthy Threshold: 2
    - Unhealthy Threshold: 3
    - Interval: 30초

2. **Backend Target Group** (`codemate-backend-tg`)
    - Protocol: HTTP
    - Port: 3001
    - Health Check: `/health`
    - Healthy Threshold: 2
    - Unhealthy Threshold: 3
    - Interval: 30초

#### 라우팅 규칙

```
Path: /api/* → Backend Target Group
Path: /socket.io/* → Backend Target Group (WebSocket 지원)
Path: /* → Frontend Target Group (Default)
```

#### WebSocket 지원

- **Stickiness**: Enabled (Session Affinity)
- **Idle Timeout**: 3600초 (1시간)
- **Connection Draining**: 300초

### CloudFront (선택사항)

**Distribution**:

- **Origin**: ALB + S3 Static Assets
- **Price Class**: PriceClass_200 (한국, 일본, 대만, 홍콩 등)
- **Caching Behavior**:
    - `_next/static/*`: 1년 캐싱
    - `/api/*`: No Cache
    - 나머지: 24시간 캐싱

---

## CI/CD 파이프라인

### GitHub Actions + AWS CodePipeline 통합

#### Pipeline 구성

```
┌────────────┐     ┌─────────────┐     ┌────────────┐     ┌─────────────┐
│   GitHub   │────▶│ CodePipeline│────▶│ CodeBuild  │────▶│     ECR     │
│   Push     │     │   Trigger   │     │   Docker   │     │   Push      │
└────────────┘     └─────────────┘     └────────────┘     └─────────────┘
                                                                  │
                                                                  ▼
                                                           ┌─────────────┐
                                                           │     ECS     │
                                                           │   Deploy    │
                                                           └─────────────┘
```

#### CodePipeline Stages

**1. Source Stage**

- **Provider**: GitHub v2 (CodeStar Connection)
- **Repository**: `Nharu/codemate`
- **Branch**: `main` (프로덕션), `develop` (개발)
- **Trigger**: 자동 (코드 푸시 시)

**2. Build Stage**

- **Provider**: CodeBuild
- **Projects**:
    - `codemate-frontend-build`
    - `codemate-backend-build`

**3. Deploy Stage**

- **Provider**: ECS Rolling Update
- **Services**:
    - `codemate-frontend-service`
    - `codemate-backend-service`

#### CodeBuild 설정

**buildspec.yml** (Frontend 예시):

```yaml
version: 0.2

phases:
    pre_build:
        commands:
            - echo Logging in to Amazon ECR...
            - aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPO
            - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
            - IMAGE_TAG=${COMMIT_HASH:=latest}

    build:
        commands:
            - echo Build started on `date`
            - cd frontend
            - docker build -t $ECR_REPO:latest -f Dockerfile.prod .
            - docker tag $ECR_REPO:latest $ECR_REPO:$IMAGE_TAG

    post_build:
        commands:
            - echo Build completed on `date`
            - echo Pushing Docker images...
            - docker push $ECR_REPO:latest
            - docker push $ECR_REPO:$IMAGE_TAG
            - echo Writing image definitions file...
            - printf '[{"name":"codemate-frontend","imageUri":"%s"}]' $ECR_REPO:latest > imagedefinitions.json

artifacts:
    files: imagedefinitions.json
```

#### 환경별 배포 전략

**개발 환경**:

- 자동 배포 (develop 브랜치 푸시 시)
- Blue/Green 배포 불필요 (다운타임 허용)
- CI/CD 파이프라인 구성 권장 (개발 속도 향상)

**프로덕션**:

- 수동 승인 필요 (Manual Approval Stage)
- Blue/Green 배포 또는 Rolling Update
- 자동 롤백 (Health Check 실패 시)

---

## 모니터링 및 로깅

### CloudWatch Logs

#### Log Groups

```
/aws/ecs/codemate-frontend
/aws/ecs/codemate-backend
/aws/rds/codemate-db
/aws/elasticache/codemate-redis
/aws/codebuild/codemate-frontend-build
/aws/codebuild/codemate-backend-build
```

#### Retention Policy

- 개발: 7일
- 프로덕션: 30일 (중요 로그는 S3로 아카이브)

### CloudWatch Metrics

#### 주요 메트릭

- **ECS**: CPUUtilization, MemoryUtilization, DesiredTaskCount
- **ALB**: RequestCount, TargetResponseTime, HTTPCode_Target_5XX_Count
- **RDS**: DatabaseConnections, CPUUtilization, FreeStorageSpace
- **ElastiCache**: CacheHits, CacheMisses, CPUUtilization

### CloudWatch Alarms

#### 중요 알람 설정

**1. ECS CPU High**

- **Metric**: CPUUtilization > 80%
- **Duration**: 5분 이상
- **Action**: SNS 알림 + Auto Scaling

**2. ALB Target Health**

- **Metric**: UnHealthyHostCount > 0
- **Duration**: 2분 이상
- **Action**: SNS 알림 (긴급)

**3. RDS Connections**

- **Metric**: DatabaseConnections > 80% of max_connections
- **Duration**: 5분 이상
- **Action**: SNS 알림

**4. 5XX Errors**

- **Metric**: HTTPCode_Target_5XX_Count > 10
- **Duration**: 1분 이상
- **Action**: SNS 알림 (긴급)

### CloudWatch Dashboards

**Production Dashboard** 포함 항목:

- ECS 서비스 상태 및 메트릭
- ALB 요청/응답 시간
- RDS 성능 메트릭
- ElastiCache Hit/Miss Rate
- 에러 발생 추이

---

## 보안 구성

### IAM 역할 및 정책

#### ECS Task Execution Role

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ecr:GetAuthorizationToken",
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:BatchGetImage",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
                "secretsmanager:GetSecretValue"
            ],
            "Resource": "*"
        }
    ]
}
```

#### ECS Task Role (Application)

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
            "Resource": "arn:aws:s3:::codemate-files-*/*"
        },
        {
            "Effect": "Allow",
            "Action": ["s3:ListBucket"],
            "Resource": "arn:aws:s3:::codemate-files-*"
        }
    ]
}
```

### Security Groups

#### ALB Security Group

- **Inbound**:
    - HTTPS (443) from 0.0.0.0/0
    - HTTP (80) from 0.0.0.0/0 (redirect to HTTPS)
- **Outbound**: All traffic to ECS Security Group

#### ECS Security Group

- **Inbound**:
    - Port 3000 (Frontend) from ALB SG
    - Port 3001 (Backend) from ALB SG
- **Outbound**: All traffic

#### RDS Security Group

- **Inbound**: Port 5432 from ECS SG only
- **Outbound**: None

#### ElastiCache Security Group

- **Inbound**: Port 6379 from ECS SG only
- **Outbound**: None

### Secrets Management

**AWS Secrets Manager**에 저장:

- Database 자격증명
- Redis 비밀번호 (if applicable)
- NextAuth Secret
- Anthropic API Key
- GitHub OAuth Credentials

**환경별 Secret 이름**:

```
codemate/{env}/database
codemate/{env}/nextauth
codemate/{env}/anthropic
codemate/{env}/github-oauth
```

### SSL/TLS 인증서

**ACM (AWS Certificate Manager)**:

- **Domain**: `*.code1398.io`
- **Validation**: DNS Validation (Route 53)
- **Auto-Renewal**: Enabled

---

## Terraform 구조

### 디렉토리 레이아웃

```
infrastructure/
├── README.md
├── environments/
│   ├── dev/
│   │   ├── main.tf                    # 메인 구성
│   │   ├── variables.tf               # 입력 변수
│   │   ├── outputs.tf                 # 출력 값
│   │   ├── terraform.tfvars           # 변수 값 (Git ignore)
│   │   └── backend.tf                 # Terraform State 백엔드
│   ├── staging/
│   │   └── (동일 구조)
│   └── prod/
│       └── (동일 구조)
├── modules/
│   ├── networking/
│   │   ├── vpc/
│   │   │   ├── main.tf                # VPC, Subnets, IGW, NAT
│   │   │   ├── variables.tf
│   │   │   └── outputs.tf
│   │   ├── security-groups/
│   │   │   ├── main.tf                # Security Groups
│   │   │   ├── variables.tf
│   │   │   └── outputs.tf
│   │   └── alb/
│   │       ├── main.tf                # Application Load Balancer
│   │       ├── variables.tf
│   │       └── outputs.tf
│   ├── compute/
│   │   ├── ecs-cluster/
│   │   │   ├── main.tf                # ECS Cluster
│   │   │   ├── variables.tf
│   │   │   └── outputs.tf
│   │   ├── ecs-service/
│   │   │   ├── main.tf                # ECS Service (재사용 가능)
│   │   │   ├── variables.tf
│   │   │   └── outputs.tf
│   │   └── ecr/
│   │       ├── main.tf                # ECR Repositories
│   │       ├── variables.tf
│   │       └── outputs.tf
│   ├── database/
│   │   ├── rds/
│   │   │   ├── main.tf                # RDS PostgreSQL
│   │   │   ├── variables.tf
│   │   │   └── outputs.tf
│   │   └── elasticache/
│   │       ├── main.tf                # ElastiCache Redis
│   │       ├── variables.tf
│   │       └── outputs.tf
│   ├── storage/
│   │   └── s3/
│   │       ├── main.tf                # S3 Buckets
│   │       ├── variables.tf
│   │       └── outputs.tf
│   ├── monitoring/
│   │   └── cloudwatch/
│   │       ├── main.tf                # Logs, Metrics, Alarms
│   │       ├── variables.tf
│   │       └── outputs.tf
│   └── cicd/
│       └── codepipeline/
│           ├── main.tf                # CodePipeline, CodeBuild
│           ├── variables.tf
│           └── outputs.tf
└── scripts/
    ├── init.sh                        # Terraform 초기화
    ├── plan.sh                        # Plan 실행
    ├── apply.sh                       # Apply 실행
    ├── destroy.sh                     # Destroy 실행
    └── migrate-state.sh               # State 마이그레이션
```

### 주요 Terraform 파일 예시

#### `environments/dev/main.tf`

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "codemate-terraform-state"
    key            = "dev/terraform.tfstate"
    region         = "ap-northeast-2"
    encrypt        = true
    dynamodb_table = "codemate-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = "dev"
      Project     = "codemate"
      ManagedBy   = "terraform"
    }
  }
}

# VPC 모듈
module "vpc" {
  source = "../../modules/networking/vpc"

  environment         = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones

  public_subnets      = var.public_subnets
  private_app_subnets = var.private_app_subnets
  private_db_subnets  = var.private_db_subnets
}

# Security Groups 모듈
module "security_groups" {
  source = "../../modules/networking/security-groups"

  environment = var.environment
  vpc_id      = module.vpc.vpc_id
}

# RDS 모듈
module "rds" {
  source = "../../modules/database/rds"

  environment         = var.environment
  db_subnet_group_ids = module.vpc.private_db_subnet_ids
  security_group_ids  = [module.security_groups.rds_sg_id]

  instance_class      = var.rds_instance_class
  allocated_storage   = var.rds_allocated_storage
  multi_az            = var.rds_multi_az
  backup_retention    = var.rds_backup_retention
}

# ElastiCache 모듈
module "elasticache" {
  source = "../../modules/database/elasticache"

  environment         = var.environment
  subnet_group_ids    = module.vpc.private_db_subnet_ids
  security_group_ids  = [module.security_groups.redis_sg_id]

  node_type           = var.redis_node_type
  num_cache_nodes     = var.redis_num_cache_nodes
  snapshot_retention  = var.redis_snapshot_retention
}

# 나머지 모듈들...
```

#### `environments/dev/variables.tf`

```hcl
variable "aws_region" {
  description = "AWS Region"
  type        = string
  default     = "ap-northeast-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability Zones"
  type        = list(string)
  default     = ["ap-northeast-2a", "ap-northeast-2c"]
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.micro"
}

variable "rds_allocated_storage" {
  description = "RDS allocated storage (GB)"
  type        = number
  default     = 20
}

variable "rds_multi_az" {
  description = "Enable Multi-AZ for RDS"
  type        = bool
  default     = false
}

# 나머지 변수들...
```

#### `environments/dev/terraform.tfvars`

```hcl
environment = "dev"
aws_region  = "ap-northeast-2"

# VPC
vpc_cidr            = "10.0.0.0/16"
public_subnets      = ["10.0.1.0/24", "10.0.2.0/24"]
private_app_subnets = ["10.0.11.0/24", "10.0.12.0/24"]
private_db_subnets  = ["10.0.21.0/24", "10.0.22.0/24"]

# RDS
rds_instance_class    = "db.t4g.micro"
rds_allocated_storage = 20
rds_multi_az          = false

# ElastiCache
redis_node_type      = "cache.t4g.micro"
redis_num_cache_nodes = 1

# ECS
frontend_cpu    = 512
frontend_memory = 1024
frontend_count  = 1

backend_cpu     = 1024
backend_memory  = 2048
backend_count   = 1
```

### State 관리

**Remote Backend (S3 + DynamoDB)**:

- **S3 Bucket**: `codemate-terraform-state`
    - Versioning: Enabled
    - Encryption: AES-256
    - Lifecycle: 90일 후 이전 버전 삭제
- **DynamoDB Table**: `codemate-terraform-locks`
    - Purpose: State 잠금 (동시 실행 방지)
    - Key: LockID (String)

---

## 배포 프로세스

### 초기 인프라 구축

#### 1단계: Terraform 백엔드 생성

```bash
cd infrastructure/scripts
./init-backend.sh
```

이 스크립트는 S3 버킷과 DynamoDB 테이블을 수동으로 생성합니다.

#### 2단계: 개발 환경 Terraform 초기화

```bash
cd infrastructure/environments/dev
terraform init
```

#### 3단계: Terraform Plan 확인

```bash
terraform plan -out=tfplan
```

생성될 리소스 목록 확인:

- VPC 및 Subnets
- Security Groups
- RDS PostgreSQL
- ElastiCache Redis
- S3 Buckets
- ECR Repositories
- ECS Cluster (서비스는 나중에)
- ALB
- CloudWatch Log Groups

#### 4단계: Terraform Apply

```bash
terraform apply tfplan
```

예상 소요 시간: 15-20분

#### 5단계: 출력 값 확인

```bash
terraform output
```

출력 예시:

```
alb_dns_name = "codemate-alb-dev-123456789.ap-northeast-2.elb.amazonaws.com"
rds_endpoint = "codemate-db-dev.xxxxxxxxxx.ap-northeast-2.rds.amazonaws.com:5432"
redis_endpoint = "codemate-redis-dev.xxxxxx.0001.apn2.cache.amazonaws.com:6379"
ecr_frontend_url = "123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/codemate-frontend"
ecr_backend_url = "123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/codemate-backend"
```

### Docker 이미지 빌드 및 푸시

#### Frontend 빌드

```bash
cd frontend

# Dockerfile.prod 생성 (프로덕션 최적화)
docker build -t codemate-frontend:latest -f Dockerfile.prod .

# ECR 로그인
aws ecr get-login-password --region ap-northeast-2 | \
  docker login --username AWS --password-stdin \
  <account-id>.dkr.ecr.ap-northeast-2.amazonaws.com

# 태그 및 푸시
docker tag codemate-frontend:latest \
  <account-id>.dkr.ecr.ap-northeast-2.amazonaws.com/codemate-frontend:latest

docker push <account-id>.dkr.ecr.ap-northeast-2.amazonaws.com/codemate-frontend:latest
```

#### Backend 빌드

```bash
cd backend

docker build -t codemate-backend:latest -f Dockerfile.prod .

docker tag codemate-backend:latest \
  <account-id>.dkr.ecr.ap-northeast-2.amazonaws.com/codemate-backend:latest

docker push <account-id>.dkr.ecr.ap-northeast-2.amazonaws.com/codemate-backend:latest
```

### 데이터베이스 마이그레이션

```bash
# RDS 엔드포인트로 연결
psql -h <rds-endpoint> -U <username> -d codemate

# TypeORM 마이그레이션 실행 (백엔드 컨테이너에서)
npm run typeorm migration:run
```

### ECS 서비스 배포

Terraform으로 ECS 서비스를 생성하거나 AWS 콘솔에서 수동 생성:

```bash
cd infrastructure/environments/dev
terraform apply -target=module.ecs_frontend_service
terraform apply -target=module.ecs_backend_service
```

### DNS 설정

Route 53에서 ALB로 라우팅:

```
codemate-dev.code1398.io → ALB DNS Name (Alias Record)
```

### 배포 확인

```bash
# 헬스 체크
curl https://codemate-dev.code1398.io/api/health

# 프론트엔드 접속
open https://codemate-dev.code1398.io
```

---

## 예상 비용

### 월간 예상 비용 (USD, 서울 리전 기준)

#### 개발 환경 (최소 구성)

| 서비스                  | 스펙                       | 시간당  | 월간 (730h) |
| ----------------------- | -------------------------- | ------- | ----------- |
| **ECS Fargate**         |                            |         |             |
| └ Frontend              | 0.5 vCPU, 1GB RAM × 1 task | $0.0344 | $25.11      |
| └ Backend               | 1 vCPU, 2GB RAM × 1 task   | $0.0688 | $50.22      |
| **RDS PostgreSQL**      |                            |         |             |
| └ Instance              | db.t4g.micro, Single-AZ    | $0.020  | $14.60      |
| └ Storage               | 20GB gp3                   | -       | $2.76       |
| **ElastiCache Redis**   |                            |         |             |
| └ Node                  | cache.t4g.micro × 1        | $0.016  | $11.68      |
| **S3**                  |                            |         |             |
| └ Storage               | 10GB Standard              | -       | $0.25       |
| └ Requests              | 1,000 PUT/GET              | -       | $0.05       |
| **ECR**                 | 5GB 이미지 스토리지        | -       | $0.50       |
| **ALB**                 |                            |         |             |
| └ Load Balancer         | 1 ALB                      | $0.0252 | $18.40      |
| └ LCU                   | 최소 트래픽                | -       | $1.84       |
| **NAT Gateway**         |                            |         |             |
| └ Gateway               | 1 NAT Gateway              | $0.059  | $43.07      |
| └ Data Transfer         | 10GB 아웃바운드            | -       | $0.59       |
| **CloudWatch**          |                            |         |             |
| └ Logs                  | 5GB 수집 + 5GB 저장        | -       | $3.03       |
| └ Metrics               | 기본 메트릭 (무료)         | -       | $0.00       |
| **Route 53**            | 1 호스팅 존 + 쿼리         | -       | $0.50       |
| **Secrets Manager**     | 5개 시크릿                 | -       | $2.00       |
| **ACM**                 | SSL 인증서                 | -       | $0.00       |
| **AI 서비스**           |                            |         |             |
| └ Anthropic Claude      | 테스트용 최소 사용         | -       | $20.00      |
| **CodePipeline**        | 1 파이프라인               | -       | $1.00       |
| **CodeBuild**           | 월 50분 빌드 (무료 초과 시) | -       | $2.50       |
|                         |                            |         |             |
| **총 예상 비용 (개발)** |                            |         | **$198.10** |

#### 프로덕션 환경 (고가용성 구성)

| 서비스                      | 스펙                               | 시간당  | 월간 (730h) |
| --------------------------- | ---------------------------------- | ------- | ----------- |
| **ECS Fargate**             |                                    |         |             |
| └ Frontend                  | 0.5 vCPU, 1GB RAM × 2 tasks        | $0.0688 | $50.22      |
| └ Backend                   | 1 vCPU, 2GB RAM × 3 tasks          | $0.2064 | $150.67     |
| **RDS PostgreSQL**          |                                    |         |             |
| └ Instance                  | db.t4g.small, Multi-AZ             | $0.080  | $58.40      |
| └ Storage                   | 50GB gp3                           | -       | $6.90       |
| └ Backup                    | 50GB × 7일                         | -       | $3.50       |
| **ElastiCache Redis**       |                                    |         |             |
| └ Nodes                     | cache.t4g.small × 2 (클러스터)     | $0.068  | $49.64      |
| **S3**                      |                                    |         |             |
| └ Storage                   | 50GB (Standard + IA)               | -       | $1.15       |
| └ Requests                  | 10,000 PUT/GET                     | -       | $0.50       |
| **ECR**                     | 10GB 이미지 스토리지               | -       | $1.00       |
| **ALB**                     |                                    |         |             |
| └ Load Balancer             | 1 ALB                              | $0.0252 | $18.40      |
| └ LCU                       | 중간 트래픽 (평균 3 LCU)           | $0.0240 | $17.52      |
| **NAT Gateway**             |                                    |         |             |
| └ Gateways                  | 2 NAT Gateways (Multi-AZ)          | $0.118  | $86.14      |
| └ Data Transfer             | 50GB 아웃바운드                    | -       | $2.95       |
| **CloudFront** (선택사항)   |                                    |         |             |
| └ Data Transfer             | 100GB                              | -       | $12.60      |
| └ Requests                  | 1M HTTP/HTTPS                      | -       | $0.75       |
| **CloudWatch**              |                                    |         |             |
| └ Logs                      | 20GB 수집 + 20GB 저장              | -       | $12.12      |
| └ Custom Metrics            | 50 메트릭 × 5분 해상도             | -       | $7.50       |
| └ Dashboards                | 1 대시보드                         | -       | $3.00       |
| └ Alarms                    | 10 알람                            | -       | $1.00       |
| **Route 53**                | 1 호스팅 존 + 쿼리                 | -       | $0.60       |
| **Secrets Manager**         | 10개 시크릿                        | -       | $4.00       |
| **ACM**                     | SSL 인증서                         | -       | $0.00       |
| **AI 서비스**               |                                    |         |             |
| └ Anthropic Claude          | 중간 사용량                        | -       | $150.00     |
| └ GPT-5 (백업)              | 최소 사용량                        | -       | $30.00      |
| **CodePipeline**            | 1 파이프라인 (월 1회 무료 초과 시) | -       | $1.00       |
| **CodeBuild**               | 월 100분 빌드 (무료 티어 초과)     | -       | $5.00       |
|                             |                                    |         |             |
| **총 예상 비용 (프로덕션)** |                                    |         | **$674.56** |

### 비용 요약

| 환경     | 월간 비용 (USD) | 연간 비용 (USD) |
| -------- | --------------- | --------------- |
| 개발     | $198.10         | $2,377.20       |
| 프로덕션 | $674.56         | $8,094.72       |

### 주요 비용 항목 분석

**개발 환경**:

- 컴퓨팅 (ECS): 38.0% ($75.33)
- 네트워킹 (NAT, ALB): 32.0% ($63.50)
- 데이터베이스 (RDS, Redis): 14.7% ($29.04)
- AI 서비스: 10.1% ($20.00)
- CI/CD (CodePipeline, CodeBuild): 1.8% ($3.50)
- 기타 (S3, CloudWatch 등): 3.4% ($6.73)

**프로덕션 환경**:

- AI 서비스: 26.7% ($180.00)
- 컴퓨팅 (ECS): 29.8% ($200.89)
- 네트워킹 (NAT, ALB, CloudFront): 20.4% ($137.61)
- 데이터베이스 (RDS, Redis): 17.5% ($118.44)
- 기타 (S3, CloudWatch, CI/CD 등): 5.6% ($37.62)

---

## 비용 최적화 전략

### 단기 최적화 (즉시 적용 가능)

#### 1. 프리 티어 활용

- **EC2 (t2.micro)**: 첫 12개월 750시간/월 무료
    - Bastion Host로 활용
- **RDS**: 첫 12개월 db.t2.micro 750시간/월 무료
    - 개발 환경에서 활용
- **S3**: 5GB 스토리지 + 20,000 GET + 2,000 PUT (영구 무료)
- **CloudWatch**: 10 메트릭 + 5GB 로그 (영구 무료)
- **Lambda**: 월 100만 요청 (영구 무료)
    - 백그라운드 작업에 활용

#### 2. Reserved Instances / Savings Plans

프로덕션 환경에서 1년 또는 3년 약정:

- **RDS Reserved Instances**: 최대 63% 할인
    - db.t4g.small Multi-AZ: $58.40 → $21.50/월
- **ElastiCache Reserved Nodes**: 최대 55% 할인
    - cache.t4g.small: $24.82 → $11.17/월

**예상 절감**: 프로덕션 환경에서 월 $55 절감

#### 3. Spot Instances (ECS Fargate Spot)

비중요 백그라운드 작업:

- **절감률**: 최대 70%
- **적용 대상**: 데이터 분석, 배치 작업
- **주의사항**: 중단 가능성 있음

#### 4. NAT Gateway 최적화

**문제**: NAT Gateway가 개발 환경에서 22% ($43.66), 프로덕션에서 13% ($89.09)를 차지

**해결책**:

- 개발 환경: NAT Instance로 대체 (t4g.nano, ~$3/월)
- 프로덕션: VPC Endpoints 활용하여 트래픽 감소
    - S3 Endpoint (무료)
    - ECR Endpoint (무료, 데이터 전송 비용만)

**예상 절감**:

- 개발: $40/월
- 프로덕션: $30/월

#### 5. CloudWatch 로그 필터링

불필요한 로그 수집 방지:

- INFO 레벨 로그는 개발에서만
- 프로덕션은 WARN, ERROR만 수집
- 로그 샘플링 적용 (트래픽이 많을 경우)

**예상 절감**: 프로덕션 로그 비용 50% 감소 ($6/월)

### 중장기 최적화

#### 6. Auto Scaling 세밀 조정

- **Scale-in 정책**: 업무 시간 외 최소 인스턴스로 감소
- **예약 스케줄링**: 야간/주말 자동 Scale-down
- **Target Tracking**: CPU 70% → 60%로 조정 (더 빠른 반응)

**예상 절감**: 월 $30-50

#### 7. S3 Intelligent-Tiering

자동으로 액세스 패턴에 따라 스토리지 클래스 변경:

- 자주 접근: Standard
- 30일 미접근: Infrequent Access
- 90일 미접근: Archive

**예상 절감**: 스토리지 비용 30-40% 감소

#### 8. 데이터 전송 최적화

- **CloudFront 적극 활용**: ALB 직접 접근 감소
- **S3 Transfer Acceleration**: 글로벌 사용자가 많을 경우
- **Cross-Region Replication**: 꼭 필요한 경우만 사용

#### 9. AI 서비스 최적화

**현재**: 매 요청마다 AI API 호출

**최적화**:

- **캐싱**: 동일 코드에 대한 리뷰 결과 Redis 캐싱
- **배치 처리**: 여러 파일을 한 번에 리뷰
- **Diff 기반 분석**: 전체 파일이 아닌 변경 부분만 분석
- **프롬프트 최적화**: 토큰 사용량 감소 (간결한 요청)

**예상 절감**: AI 비용 40-60% 감소 ($70-100/월)

#### 10. Multi-Region 대신 Multi-AZ

글로벌 서비스가 아니라면:

- Multi-Region 배포 불필요
- 한 리전 내 Multi-AZ로 충분
- CloudFront로 글로벌 성능 확보

### AWS 학생/스타트업 크레딧

#### AWS Educate / AWS Academy

- **제공**: $100-300 크레딧
- **조건**: 학생 인증
- **유효기간**: 1년
- **신청**: [AWS Educate](https://aws.amazon.com/education/awseducate/)

#### AWS Activate (스타트업)

- **제공**: $1,000-100,000 크레딧
- **조건**: 스타트업 가속기, 인큐베이터 소속
- **유효기간**: 2년
- **신청**: [AWS Activate](https://aws.amazon.com/activate/)

### 최적화 적용 후 예상 비용

#### 개발 환경 (최적화 후)

| 항목              | 기존        | 최적화 후   | 절감액             |
| ----------------- | ----------- | ----------- | ------------------ |
| ECS Fargate       | $75.33      | $75.33      | $0.00              |
| RDS PostgreSQL    | $17.36      | $0.00       | $17.36 (프리 티어) |
| ElastiCache Redis | $11.68      | $11.68      | $0.00              |
| NAT Gateway       | $43.66      | $3.00       | $40.66             |
| CloudWatch        | $3.03       | $1.50       | $1.53              |
| CI/CD             | $3.50       | $3.50       | $0.00              |
| 기타              | $43.54      | $43.54      | $0.00              |
| **총합**          | **$198.10** | **$138.55** | **$59.55**         |

#### 프로덕션 환경 (최적화 후)

| 항목                        | 기존        | 최적화 후   | 절감액      |
| --------------------------- | ----------- | ----------- | ----------- |
| ECS Fargate                 | $200.89     | $150.00     | $50.89      |
| RDS PostgreSQL (RI)         | $68.80      | $21.50      | $47.30      |
| ElastiCache Redis (RI)      | $49.64      | $22.34      | $27.30      |
| NAT Gateway (VPC Endpoints) | $89.09      | $60.00      | $29.09      |
| CloudWatch                  | $23.62      | $12.00      | $11.62      |
| AI 서비스 (캐싱)            | $180.00     | $80.00      | $100.00     |
| 기타                        | $62.52      | $62.52      | $0.00       |
| **총합**                    | **$674.56** | **$408.36** | **$266.20** |

### 총 절감 효과

| 환경     | 최적화 전 | 최적화 후 | 절감액  | 절감률 |
| -------- | --------- | --------- | ------- | ------ |
| 개발     | $198.10   | $138.55   | $59.55  | 30.1%  |
| 프로덕션 | $674.56   | $408.36   | $266.20 | 39.5%  |

**AWS 크레딧 적용 시 (학생 크레딧 $200 가정)**:

- 개발 환경: 1.5개월 완전 무료
- 프로덕션 환경: 첫 달 무료

---

## 단계별 구축 계획

### Phase 1: 중간 발표 (현재 ~ 2주)

**목표**: 로컬 환경에서 안정적인 데모

**작업**:

- [x] Docker Compose 환경 완성 (완료)
- [x] 핵심 기능 구현 (완료)
- [ ] 로컬 환경 성능 최적화
- [ ] 데모 시나리오 준비

**인프라**: 로컬 환경 (Docker Compose)
**비용**: $0

---

### Phase 2: 클라우드 인프라 구축 (3주)

**목표**: AWS 개발 환경 구축 및 테스트

#### Week 1: 기본 인프라

- [ ] AWS 계정 설정 및 IAM 구성
- [ ] Terraform 백엔드 (S3, DynamoDB) 생성
- [ ] VPC, Subnets, Security Groups 생성
- [ ] RDS PostgreSQL 배포 및 마이그레이션 테스트
- [ ] ElastiCache Redis 배포

#### Week 2: 컴퓨팅 및 스토리지

- [ ] S3 버킷 생성 및 MinIO 마이그레이션
- [ ] ECR 리포지토리 생성
- [ ] Dockerfile.prod 작성 (Frontend, Backend)
- [ ] Docker 이미지 빌드 및 ECR 푸시
- [ ] ECS 클러스터 및 태스크 정의 생성

#### Week 3: 로드 밸런싱 및 배포

- [ ] ALB 생성 및 타겟 그룹 설정
- [ ] Route 53 도메인 설정
- [ ] ACM SSL 인증서 발급
- [ ] ECS 서비스 배포 및 헬스 체크
- [ ] 통합 테스트 및 디버깅

**인프라**: AWS 개발 환경 (CI/CD 포함)
**예상 비용**: $138/월 (최적화 적용)

---

### Phase 3: 모니터링 및 자동화 (2주)

**목표**: CI/CD 파이프라인 및 모니터링 구축

#### Week 1: CI/CD

- [ ] CodePipeline 설정
- [ ] CodeBuild 프로젝트 생성 (buildspec.yml)
- [ ] GitHub 연동 (CodeStar Connection)
- [ ] 자동 배포 파이프라인 테스트
- [ ] 롤백 전략 수립

#### Week 2: 모니터링

- [ ] CloudWatch Logs 설정
- [ ] CloudWatch Metrics 대시보드 생성
- [ ] CloudWatch Alarms 설정
- [ ] SNS 알림 구성
- [ ] 로그 분석 및 성능 최적화

**인프라**: AWS 개발 환경 (모니터링 강화)
**예상 비용**: $140/월

---

### Phase 4: 최종 발표 준비 (3주)

**목표**: 프로덕션 수준 환경 및 데모 준비

#### Week 1: 프로덕션 환경 구축

- [ ] 프로덕션 Terraform 환경 설정
- [ ] Multi-AZ RDS 배포
- [ ] ElastiCache 클러스터 모드 활성화
- [ ] ECS Auto Scaling 설정
- [ ] CloudFront 배포 (선택사항)

#### Week 2: 보안 및 성능

- [ ] Secrets Manager 마이그레이션
- [ ] IAM 역할 최소 권한 원칙 적용
- [ ] Security Group 규칙 검토
- [ ] 부하 테스트 (Artillery, k6)
- [ ] 성능 튜닝 (쿼리 최적화, 캐싱)

#### Week 3: 최종 점검

- [ ] 전체 시스템 통합 테스트
- [ ] 재해 복구 계획 수립 및 테스트
- [ ] 비용 분석 및 알람 설정
- [ ] 최종 발표 데모 시나리오 작성
- [ ] 발표 자료 준비 (아키텍처 다이어그램, 비용 분석)

**인프라**: AWS 프로덕션 환경
**예상 비용**: $408/월 (최적화 적용)

---

### Phase 5: 발표 후 개선 (지속적)

**목표**: 실제 사용 피드백 기반 개선

- [ ] 사용자 피드백 수집
- [ ] 성능 모니터링 및 병목 지점 개선
- [ ] 비용 최적화 지속 적용
- [ ] 보안 감사 및 취약점 패치
- [ ] 추가 기능 개발

---

## 주요 참고사항

### 1. AWS 리전 선택

- **서울 (ap-northeast-2)**: 가장 낮은 레이턴시
- **도쿄 (ap-northeast-1)**: 더 많은 서비스, 약간 저렴
- **오레곤 (us-west-2)**: 가장 저렴, 높은 레이턴시

**권장**: 서울 리전 (사용자 경험 우선)

### 2. 데이터베이스 백업 전략

- **자동 백업**: 매일 오전 3시 (KST)
- **수동 스냅샷**: 주요 배포 전
- **Point-in-Time Recovery**: 최대 7일
- **Cross-Region Backup**: 재해 복구 필요 시

### 3. 보안 체크리스트

- [ ] 모든 시크릿은 Secrets Manager 사용
- [ ] 환경 변수에 민감 정보 포함 금지
- [ ] RDS는 Public Access Disabled
- [ ] S3 버킷은 Block Public Access 활성화
- [ ] CloudTrail 활성화 (감사 로그)
- [ ] GuardDuty 활성화 (위협 탐지)
- [ ] Security Groups는 최소 권한 원칙

### 4. 성능 최적화 팁

- **Connection Pooling**: TypeORM에서 적절한 pool size 설정
- **Redis 캐싱**: 자주 조회되는 데이터는 TTL 설정하여 캐싱
- **CDN 활용**: 정적 자산은 CloudFront로 제공
- **이미지 최적화**: S3에 업로드 전 압축 (Sharp, ImageMagick)
- **Lazy Loading**: 프론트엔드 코드 스플리팅

### 5. 모니터링 지표

**핵심 지표** (Golden Signals):

- **Latency**: P50, P95, P99 응답 시간
- **Traffic**: 초당 요청 수 (RPS)
- **Errors**: 5xx 에러율
- **Saturation**: CPU, Memory, Disk 사용률

### 6. 롤백 전략

- **Blue/Green 배포**: 새 버전 배포 후 문제 발생 시 즉시 전환
- **Canary 배포**: 일부 트래픽만 새 버전으로 라우팅
- **Database 마이그레이션**: 항상 후방 호환성 유지
- **Rollback Script**: 자동화된 롤백 스크립트 준비

### 7. 재해 복구 (DR)

- **RTO (Recovery Time Objective)**: 1시간
- **RPO (Recovery Point Objective)**: 24시간
- **Multi-AZ**: 자동 장애 조치
- **Cross-Region Replica**: 필요 시 다른 리전으로 복구

### 8. Terraform 베스트 프랙티스

- **State Locking**: DynamoDB로 동시 실행 방지
- **모듈 버전 관리**: 모듈은 Git 태그로 버전 관리
- **환경 분리**: dev/staging/prod 완전 격리
- **Sensitive 값 처리**: terraform.tfvars는 Git ignore
- **Plan 검토**: 항상 `terraform plan` 후 `apply`

### 9. 비용 알람 설정

```bash
# AWS Budgets 설정
aws budgets create-budget \
  --account-id 123456789012 \
  --budget file://budget.json \
  --notifications-with-subscribers file://notifications.json
```

**알람 조건**:

- 예상 비용이 예산의 80% 도달 시 이메일
- 실제 비용이 예산 초과 시 긴급 알림

### 10. 문서화

- **Architecture Decision Records (ADR)**: 주요 기술 결정 문서화
- **Runbook**: 장애 대응 매뉴얼
- **API 문서**: Swagger/OpenAPI로 자동 생성
- **인프라 다이어그램**: draw.io, Lucidchart 활용

---

## 참고 자료

### AWS 공식 문서

- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [RDS PostgreSQL](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)
- [ElastiCache for Redis](https://docs.aws.amazon.com/AmazonElastiCache/latest/red-ug/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)

### 비용 계산 도구

- [AWS Pricing Calculator](https://calculator.aws/)
- [EC2 Instances Info](https://instances.vantage.sh/)
- [Fargate Pricing](https://aws.amazon.com/fargate/pricing/)

### 커뮤니티 리소스

- [r/aws](https://www.reddit.com/r/aws/)
- [AWS re:Post](https://repost.aws/)
- [Terraform AWS Modules](https://github.com/terraform-aws-modules)

---

## 변경 이력

| 날짜       | 버전  | 변경 내용                        | 작성자 |
| ---------- | ----- | -------------------------------- | ------ |
| 2025-10-22 | 1.0.0 | 초안 작성 (AWS 인프라 구성 문서) | Claude |

---

**면책 조항**: 본 문서의 예상 비용은 2025년 1월 기준 AWS 공식 요금을 바탕으로 산정되었으며, 실제 비용은 사용량, 리전, 프로모션 등에 따라 달라질 수 있습니다. 정확한 비용은 [AWS Pricing Calculator](https://calculator.aws/)를 통해 확인하시기 바랍니다.
