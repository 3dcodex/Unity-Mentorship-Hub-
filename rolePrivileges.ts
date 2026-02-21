// Role privilege and feature control for Unity Mentorship
import { Role } from './types';

export type Privilege =
  | 'requestMentorship'
  | 'joinCulturalGroups'
  | 'accessRelocationGuides'
  | 'priorityMatching'
  | 'askAnonymousQuestions'
  | 'accessVisaResources'
  | 'languageExchange'
  | 'viewSafeSpaceMentors'
  | 'offerPeerMentoring'
  | 'createCampusGroups'
  | 'hostLocalEvents'
  | 'moderateDiscussions'
  | 'createCareerPrograms'
  | 'postJobReferrals'
  | 'hostWebinars'
  | 'accessAlumniForum'
  | 'recommendInternships'
  | 'hostIndustryAMAs'
  | 'offerPaidMentorship'
  | 'createCompanyProfiles'
  | 'postInternships'
  | 'accessAnalytics'
  | 'verifyCompanyAffiliation';

export const rolePrivileges: Record<Role, Privilege[]> = {
  'International Student': [
    'requestMentorship',
    'joinCulturalGroups',
    'accessRelocationGuides',
    'priorityMatching',
    'askAnonymousQuestions',
    'accessVisaResources',
    'languageExchange',
    'viewSafeSpaceMentors',
  ],
  'Domestic Student': [
    'offerPeerMentoring',
    'createCampusGroups',
    'hostLocalEvents',
    'moderateDiscussions',
    'languageExchange',
  ],
  'Alumni': [
    'createCareerPrograms',
    'postJobReferrals',
    'hostWebinars',
    'accessAlumniForum',
    'recommendInternships',
  ],
  'Professional': [
    'hostIndustryAMAs',
    'offerPaidMentorship',
    'createCompanyProfiles',
    'postInternships',
    'accessAnalytics',
    'verifyCompanyAffiliation',
  ],
};

export function hasPrivilege(role: Role, privilege: Privilege): boolean {
  return rolePrivileges[role]?.includes(privilege) ?? false;
}