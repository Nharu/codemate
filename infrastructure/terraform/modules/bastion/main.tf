# ==================================
# Security Group for Bastion Host
# ==================================
resource "aws_security_group" "bastion" {
  name        = "${var.project_name}-${var.environment}-bastion-sg"
  description = "Security group for bastion host"
  vpc_id      = var.vpc_id

  ingress {
    description = "SSH from allowed IPs"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-bastion-sg"
  }
}

# ==================================
# Get Latest Amazon Linux 2023 AMI
# ==================================
data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ==================================
# EC2 Key Pair (if not exists)
# ==================================
resource "aws_key_pair" "bastion" {
  count      = var.key_name == "" ? 1 : 0
  key_name   = "${var.project_name}-${var.environment}-bastion-key"
  public_key = var.public_key

  tags = {
    Name = "${var.project_name}-${var.environment}-bastion-key"
  }
}

# ==================================
# Bastion Host EC2 Instance
# ==================================
resource "aws_instance" "bastion" {
  ami           = data.aws_ami.amazon_linux_2023.id
  instance_type = var.instance_type

  subnet_id                   = var.public_subnet_id
  vpc_security_group_ids      = [aws_security_group.bastion.id]
  associate_public_ip_address = true

  key_name = var.key_name != "" ? var.key_name : aws_key_pair.bastion[0].key_name

  user_data = <<-EOF
              #!/bin/bash
              # Update system
              yum update -y

              # Install PostgreSQL client
              yum install -y postgresql15

              # Install useful tools
              yum install -y vim curl wget
              EOF

  tags = {
    Name = "${var.project_name}-${var.environment}-bastion"
  }
}
