import { ApiProperty } from '@nestjs/swagger';

export class UploadZipDto {
    @ApiProperty({
        type: 'string',
        format: 'binary',
        description: 'ZIP file containing project files',
    })
    file: Express.Multer.File;
}
