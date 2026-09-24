import { SegmentRepositoryImpl, CustomerProfileRepositoryImpl, SegmentMembershipRepositoryImpl } from '../../infrastructure';
import { CreateSegmentUseCase } from './CreateSegment';
import { UpdateSegmentUseCase } from './UpdateSegment';
import { DeleteSegmentUseCase } from './DeleteSegment';
import { GetSegmentUseCase } from './GetSegment';
import { ListSegmentsUseCase } from './ListSegments';
import { GetCustomerProfileUseCase } from './GetCustomerProfile';
import { ListCustomerProfilesUseCase } from './ListCustomerProfiles';
import { ComputeCustomerProfileUseCase } from './ComputeCustomerProfile';
import { RecomputeAllProfilesUseCase } from './RecomputeAllProfiles';
import { EvaluateSegmentUseCase } from './EvaluateSegment';
import { GetSegmentMembersUseCase } from './GetSegmentMembers';
import { GetCustomerSegmentsUseCase } from './GetCustomerSegments';

const segmentRepo = new SegmentRepositoryImpl();
const profileRepo = new CustomerProfileRepositoryImpl();
const membershipRepo = new SegmentMembershipRepositoryImpl();

export const createSegmentUseCase = new CreateSegmentUseCase(segmentRepo);
export const updateSegmentUseCase = new UpdateSegmentUseCase(segmentRepo);
export const deleteSegmentUseCase = new DeleteSegmentUseCase(segmentRepo);
export const getSegmentUseCase = new GetSegmentUseCase(segmentRepo);
export const listSegmentsUseCase = new ListSegmentsUseCase(segmentRepo);

export const getCustomerProfileUseCase = new GetCustomerProfileUseCase(profileRepo);
export const listCustomerProfilesUseCase = new ListCustomerProfilesUseCase(profileRepo);
export const computeCustomerProfileUseCase = new ComputeCustomerProfileUseCase(profileRepo);
export const recomputeAllProfilesUseCase = new RecomputeAllProfilesUseCase(profileRepo);
export const evaluateSegmentUseCase = new EvaluateSegmentUseCase(segmentRepo, profileRepo, membershipRepo);
export const getSegmentMembersUseCase = new GetSegmentMembersUseCase(segmentRepo, profileRepo, membershipRepo);
export const getCustomerSegmentsUseCase = new GetCustomerSegmentsUseCase(membershipRepo);
