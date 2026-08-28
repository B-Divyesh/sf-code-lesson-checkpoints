export type Submission = {
  id: string;
  status: 'passed' | 'blocked';
  output: string;
  note: string;
  teacherReply?: string;
  createdAt: string;
  repliedAt?: string;
};

export type Checkpoint = {
  id: string;
  position: number;
  title: string;
  command: string;
  successHint?: string;
  submissions: Submission[];
};

export type Lesson = {
  id: string;
  title: string;
  learnerName?: string;
  shareCode: string;
  createdAt: string;
  checkpoints: Checkpoint[];
};
