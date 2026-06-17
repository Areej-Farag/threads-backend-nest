// backend/src/auth/auth.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { UploadModule } from 'src/upload/upload.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    PassportModule,
    ConfigModule,
    UploadModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, JwtStrategy],
  exports: [AuthService, AuthGuard, JwtModule],
})
export class AuthModule {}
