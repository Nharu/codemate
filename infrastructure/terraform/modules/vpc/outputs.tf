output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "VPC CIDR block"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_app_subnet_ids" {
  description = "List of private app subnet IDs"
  value       = aws_subnet.private_app[*].id
}

output "database_subnet_ids" {
  description = "List of database subnet IDs"
  value       = aws_subnet.private_db[*].id
}

output "nat_gateway_id" {
  description = "NAT Gateway ID"
  value       = var.enable_nat_gateway ? aws_nat_gateway.main[0].id : null
}
