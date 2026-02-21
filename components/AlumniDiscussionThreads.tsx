import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../src/firebase';

interface Thread {
  id?: string;
  title: string;
  posts: { author: string; content: string }[];
}

const AlumniDiscussionThreads: React.FC = () => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [newPost, setNewPost] = useState('');
  const [author, setAuthor] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'alumniThreads'), (snapshot) => {
      const threadList: Thread[] = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Thread);
      setThreads(threadList);
    });
    return () => unsubscribe();
  }, []);

  const handleCreateThread = async () => {
    if (!newThreadTitle) return;
    await addDoc(collection(db, 'alumniThreads'), { title: newThreadTitle, posts: [] });
    setNewThreadTitle('');
  };

  const handleSelectThread = (thread: Thread) => {
    setSelectedThread(thread);
    setNewPost('');
    setAuthor('');
  };

  const handleAddPost = async () => {
    if (!newPost || !selectedThread || !selectedThread.id) return;
    const updatedPosts = [...selectedThread.posts, { author, content: newPost }];
    await updateDoc(doc(db, 'alumniThreads', selectedThread.id), { posts: updatedPosts });
    setNewPost('');
    setAuthor('');
  };

  return (
    <div className="bg-amber-100 border border-amber-200 rounded-xl p-4 mb-6">
      <h3 className="text-lg font-black mb-4">Alumni-only Discussion Threads</h3>
      <div className="mb-4">
        <input
          value={newThreadTitle}
          onChange={e => setNewThreadTitle(e.target.value)}
          placeholder="Thread Title"
          className="border rounded p-2 mr-2"
        />
        <button className="bg-amber-500 text-white font-black px-4 py-2 rounded" onClick={handleCreateThread}>Create Thread</button>
      </div>
      <ul className="space-y-2 mb-4">
        {threads.map((thread, idx) => (
          <li key={thread.id || idx} className="border rounded p-2 cursor-pointer" onClick={() => handleSelectThread(thread)}>
            <div className="font-black">{thread.title}</div>
            <div className="text-xs text-amber-700">{thread.posts.length} posts</div>
          </li>
        ))}
      </ul>
      {selectedThread && (
        <div className="bg-white border border-amber-200 rounded p-4 mb-4">
          <h4 className="font-black mb-2">{selectedThread.title}</h4>
          <ul className="space-y-2 mb-2">
            {selectedThread.posts.map((post, idx) => (
              <li key={idx} className="border rounded p-2">
                <div className="font-black text-xs">{post.author}</div>
                <div className="text-sm mt-1">{post.content}</div>
              </li>
            ))}
          </ul>
          <input
            value={author}
            onChange={e => setAuthor(e.target.value)}
            placeholder="Your Name"
            className="border rounded p-2 mb-2 w-full"
          />
          <textarea
            value={newPost}
            onChange={e => setNewPost(e.target.value)}
            placeholder="Write a post..."
            className="border rounded p-2 mb-2 w-full"
          />
          <button className="bg-amber-500 text-white font-black px-4 py-2 rounded" onClick={handleAddPost}>Add Post</button>
        </div>
      )}
    </div>
  );
};

export default AlumniDiscussionThreads;
