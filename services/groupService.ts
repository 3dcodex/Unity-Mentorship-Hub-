import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, Timestamp, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '../src/firebase';

export interface Group {
  id?: string;
  name: string;
  description: string;
  category: 'Cultural' | 'Campus' | 'Career' | 'Study' | 'Mentorship' | 'Event' | 'Company';
  visibility: 'Public' | 'Private' | 'Invite Only';
  profilePic: string;
  createdBy: string;
  creatorName: string;
  creatorRole: string;
  members: string[];
  moderators: string[];
  memberCount: number;
  rules?: string;
  tags?: string[];
  location?: string;
  allowedRoles?: string[];
  createdAt: Timestamp;
  lastActivity?: Timestamp;
}

export interface GroupPost {
  id?: string;
  groupId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  isAnonymous: boolean;
  isPinned: boolean;
  createdAt: Timestamp;
  likes: string[];
  commentCount: number;
}

export const createGroup = async (groupData: Omit<Group, 'id' | 'createdAt' | 'memberCount' | 'lastActivity'>) => {
  const docRef = await addDoc(collection(db, 'groups'), {
    ...groupData,
    memberCount: groupData.members.length,
    moderators: groupData.moderators || [groupData.createdBy],
    createdAt: Timestamp.now(),
    lastActivity: Timestamp.now(),
  });
  return docRef.id;
};

export const getAllGroups = async (): Promise<Group[]> => {
  const q = query(collection(db, 'groups'), orderBy('lastActivity', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
};

export const getGroupsByCategory = async (category: string): Promise<Group[]> => {
  const q = query(collection(db, 'groups'), where('category', '==', category), orderBy('lastActivity', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
};

export const getUserGroups = async (userId: string): Promise<Group[]> => {
  const q = query(collection(db, 'groups'), where('members', 'array-contains', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
};

export const joinGroup = async (groupId: string, userId: string) => {
  const groupRef = doc(db, 'groups', groupId);
  const groupSnap = await getDoc(groupRef);
  const groupData = groupSnap.data() as Group;
  
  if (groupData && !groupData.members.includes(userId)) {
    await updateDoc(groupRef, {
      members: arrayUnion(userId),
      memberCount: groupData.members.length + 1,
      lastActivity: Timestamp.now(),
    });
  }
};

export const leaveGroup = async (groupId: string, userId: string) => {
  const groupRef = doc(db, 'groups', groupId);
  const groupSnap = await getDoc(groupRef);
  const groupData = groupSnap.data() as Group;
  
  if (groupData) {
    await updateDoc(groupRef, {
      members: arrayRemove(userId),
      memberCount: Math.max(0, groupData.members.length - 1),
      lastActivity: Timestamp.now(),
    });
  }
};

export const createGroupPost = async (postData: Omit<GroupPost, 'id' | 'createdAt' | 'likes' | 'commentCount'>) => {
  const docRef = await addDoc(collection(db, 'groups', postData.groupId, 'posts'), {
    ...postData,
    likes: [],
    commentCount: 0,
    createdAt: Timestamp.now(),
  });
  
  await updateDoc(doc(db, 'groups', postData.groupId), {
    lastActivity: Timestamp.now(),
  });
  
  return docRef.id;
};

export const deleteGroup = async (groupId: string) => {
  await deleteDoc(doc(db, 'groups', groupId));
};

export const removeMember = async (groupId: string, userId: string) => {
  const groupRef = doc(db, 'groups', groupId);
  const groupSnap = await getDoc(groupRef);
  const groupData = groupSnap.data() as Group;
  
  if (groupData) {
    await updateDoc(groupRef, {
      members: arrayRemove(userId),
      moderators: arrayRemove(userId),
      memberCount: Math.max(0, groupData.members.length - 1),
    });
  }
};

export const addModerator = async (groupId: string, userId: string) => {
  await updateDoc(doc(db, 'groups', groupId), {
    moderators: arrayUnion(userId),
  });
};

export const removeModerator = async (groupId: string, userId: string) => {
  await updateDoc(doc(db, 'groups', groupId), {
    moderators: arrayRemove(userId),
  });
};

export const updateGroup = async (groupId: string, data: Partial<Group>) => {
  await updateDoc(doc(db, 'groups', groupId), data);
};

export const deletePost = async (groupId: string, postId: string) => {
  await deleteDoc(doc(db, 'groups', groupId, 'posts', postId));
};
