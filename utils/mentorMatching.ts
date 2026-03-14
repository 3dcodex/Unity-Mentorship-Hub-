import { UserProfile } from '../types';

export interface FocusAreaDefinition {
  label: string;
  aliases: string[];
}

export const CURRENT_MENTOR_APPLICATION_VERSION = 2;

export interface MentorMatchProfile extends Partial<UserProfile> {
  id: string;
  mentorPreferredTopics?: string;
}

export interface MentorMatchInsights {
  matchScore: number;
  matchedFocusAreas: string[];
  matchReasons: string[];
  matchStrength: 'strong' | 'good' | 'potential';
}

export const FOCUS_AREA_DEFINITIONS: FocusAreaDefinition[] = [
  {
    label: 'Academic Excellence',
    aliases: ['academic excellence', 'academic', 'study skills', 'research', 'university', 'college success', 'coursework'],
  },
  {
    label: 'Career Transition',
    aliases: ['career transition', 'career change', 'job search', 'employability', 'interview prep', 'resume', 'cv', 'linkedin'],
  },
  {
    label: 'Mental Health',
    aliases: ['mental health', 'wellbeing', 'wellness', 'burnout', 'stress', 'resilience', 'work life balance'],
  },
  {
    label: 'First-Gen Experience',
    aliases: ['first-gen experience', 'first generation', 'first-gen', 'family expectations', 'navigating college', 'belonging'],
  },
  {
    label: 'STEM Careers',
    aliases: ['stem careers', 'stem', 'technology', 'engineering', 'science', 'math', 'mathematics', 'computer science', 'software'],
  },
  {
    label: 'Entrepreneurship',
    aliases: ['entrepreneurship', 'startup', 'founder', 'business', 'innovation', 'product building'],
  },
  {
    label: 'Cultural Exchange',
    aliases: ['cultural exchange', 'international', 'multicultural', 'global', 'migration', 'cross-cultural'],
  },
  {
    label: 'Leadership Skills',
    aliases: ['leadership skills', 'leadership', 'management', 'team leadership', 'communication', 'public speaking'],
  },
  {
    label: 'Social Inclusion',
    aliases: ['social inclusion', 'inclusion', 'diversity', 'equity', 'accessibility', 'community advocacy'],
  },
];

export const FOCUS_AREA_LABELS = FOCUS_AREA_DEFINITIONS.map(area => area.label);

const normalizeValue = (value: string): string => value.trim().toLowerCase();

const splitListValue = (value?: string | string[]): string[] => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap(item => splitListValue(item));
  }

  return value
    .split(/[\n,;]+/)
    .map(item => item.trim())
    .filter(Boolean);
};

export const normalizeFocusArea = (value: string): string | null => {
  const normalizedValue = normalizeValue(value);

  for (const definition of FOCUS_AREA_DEFINITIONS) {
    const aliases = [definition.label, ...definition.aliases].map(normalizeValue);
    if (aliases.some(alias => normalizedValue === alias || normalizedValue.includes(alias) || alias.includes(normalizedValue))) {
      return definition.label;
    }
  }

  return null;
};

export const extractMentorFocusAreas = (mentor: MentorMatchProfile): string[] => {
  const candidateValues = [
    ...splitListValue(mentor.mentorTags),
    ...splitListValue(mentor.mentorPreferredTopics),
    ...splitListValue(mentor.mentorExpertise),
    ...splitListValue(mentor.interests),
    ...splitListValue(mentor.skills),
  ];

  const derivedAreas = new Set<string>();
  const searchText = [mentor.mentorBio, mentor.bio, mentor.mentorExpertise, mentor.mentorPreferredTopics]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  candidateValues.forEach(value => {
    const normalizedArea = normalizeFocusArea(value);
    if (normalizedArea) {
      derivedAreas.add(normalizedArea);
    }
  });

  FOCUS_AREA_DEFINITIONS.forEach(definition => {
    if (definition.aliases.some(alias => searchText.includes(alias))) {
      derivedAreas.add(definition.label);
    }
  });

  return Array.from(derivedAreas);
};

export const scoreMentorAgainstFocusAreas = (
  mentor: MentorMatchProfile,
  selectedFocusAreas: string[]
): MentorMatchInsights => {
  const selectedAreas = selectedFocusAreas
    .map(area => normalizeFocusArea(area) || area)
    .filter((area, index, allAreas) => allAreas.indexOf(area) === index);

  const mentorAreas = extractMentorFocusAreas(mentor);
  const mentorAreaSet = new Set(mentorAreas);
  const searchText = [
    mentor.mentorExpertise,
    mentor.mentorBio,
    mentor.bio,
    mentor.mentorPreferredTopics,
    ...(mentor.interests || []),
    ...(mentor.skills || []),
    ...(mentor.mentorTags || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  let matchScore = 0;
  const matchedFocusAreas = new Set<string>();
  const matchReasons: string[] = [];

  selectedAreas.forEach(selectedArea => {
    const definition = FOCUS_AREA_DEFINITIONS.find(area => area.label === selectedArea);
    if (!definition) {
      return;
    }

    if (mentorAreaSet.has(selectedArea)) {
      matchScore += 35;
      matchedFocusAreas.add(selectedArea);
      matchReasons.push(`Strong alignment in ${selectedArea}`);
      return;
    }

    if (definition.aliases.some(alias => searchText.includes(alias))) {
      matchScore += 18;
      matchedFocusAreas.add(selectedArea);
      matchReasons.push(`Relevant experience related to ${selectedArea}`);
    }
  });

  if (mentor.mentorBio) {
    matchScore += 4;
  }

  if (mentor.mentorExpertise) {
    matchScore += 4;
  }

  if ((mentor.mentorTags || []).length > 0) {
    matchScore += 3;
  }

  const matchStrength = matchScore >= 70 ? 'strong' : matchScore >= 35 ? 'good' : 'potential';

  return {
    matchScore,
    matchedFocusAreas: Array.from(matchedFocusAreas),
    matchReasons: matchReasons.slice(0, 2),
    matchStrength,
  };
};