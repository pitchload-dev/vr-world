export const followUpDays = ['Event day 1', 'Event day 2'];
export const followUpSlots = [
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '14:00',
  '14:30',
];
export type FollowUpInput = {
  submissionId: string;
  startupId: number;
  day?: number | null;
  slot?: string | null;
  name: string;
  email: string;
  source: 'desktop' | 'vr';
};
export type FollowUpRow = Omit<FollowUpInput, 'submissionId'> & {
  id: string;
  startup: string;
  createdAt: string;
};

export function validFollowUpContact(name: string, email: string) {
  return (
    name.length <= 120 &&
    !/[\u0000-\u001f\u007f]/.test(name) &&
    email.length <= 254 &&
    (email.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
  );
}
