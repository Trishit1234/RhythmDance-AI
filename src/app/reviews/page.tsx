"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { Star, Send, MessageCircle, Sparkles } from "lucide-react";

import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { app } from "@/lib/firebase";

interface Review {
  id: string;
  name: string;
  coachingRating: number;
  websiteRating: number;
  comment: string;
  createdAt?: unknown;
}

const LOCAL_STORAGE_KEY = "rhythm_reviews_v1";

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          aria-label={`${star} star`}
          className="transition-transform hover:scale-110"
        >
          <Star
            size={28}
            fill={star <= value ? "#D49A3A" : "none"}
            strokeWidth={1.8}
            className={
              star <= value ? "text-[#D49A3A]" : "text-[#B8A995]"
            }
          />
        </button>
      ))}
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={17}
          fill={star <= rating ? "#D49A3A" : "none"}
          className={
            star <= rating ? "text-[#D49A3A]" : "text-[#C9BBA8]"
          }
        />
      ))}
    </div>
  );
}

function getLocalReviews(): Review[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalReviews(reviews: Review[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reviews));
  } catch {
    // Ignore localStorage errors.
  }
}

export default function ReviewsPage() {
  const { user } = useAuth();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [coachingRating, setCoachingRating] = useState(0);
  const [websiteRating, setWebsiteRating] = useState(0);
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const localReviews = getLocalReviews();

    if (localReviews.length > 0) {
      setReviews(localReviews);
    }

    try {
      const db = getFirestore(app);

      const reviewsQuery = query(
        collection(db, "reviews"),
        orderBy("createdAt", "desc")
      );

      const unsubscribe = onSnapshot(
        reviewsQuery,
        (snapshot) => {
          const firestoreReviews: Review[] = snapshot.docs.map((doc) => {
            const data = doc.data();

            return {
              id: doc.id,
              name: typeof data.name === "string" ? data.name : "Anonymous",
              coachingRating:
                typeof data.coachingRating === "number"
                  ? data.coachingRating
                  : 0,
              websiteRating:
                typeof data.websiteRating === "number"
                  ? data.websiteRating
                  : 0,
              comment:
                typeof data.comment === "string" ? data.comment : "",
              createdAt: data.createdAt,
            };
          });

          setReviews(firestoreReviews);
        },
        () => {
          // Firestore unavailable/restricted.
          // Local reviews remain available.
        }
      );

      return () => unsubscribe();
    } catch {
      // Firebase unavailable.
    }
  }, []);

  const averageCoaching = useMemo(() => {
    if (!reviews.length) return 0;

    return (
      reviews.reduce((sum, review) => sum + review.coachingRating, 0) /
      reviews.length
    );
  }, [reviews]);

  const averageWebsite = useMemo(() => {
    if (!reviews.length) return 0;

    return (
      reviews.reduce((sum, review) => sum + review.websiteRating, 0) /
      reviews.length
    );
  }, [reviews]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    if (!name.trim()) {
      setMessage("Please enter your name.");
      return;
    }

    if (!coachingRating || !websiteRating) {
      setMessage("Please give both ratings.");
      return;
    }

    if (!comment.trim()) {
      setMessage("Please write a short review.");
      return;
    }

    if (comment.trim().length < 10) {
      setMessage("Please write at least 10 characters.");
      return;
    }

    setSubmitting(true);

    const reviewData = {
      name: name.trim(),
      coachingRating,
      websiteRating,
      comment: comment.trim(),
    };

    try {
      const db = getFirestore(app);

      await addDoc(collection(db, "reviews"), {
        ...reviewData,
        uid: user?.uid ?? null,
        createdAt: serverTimestamp(),
      });

      setMessage("Thanks! Your review has been submitted.");
      setName("");
      setCoachingRating(0);
      setWebsiteRating(0);
      setComment("");
    } catch {
      const localReview: Review = {
        id: `${Date.now()}`,
        ...reviewData,
        createdAt: new Date().toISOString(),
      };

      const updatedReviews = [localReview, ...getLocalReviews()];

      saveLocalReviews(updatedReviews);
      setReviews(updatedReviews);

      setMessage(
        "Review saved on this device. Shared reviews will appear when online storage is available."
      );

      setName("");
      setCoachingRating(0);
      setWebsiteRating(0);
      setComment("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8F3EA] text-[#2E2925]">
      <Navbar />

      <section className="relative overflow-hidden px-6 pb-16 pt-32">
        <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[#D49A3A]/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-[#7D3F35]/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#D49A3A]/30 bg-white/60 px-4 py-2 text-sm font-medium text-[#7D3F35]">
              <Sparkles size={16} />
              Your feedback matters
            </div>

            <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
              Share Your{" "}
              <span className="text-[#A35D3B]">Rhythm</span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#665C53] sm:text-lg">
              Tell us how you feel about our dance coaching and website.
              Your feedback helps us make RhythmDance better for every learner.
            </p>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-3xl border border-[#E3D8C8] bg-white/80 p-7 shadow-[0_20px_60px_rgba(75,53,35,0.08)] backdrop-blur sm:p-9">
              <div className="mb-7">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7D3F35]/10">
                  <MessageCircle className="text-[#7D3F35]" size={23} />
                </div>

                <h2 className="font-serif text-2xl font-semibold">
                  Leave a review
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#766B61]">
                  Rate the coaching experience and the website separately.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="review-name"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Your name
                  </label>

                  <input
                    id="review-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Enter your name"
                    maxLength={60}
                    className="w-full rounded-2xl border border-[#DED2C2] bg-[#FCFAF6] px-4 py-3.5 text-sm outline-none transition focus:border-[#A35D3B] focus:ring-4 focus:ring-[#A35D3B]/10"
                  />
                </div>

                <div>
                  <p className="mb-3 text-sm font-semibold">
                    Dance coaching
                  </p>

                  <StarRating
                    value={coachingRating}
                    onChange={setCoachingRating}
                  />

                  <p className="mt-2 text-xs text-[#887C70]">
                    {coachingRating === 0
                      ? "Choose a rating"
                      : `${coachingRating} out of 5`}
                  </p>
                </div>

                <div>
                  <p className="mb-3 text-sm font-semibold">
                    Website experience
                  </p>

                  <StarRating
                    value={websiteRating}
                    onChange={setWebsiteRating}
                  />

                  <p className="mt-2 text-xs text-[#887C70]">
                    {websiteRating === 0
                      ? "Choose a rating"
                      : `${websiteRating} out of 5`}
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="review-comment"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Your review
                  </label>

                  <textarea
                    id="review-comment"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="What did you like? What can we improve?"
                    rows={5}
                    maxLength={500}
                    className="w-full resize-none rounded-2xl border border-[#DED2C2] bg-[#FCFAF6] px-4 py-3.5 text-sm outline-none transition focus:border-[#A35D3B] focus:ring-4 focus:ring-[#A35D3B]/10"
                  />

                  <div className="mt-1 text-right text-xs text-[#9A8D80]">
                    {comment.length}/500
                  </div>
                </div>

                {message && (
                  <div className="rounded-2xl bg-[#7D3F35]/8 px-4 py-3 text-sm leading-6 text-[#7D3F35]">
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#7D3F35] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#66332C] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send size={17} />
                  {submitting ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            </div>

            <div className="space-y-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-[#E3D8C8] bg-white/80 p-6 shadow-sm">
                  <p className="text-sm font-medium text-[#766B61]">
                    Coaching rating
                  </p>

                  <div className="mt-3 flex items-end gap-2">
                    <span className="font-serif text-4xl font-semibold">
                      {averageCoaching
                        ? averageCoaching.toFixed(1)
                        : "—"}
                    </span>

                    {reviews.length > 0 && (
                      <span className="pb-1 text-sm text-[#8A7E73]">
                        / 5
                      </span>
                    )}
                  </div>

                  {reviews.length > 0 && (
                    <div className="mt-3">
                      <Stars rating={Math.round(averageCoaching)} />
                    </div>
                  )}

                  <p className="mt-3 text-xs text-[#8A7E73]">
                    {reviews.length
                      ? `${reviews.length} review${
                          reviews.length === 1 ? "" : "s"
                        }`
                      : "No reviews yet"}
                  </p>
                </div>

                <div className="rounded-3xl border border-[#E3D8C8] bg-white/80 p-6 shadow-sm">
                  <p className="text-sm font-medium text-[#766B61]">
                    Website rating
                  </p>

                  <div className="mt-3 flex items-end gap-2">
                    <span className="font-serif text-4xl font-semibold">
                      {averageWebsite ? averageWebsite.toFixed(1) : "—"}
                    </span>

                    {reviews.length > 0 && (
                      <span className="pb-1 text-sm text-[#8A7E73]">
                        / 5
                      </span>
                    )}
                  </div>

                  {reviews.length > 0 && (
                    <div className="mt-3">
                      <Stars rating={Math.round(averageWebsite)} />
                    </div>
                  )}

                  <p className="mt-3 text-xs text-[#8A7E73]">
                    Based on learner feedback
                  </p>
                </div>
              </div>

              <div>
                <div className="mb-5 flex items-end justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#A35D3B]">
                      Community feedback
                    </p>

                    <h2 className="mt-1 font-serif text-3xl font-semibold">
                      Latest reviews
                    </h2>
                  </div>
                </div>

                {reviews.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-[#D8CCBC] bg-white/50 p-10 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#D49A3A]/10">
                      <MessageCircle
                        size={25}
                        className="text-[#A35D3B]"
                      />
                    </div>

                    <h3 className="font-serif text-xl font-semibold">
                      Be the first reviewer
                    </h3>

                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#7E7369]">
                      Share your experience and help future learners know what
                      to expect from RhythmDance.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <article
                        key={review.id}
                        className="rounded-3xl border border-[#E3D8C8] bg-white/80 p-6 shadow-sm"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="font-semibold text-[#342E29]">
                              {review.name}
                            </h3>

                            <div className="mt-2 flex flex-wrap gap-4">
                              <div>
                                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[#95887A]">
                                  Coaching
                                </p>

                                <Stars rating={review.coachingRating} />
                              </div>

                              <div>
                                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[#95887A]">
                                  Website
                                </p>

                                <Stars rating={review.websiteRating} />
                              </div>
                            </div>
                          </div>
                        </div>

                        <p className="mt-5 text-sm leading-7 text-[#625951]">
                          “{review.comment}”
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}