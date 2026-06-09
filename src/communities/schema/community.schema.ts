import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Thread } from '../../threads/schema/thread.schema';
import { User } from 'src/users/schema/user.schema';
export type CommunityDocument = HydratedDocument<Community>;

@Schema({ timestamps: true })
export class Community {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  description?: string;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Thread' }] })
  threads?: Thread[];

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] })
  members?: User[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  creator!: User;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] })
  admins?: User[];
}

export const CommunitySchema = SchemaFactory.createForClass(Community);
