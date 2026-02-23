import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../src/firebase';

interface Review {
  id: string;
  mentorId: string;
  mentorName: string;
  studentId: string;
  studentName: string;
  rating: number;
  comment: string;
  createdAt: any;
}

const ReviewsManagement: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    const reviewsSnap = await getDocs(collection(db, 'reviews'));
    const reviewsData = reviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
    setReviews(reviewsData);
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    await deleteDoc(doc(db, 'reviews', reviewId));
    loadReviews();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-black text-gray-900 mb-8">Reviews & Ratings</h1>

        <div className="grid gap-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-bold text-gray-900">{review.studentName}</p>
                  <p className="text-sm text-gray-600">reviewed {review.mentorName}</p>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`material-symbols-outlined ${i < review.rating ? 'text-yellow-500' : 'text-gray-300'}`}>
                      star
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-gray-700 mb-4">{review.comment}</p>
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  {review.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                </p>
                <button
                  onClick={() => handleDeleteReview(review.id)}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-bold hover:bg-red-200"
                >
                  Delete Review
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReviewsManagement;
