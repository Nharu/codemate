import {
    IsArray,
    IsString,
    IsOptional,
    IsBoolean,
    IsNumber,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class IdeSessionTabDto {
    @IsString()
    id: string;

    @IsString()
    name: string;

    @IsString()
    path: string;

    @IsOptional()
    @IsString()
    language?: string;

    @IsOptional()
    @IsBoolean()
    isNew?: boolean;
}

export interface IdeSessionTab {
    id: string;
    name: string;
    path: string;
    language?: string;
    isNew?: boolean;
}

export interface IdeSessionState {
    openTabs: IdeSessionTab[];
    activeTabId: string | null;
    sidebarCollapsed: boolean;
    sidebarWidth: number;
}

export class UpdateIdeSessionDto implements IdeSessionState {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => IdeSessionTabDto)
    openTabs: IdeSessionTabDto[];

    @IsOptional()
    @IsString()
    activeTabId: string | null;

    @IsBoolean()
    sidebarCollapsed: boolean;

    @IsNumber()
    sidebarWidth: number;
}
