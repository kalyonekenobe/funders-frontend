import { minLength, object, pipe, string, trim } from 'valibot';

export const CreatePostCommentSchema = object({
  comment: pipe(string('Comment cannot be empty'), trim(), minLength(1, 'Comment cannot be empty')),
});

export const UpdatePostCommentSchema = object({
  comment: pipe(string('Comment cannot be empty'), trim(), minLength(1, 'Comment cannot be empty')),
});
