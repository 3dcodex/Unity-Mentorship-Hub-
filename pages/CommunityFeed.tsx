import React, { useState, useEffect } from 'react';
import { db } from '../src/firebase';
import { collection, getDocs, addDoc, Timestamp, doc, updateDoc, getDoc, query, orderBy, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';

const CommunityFeed: React.FC = () => {
  const [postText, setPostText] = useState('');
  const [commentText, setCommentText] = useState('');
  const { user } = useAuth();
  const [realPosts, setRealPosts] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadPosts();
  }, []);

  const handlePost = async () => {
    if (!postText.trim() || !user) return;
    
    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.data();
    
    await addDoc(collection(db, 'communityPosts'), {
      userId: user.uid,
      userName: userData?.name || user.displayName || user.email,
      userRole: userData?.role || 'Student',
      userPhoto: userData?.photoURL || user.photoURL || 'https://i.pravatar.cc/100',
      text: postText,
      createdAt: Timestamp.now(),
      likedBy: [],
    });
    setPostText('');
    loadPosts();
  };

  const loadPosts = async () => {
    const snapshot = await getDocs(query(collection(db, 'communityPosts'), orderBy('createdAt', 'desc')));
    const posts = await Promise.all(snapshot.docs.map(async (postDoc) => {
      const data = postDoc.data();
      const commentsSnapshot = await getDocs(collection(db, 'communityPosts', postDoc.id, 'comments'));
      const comments = commentsSnapshot.docs.map(c => ({ id: c.id, ...c.data() }));
      return {
        id: postDoc.id,
        ...data,
        comments,
      };
    }));
    setRealPosts(posts);
  };

  // Like/Unlike post
  const handleLike = async (postId: string) => {
    if (!user) return;
    const postDoc = doc(db, 'communityPosts', postId);
    const post = realPosts.find(p => p.id === postId);
    if (!post) return;
    
    const likedBy = post.likedBy || [];
    const hasLiked = likedBy.includes(user.uid);
    
    await updateDoc(postDoc, {
      likedBy: hasLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
    });
    loadPosts();
  };

  // Comment post
  const handleComment = async (postId: string) => {
    if (!commentText.trim() || !user) return;
    
    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.data();
    
    await addDoc(collection(db, 'communityPosts', postId, 'comments'), {
      userId: user.uid,
      userName: userData?.name || user.displayName || user.email,
      userPhoto: userData?.photoURL || user.photoURL || 'https://i.pravatar.cc/100',
      text: commentText,
      createdAt: Timestamp.now(),
    });
    setCommentText('');
    loadPosts();
  };

  return (
    <div className="max-w-2xl mx-auto py-10 space-y-6 sm:space-y-8 md:space-y-10 animate-in fade-in duration-700">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-xl sm:text-2xl md:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">Community Feed</h1>
        <button className="bg-primary text-white size-8 sm:size-7 sm:size-9 md:size-10 md:size-12 rounded-full flex items-center justify-center shadow-xl shadow-primary/20">
          <span className="material-symbols-outlined">add</span>
        </button>
      </header>

      {/* Share Box */}
      <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-[32px] p-4 sm:p-6 md:p-8 border border-gray-100 shadow-sm space-y-6">
        <div className="flex gap-4">
          <img src="https://i.pravatar.cc/100?u=me" className="size-8 sm:size-7 sm:size-9 md:size-10 md:size-12 rounded-xl object-cover" />
          <textarea 
            placeholder="Share an update or question with the community..." 
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            className="flex-1 bg-gray-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 resize-none min-h-[100px]"
          />
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-4">
            <button className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-base sm:text-lg">image</span>
              <span className="text-[10px] font-black uppercase tracking-widest">Photo</span>
            </button>
            <button className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-base sm:text-lg">link</span>
              <span className="text-[10px] font-black uppercase tracking-widest">Link</span>
            </button>
          </div>
          <button
            disabled={!postText.trim()}
            className="bg-primary text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/10 disabled:opacity-50 transition-all"
            onClick={handlePost}
          >
            Post
          </button>
        </div>
      </div>

      {/* Feed Posts */}
      <div className="space-y-4 sm:space-y-6 md:space-y-8">
        {realPosts.map(post => (
          <div key={post.id} className="bg-white rounded-xl sm:rounded-2xl md:rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img src={post.userPhoto} className="size-8 sm:size-7 sm:size-9 md:size-10 md:size-12 rounded-xl object-cover" />
                  <div>
                    <h3
                      className="text-sm font-black text-gray-900 leading-none cursor-pointer hover:text-primary"
                      onClick={() => navigate(`/profile-view/${post.userId}`)}
                    >{post.userName}</h3>
                    <p className="text-[10px] font-bold text-primary mt-1 uppercase tracking-widest">{post.userRole}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleString() : ''}</span>
              </div>
              <p className="text-sm text-gray-600 font-medium leading-relaxed">{post.text}</p>
              <div className="flex items-center gap-6 pt-2 border-t border-gray-50">
                <button
                  className={`flex items-center gap-2 transition-colors ${(post.likedBy || []).includes(user?.uid) ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                  onClick={() => handleLike(post.id)}
                >
                  <span className="material-symbols-outlined text-base sm:text-lg">{(post.likedBy || []).includes(user?.uid) ? 'favorite' : 'favorite_border'}</span>
                  <span className="text-xs font-black">{(post.likedBy || []).length}</span>
                </button>
                <button className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-base sm:text-lg">chat_bubble</span>
                  <span className="text-xs font-black">{Array.isArray(post.comments) ? post.comments.length : 0}</span>
                </button>
                <button className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors ml-auto">
                  <span className="material-symbols-outlined text-base sm:text-lg">share</span>
                </button>
              </div>
              
              {/* Comment input */}
              <div className="flex gap-2 pt-4 border-t border-gray-50">
                <input
                  type="text"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary/20"
                  onKeyPress={(e) => e.key === 'Enter' && handleComment(post.id)}
                />
                <button
                  className="bg-primary text-white px-6 py-2 rounded-xl font-black text-xs uppercase disabled:opacity-50"
                  onClick={() => handleComment(post.id)}
                  disabled={!commentText.trim()}
                >Post</button>
              </div>
              
              {/* Show comments */}
              {Array.isArray(post.comments) && post.comments.length > 0 && (
                <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
                  {post.comments.map((c: any) => (
                    <div key={c.id} className="flex gap-2 items-start">
                      <img src={c.userPhoto} className="size-6 rounded-lg object-cover" />
                      <div className="flex-1 bg-gray-50 rounded-xl p-3">
                        <span
                          className="font-black text-gray-900 text-xs cursor-pointer hover:text-primary"
                          onClick={() => navigate(`/profile-view/${c.userId}`)}
                        >{c.userName}</span>
                        <p className="text-xs text-gray-600 mt-1">{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommunityFeed;
