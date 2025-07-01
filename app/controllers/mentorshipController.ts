
// app/controllers/mentorshipController.ts
import { MentorshipRequestModel, SessionModel, AvailabilityModel } from '~/models/user';

export async function createMentorshipRequest(menteeId: string, mentorId: string) {
  if (!menteeId || !mentorId) {
    throw new Error('Mentee and mentor IDs are required');
  }
  return MentorshipRequestModel.create({ menteeId, mentorId });
}

export async function getMentorsBySkills(skills: string[]) {
  return UserModel.find({ role: 'MENTOR', skills: { $in: skills } }).lean();
}

export async function getMentorshipRequestsByMentee(menteeId: string) {
  return MentorshipRequestModel.find({ menteeId }).lean();
}

export async function getMentorshipRequestsByMentor(mentorId: string) {
  return MentorshipRequestModel.find({ mentorId }).lean();
}

export async function updateMentorshipRequest(id: string, status: 'ACCEPTED' | 'REJECTED') {
  if (!['ACCEPTED', 'REJECTED'].includes(status)) {
    throw new Error('Invalid status');
  }
  return MentorshipRequestModel.findByIdAndUpdate(id, { $set: { status } }, { new: true }).lean();
}

export async function getAllMentorshipMatches() {
  return MentorshipRequestModel.find({ status: 'ACCEPTED' }).lean();
}