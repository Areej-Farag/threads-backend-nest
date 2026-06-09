import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ required: true, unique: true })
  username!: string;

  @Prop()
  name?: string;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Community' }],
    default: [],
  })
  communities?: Types.ObjectId[];

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Thread' }],
    default: [],
  })
  threads?: Types.ObjectId[];

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Thread' }],
    default: [],
  })
  likedThreads?: Types.ObjectId[];

  @Prop()
  profilePicture?: string;

  @Prop()
  bio?: string;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    default: [],
  })
  followers?: Types.ObjectId[];

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    default: [],
  })
  following?: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);
