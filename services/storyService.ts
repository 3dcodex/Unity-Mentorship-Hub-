import { collection, addDoc, updateDoc, doc, getDoc, getDocs, query, where, orderBy, limit, increment, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { db } from '../src/firebase';
import { UserStory, StoryComment } from '../types/stories';

export const submitStory = async (
  userId: string,
  userName: string,
  userRole: string,
  userPhoto: string | undefined,
  title: string,
  story: string,
  category: 'academic' | 'career' | 'personal' | 'mentorship'
): Promise<string> => {
  const storyData = {
    userId,
    userName,
    userRole,
    userPhoto: userPhoto || '',
    title,
    story,
    category,
    likes: 0,
    likedBy: [],
    comments: [],
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'userStories'), storyData);
  return docRef.id;
};

export const getFeaturedStories = async (): Promise<UserStory[]> => {
  const q = query(
    collection(db, 'userStories'),
    where('status', '==', 'featured'),
    orderBy('likes', 'desc'),
    limit(3)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserStory));
};

export const getApprovedStories = async (): Promise<UserStory[]> => {
  const q = query(
    collection(db, 'userStories'),
    where('status', 'in', ['approved', 'featured']),
    orderBy('likes', 'desc'),
    limit(10)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserStory));
};

export const likeStory = async (storyId: string, userId: string): Promise<void> => {
  const storyRef = doc(db, 'userStories', storyId);
  const storyDoc = await getDoc(storyRef);
  
  if (storyDoc.exists()) {
    const likedBy = storyDoc.data().likedBy || [];
    if (likedBy.includes(userId)) {
      await updateDoc(storyRef, {
        likes: increment(-1),
        likedBy: arrayRemove(userId),
      });
    } else {
      await updateDoc(storyRef, {
        likes: increment(1),
        likedBy: arrayUnion(userId),
      });
    }
  }
};

export const addComment = async (
  storyId: string,
  userId: string,
  userName: string,
  userPhoto: string | undefined,
  text: string
): Promise<void> => {
  const comment: StoryComment = {
    id: Date.now().toString(),
    userId,
    userName,
    userPhoto: userPhoto || '',
    text,
    createdAt: serverTimestamp(),
  };

  const storyRef = doc(db, 'userStories', storyId);
  await updateDoc(storyRef, {
    comments: arrayUnion(comment),
    updatedAt: serverTimestamp(),
  });
};
