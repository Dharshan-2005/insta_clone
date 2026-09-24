import { Transform } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

const USERNAME = /^[a-z0-9._]{3,30}$/;
const USERNAME_MESSAGE = 'Username must be 3-30 characters using letters, numbers, dots or underscores';

const toLowerTrimmed = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value);
const toNullableTrimmed = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() || null : value);

export class CreateProfileDto {
  @IsUUID()
  id: string;

  @Transform(toLowerTrimmed)
  @Matches(USERNAME, { message: USERNAME_MESSAGE })
  username: string;

  @IsOptional()
  @Transform(toNullableTrimmed)
  @IsString()
  @MaxLength(60)
  name?: string | null;
}

export class UpdateProfileDto {
  @IsOptional()
  @Transform(toLowerTrimmed)
  @Matches(USERNAME, { message: USERNAME_MESSAGE })
  username?: string;

  @IsOptional()
  @Transform(toNullableTrimmed)
  @IsString()
  @MaxLength(60)
  name?: string | null;

  @IsOptional()
  @Transform(toNullableTrimmed)
  @IsString()
  @MaxLength(150)
  bio?: string | null;

  @IsOptional()
  @Transform(toNullableTrimmed)
  @IsString()
  @MaxLength(60)
  subtitle?: string | null;
}

export class SearchQuery {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : ''))
  @IsString()
  @MaxLength(50)
  q: string = '';
}

export class IdsQuery {
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',').filter(Boolean) : value))
  @IsArray()
  @ArrayMaxSize(200)
  @IsUUID('all', { each: true })
  ids: string[];
}
