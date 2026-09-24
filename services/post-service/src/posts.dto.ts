import { Transform, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

const toNullableTrimmed = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() || null : value);

export class CreatePostDto {
  @IsOptional()
  @Transform(toNullableTrimmed)
  @IsString()
  @MaxLength(2200)
  caption?: string | null;

  @IsOptional()
  @Transform(toNullableTrimmed)
  @IsString()
  @MaxLength(100)
  location?: string | null;
}

export class CreateCommentDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'Comment cannot be empty' })
  @MaxLength(1000)
  text: string;
}

export class PageQuery {
  @IsOptional()
  @IsUUID()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 12;
}
