variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "public_subnet_id" {
  description = "Public subnet ID for bastion host"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type for bastion host"
  type        = string
  default     = "t3.micro"
}

variable "key_name" {
  description = "Existing EC2 key pair name (optional)"
  type        = string
  default     = ""
}

variable "public_key" {
  description = "Public key for SSH access (required if key_name is empty)"
  type        = string
  default     = ""
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to SSH into bastion"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}
