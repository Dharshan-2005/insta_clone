import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class RegisterDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Enter a valid email address' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  @MaxLength(72)
  password: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @Matches(/^[a-z0-9._]{3,30}$/, {
    message: 'Username must be 3-30 characters using letters, numbers, dots or underscores',
  })
  username: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(60)
  name?: string;
}

export class LoginDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Enter your username or email' })
  login: string;

  @IsString()
  @IsNotEmpty({ message: 'Enter your password' })
  password: string;
}
