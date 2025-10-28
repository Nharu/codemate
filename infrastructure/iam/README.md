# Terraform IAM 사용자 설정 가이드

이 디렉토리에는 Terraform을 실행하기 위한 IAM 사용자 및 정책 설정이 포함되어 있습니다.

## IAM 사용자 생성

### 1. AWS Console에서 IAM 사용자 생성

1. AWS Console → IAM → Users → "Create user"
2. User name: `codemate-terraform`
3. "Programmatic access" 선택 (Access key 생성)

### 2. 정책 연결

정책이 두 개로 나뉘어져 있습니다 (IAM 정책 크기 제한 회피):
- `terraform-policy-infra.json`: 인프라 리소스 (VPC, ECR, RDS, ElastiCache, S3)
- `terraform-policy-services.json`: 서비스 리소스 (ELB, ECS, IAM, Route53, ACM, CloudWatch)

#### 옵션 A: AWS CLI로 인라인 정책 생성 (권장)

```bash
# 인프라 정책 추가
aws iam put-user-policy \
  --user-name codemate-terraform \
  --policy-name TerraformPolicyInfra \
  --policy-document file://infrastructure/iam/terraform-policy-infra.json \
  --profile codemate

# 서비스 정책 추가
aws iam put-user-policy \
  --user-name codemate-terraform \
  --policy-name TerraformPolicyServices \
  --policy-document file://infrastructure/iam/terraform-policy-services.json \
  --profile codemate
```

#### 옵션 B: AWS Console에서 인라인 정책 추가

1. IAM → Users → codemate-terraform → Permissions → Add inline policy
2. JSON 탭 선택
3. `terraform-policy-infra.json` 파일의 내용을 복사하여 붙여넣기
4. 정책 이름: `TerraformPolicyInfra`
5. 정책 생성
6. 같은 방식으로 `terraform-policy-services.json` 추가 (정책 이름: `TerraformPolicyServices`)

### 3. Access Key 생성 및 저장

1. IAM → Users → codemate-terraform → Security credentials
2. "Create access key" 클릭
3. Use case: "Command Line Interface (CLI)"
4. Access Key ID와 Secret Access Key를 안전하게 저장

### 4. AWS CLI 설정

```bash
# AWS CLI 프로파일 설정
aws configure --profile codemate

# 입력 정보:
# AWS Access Key ID: [생성한 Access Key ID]
# AWS Secret Access Key: [생성한 Secret Access Key]
# Default region name: ap-northeast-2
# Default output format: json
```

### 5. Terraform에서 사용

#### 옵션 A: 환경 변수 사용

```bash
export AWS_PROFILE=codemate
```

#### 옵션 B: Provider 블록에서 직접 지정

```hcl
provider "aws" {
  region  = "ap-northeast-2"
  profile = "codemate"
}
```

## 정책에 포함된 권한

### 필수 AWS 서비스
- **EC2**: VPC, 서브넷, 보안 그룹, NAT Gateway, Internet Gateway
- **ECR**: Docker 이미지 저장소
- **RDS**: PostgreSQL 데이터베이스
- **ElastiCache**: Redis 캐시
- **S3**: 파일 저장소
- **ELB**: Application Load Balancer
- **ECS**: Fargate 컨테이너 오케스트레이션
- **IAM**: ECS 태스크 실행 역할
- **Route 53**: DNS 관리
- **ACM**: SSL/TLS 인증서
- **CloudWatch**: 모니터링 및 로깅

### 권한 범위
- **읽기**: 모든 리소스의 Describe/List/Get 작업
- **쓰기**: 리소스 생성, 수정, 삭제
- **태그**: 리소스 태그 관리

## 보안 권장사항

### 1. MFA 활성화 (선택사항)

추가 보안을 위해 MFA를 활성화할 수 있습니다:

```bash
# MFA 디바이스 활성화 후
aws configure set mfa_serial arn:aws:iam::ACCOUNT_ID:mfa/codemate-terraform --profile codemate
```

### 2. Access Key 회전

정기적으로 Access Key를 교체하세요:

```bash
# 새 Access Key 생성
aws iam create-access-key --user-name codemate-terraform

# 기존 Access Key 비활성화
aws iam update-access-key \
  --user-name codemate-terraform \
  --access-key-id OLD_ACCESS_KEY_ID \
  --status Inactive

# 확인 후 기존 키 삭제
aws iam delete-access-key \
  --user-name codemate-terraform \
  --access-key-id OLD_ACCESS_KEY_ID
```

### 3. Least Privilege 원칙

이 정책은 Terraform 실행에 필요한 최소 권한만 포함합니다. 추가 권한이 필요한 경우:

1. 구체적인 작업에 대해서만 권한 추가
2. 가능한 경우 Resource ARN으로 범위 제한
3. Condition을 사용하여 추가 제약 설정

## 문제 해결

### Terraform 실행 시 권한 오류

```
Error: creating ... AccessDeniedException
```

**해결 방법**:
1. 해당 작업에 필요한 권한 확인
2. 권한을 해당 정책 파일에 추가 (인프라 관련이면 `terraform-policy-infra.json`, 서비스 관련이면 `terraform-policy-services.json`)
3. 정책 업데이트:
   ```bash
   # 인프라 정책 업데이트
   aws iam put-user-policy \
     --user-name codemate-terraform \
     --policy-name TerraformPolicyInfra \
     --policy-document file://infrastructure/iam/terraform-policy-infra.json \
     --profile codemate

   # 또는 서비스 정책 업데이트
   aws iam put-user-policy \
     --user-name codemate-terraform \
     --policy-name TerraformPolicyServices \
     --policy-document file://infrastructure/iam/terraform-policy-services.json \
     --profile codemate
   ```

### Access Key 분실

1. IAM Console에서 새 Access Key 생성
2. `~/.aws/credentials` 파일 업데이트
3. 기존 Access Key 삭제

## Terraform State 저장소 (선택사항)

프로덕션 환경에서는 Terraform State를 S3에 저장하는 것을 권장합니다:

### S3 백엔드용 추가 권한

이미 `terraform-policy.json`에 S3 권한이 포함되어 있어 별도 추가 불필요합니다.

### State 저장용 S3 버킷 생성

```bash
# S3 버킷 생성
aws s3api create-bucket \
  --bucket codemate-terraform-state-dev \
  --region ap-northeast-2 \
  --create-bucket-configuration LocationConstraint=ap-northeast-2

# 버전 관리 활성화
aws s3api put-bucket-versioning \
  --bucket codemate-terraform-state-dev \
  --versioning-configuration Status=Enabled

# DynamoDB 테이블 생성 (State Lock용)
aws dynamodb create-table \
  --table-name codemate-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ap-northeast-2
```

그 후 `versions.tf`에서 backend 블록 주석 해제하여 사용할 수 있습니다.
