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
  likes?: Types.ObjectId[];

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Thread' }],
    default: [],
  })
  comments?: Types.ObjectId[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Thread', default: null })
  parentId?: Types.ObjectId | null;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Community' })
  community?: Types.ObjectId | null;
}

export const ThreadSchema = SchemaFactory.createForClass(Thread);

ThreadSchema.pre(
  'findOneAndDelete',
  async function (this: mongoose.Query<any, Thread>) {
    try {
      const threadId = this.getQuery()._id;

      if (!threadId) return;

      // الحل الصحيح: استخدم this.model بدل mongoose.model
      await this.model.deleteMany({
        parentId: threadId,
      });

      console.log(`Pre-hook: Deleted all replies for thread ${threadId}`);
    } catch (error) {
      console.error('Error in pre-delete hook:', error);
      throw error;
    }
  },
);
