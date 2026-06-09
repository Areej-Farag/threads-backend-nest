// backend/src/threads/schema/thread.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type ThreadDocument = HydratedDocument<Thread>;

@Schema({ timestamps: true })
export class Thread {
  @Prop({ required: true })
  text!: string;

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  author!: Types.ObjectId;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    default: [],
  })
  likes!: Types.ObjectId[];

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Thread' }],
    default: [],
  })
  comments!: Types.ObjectId[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Thread' })
  parentId?: Types.ObjectId | null;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Community' })
  community?: Types.ObjectId | null;
}

export const ThreadSchema = SchemaFactory.createForClass(Thread);
