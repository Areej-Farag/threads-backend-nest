import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './types';
import * as bcrypt from 'bcrypt';
import { UserDocument } from 'src/users/schema/user.schema';
import { RegisterDto } from './dto/register.dto';
import { UploadService } from 'src/upload/upload.service';
import { Types } from 'mongoose';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private uploadService: UploadService,
  ) {}

  async register(registerDto: RegisterDto, file?: Express.Multer.File) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    if (registerDto.password !== registerDto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    let profilePictureId: Types.ObjectId | null = null;

    if (file) {
      const profilePic = await this.uploadService.uploadSingle(file, 'profile');
      profilePictureId = profilePic._id;
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const newUser = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
      profilePicture: profilePictureId ?? null, // ممكن يكون null
    });

    const payload: JwtPayload = {
      email: newUser.email,
      sub: newUser._id.toString(),
      username: newUser.username,
      name: newUser.name,
    };

    const access_token = await this.jwtService.signAsync(payload);

    return {
      access_token,
      user: {
        email: newUser.email,
        username: newUser.username,
        name: newUser.name,
        _id: newUser._id,
        profilePicture: newUser.profilePicture, // اختياري
      },
    };
  }
  async signIn(loginDto: LoginDto) {
    if (!loginDto.email || !loginDto.password) {
      throw new BadRequestException('Email and password are required');
    }
    const user = (await this.usersService.findByEmail(
      loginDto.email,
    )) as UserDocument;
    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid credentials');
    }

    const payload: JwtPayload = {
      email: user.email,
      sub: user._id.toString(),
      username: user.username,
      name: user.name,
    };

    const access_token = await this.jwtService.signAsync(payload);
    return {
      access_token,
      user: {
        email: user.email,
        username: user.username,
        name: user.name,
        profilePicture: user.profilePicture,
        _id: user._id,
      },
    };
  }
}
