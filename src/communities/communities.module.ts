import { Module } from '@nestjs/common';
import { CommunitiesController } from './communities.controller';
import { CommunitiesService } from './communities.service';
import { UsersModule } from 'src/users/users.module';
import { AuthModule } from 'src/auth/auth.module';
import { Community, CommunitySchema } from './schema/community.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Thread, ThreadSchema } from 'src/threads/schema/thread.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Community.name, schema: CommunitySchema },
      { name: Thread.name, schema: ThreadSchema },
    ]),
    UsersModule,
    AuthModule,
  ],
  controllers: [CommunitiesController],
  providers: [CommunitiesService],
  exports: [CommunitiesService],
})
export class CommunitiesModule {}
