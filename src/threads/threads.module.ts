import { Module } from '@nestjs/common';
import { ThreadsController } from './threads.controller';
import { ThreadsService } from './threads.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Thread, ThreadSchema } from './schema/thread.schema';
import { UsersModule } from 'src/users/users.module';
import { AuthModule } from 'src/auth/auth.module';
import { CommunitiesModule } from 'src/communities/communities.module';
import { UploadModule } from 'src/upload/upload.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Thread.name, schema: ThreadSchema }]),
    UsersModule,
    AuthModule,
    CommunitiesModule,
    UploadModule,
  ],
  controllers: [ThreadsController],
  providers: [ThreadsService],
  exports: [ThreadsService],
})
export class ThreadsModule {}
