"use client";

import {
  ChangeEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  CheckCircle2,
  CloudUpload,
  FileVideo,
  Loader2,
  Play,
  ShieldCheck,
  Trash2,
  Video,
  XCircle,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

import {
  danceStyles,
  DanceStyle,
} from "@/data/danceData";

import {
  getMovementForLesson,
} from "@/data/referenceMovements";

import {
  deleteReferenceVideo,
  getReferenceVideos,
  ReferenceVideo,
  uploadReferenceVideo,
} from "@/lib/referenceVideos";

const MAX_FILE_SIZE =
  500 * 1024 * 1024;

const ALLOWED_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

export default function ReferenceVideosAdminPage() {
  const router = useRouter();

  const {
    user,
    profile,
    role,
    loading: authLoading,
  } = useAuth();

  const [videos, setVideos] =
    useState<ReferenceVideo[]>([]);

  const [loadingVideos, setLoadingVideos] =
    useState(true);

  const [selectedDanceSlug, setSelectedDanceSlug] =
    useState("");

  const [selectedLessonIndex, setSelectedLessonIndex] =
    useState(0);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [uploadProgress, setUploadProgress] =
    useState(0);

  const [uploading, setUploading] =
    useState(false);

  const [message, setMessage] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [previewUrl, setPreviewUrl] =
    useState<string | null>(null);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  /*
   * =========================================================
   * ADMIN ACCESS
   * =========================================================
   *
   * IMPORTANT:
   *
   * We use the Firebase/Firestore role from AuthContext.
   *
   * role === "admin"
   *
   * No NEXT_PUBLIC_ADMIN_EMAIL is required.
   */

  const isAdmin =
    role === "admin";

  /*
   * =========================================================
   * AUTH / ADMIN REDIRECT
   * =========================================================
   */

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.replace("/");
      return;
    }

    if (role !== "admin") {
      router.replace("/dashboard");
      return;
    }
  }, [
    authLoading,
    user,
    role,
    router,
  ]);

  /*
   * =========================================================
   * LOAD REFERENCE VIDEOS
   * =========================================================
   */

  const loadVideos = async () => {
    try {
      setLoadingVideos(true);
      setError(null);

      const data =
        await getReferenceVideos();

      setVideos(data);
    } catch (err) {
      console.error(
        "Failed to load reference videos:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Could not load reference videos."
      );
    } finally {
      setLoadingVideos(false);
    }
  };

  useEffect(() => {
    if (
      !authLoading &&
      isAdmin
    ) {
      loadVideos();
    }
  }, [
    authLoading,
    isAdmin,
  ]);

  /*
   * =========================================================
   * SELECTED DANCE
   * =========================================================
   */

  const selectedDance:
    | DanceStyle
    | undefined =
    useMemo(() => {
      return danceStyles.find(
        (dance) =>
          dance.slug ===
          selectedDanceSlug
      );
    }, [
      selectedDanceSlug,
    ]);

  /*
   * =========================================================
   * SELECTED LESSON
   * =========================================================
   */

  const selectedLesson =
    selectedDance?.lessons[
      selectedLessonIndex
    ];

  /*
   * =========================================================
   * SELECTED MOVEMENT
   * =========================================================
   */

  const selectedMovement =
    selectedDance
      ? getMovementForLesson(
          selectedDance.slug,
          selectedLessonIndex
        )
      : null;

  /*
   * =========================================================
   * FILE SELECTION
   * =========================================================
   */

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setError(null);
    setMessage(null);

    const file =
      event.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    /*
     * Validate video type
     */

    if (
      !ALLOWED_TYPES.includes(
        file.type
      )
    ) {
      setError(
        "Please upload an MP4, WebM, or MOV video."
      );

      event.target.value = "";
      setSelectedFile(null);
      setPreviewUrl(null);

      return;
    }

    /*
     * Validate file size
     */

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      setError(
        "Video must be smaller than 500 MB."
      );

      event.target.value = "";
      setSelectedFile(null);
      setPreviewUrl(null);

      return;
    }

    /*
     * Clean previous preview
     */

    if (previewUrl) {
      URL.revokeObjectURL(
        previewUrl
      );
    }

    /*
     * Store selected file
     */

    setSelectedFile(file);

    /*
     * Create local preview
     */

    const url =
      URL.createObjectURL(file);

    setPreviewUrl(url);
  };

  /*
   * =========================================================
   * UPLOAD REFERENCE VIDEO
   * =========================================================
   */

  const handleUpload = async () => {
    setError(null);
    setMessage(null);

    /*
     * Authentication check
     */

    if (!user) {
      setError(
        "You must be logged in."
      );

      return;
    }

    /*
     * Admin check
     */

    if (role !== "admin") {
      setError(
        "Administrator access is required."
      );

      return;
    }

    /*
     * Dance check
     */

    if (!selectedDance) {
      setError(
        "Please select a dance."
      );

      return;
    }

    /*
     * Movement check
     */

    if (!selectedMovement) {
      setError(
        "No movement is available for this lesson."
      );

      return;
    }

    /*
     * File check
     */

    if (!selectedFile) {
      setError(
        "Please select a reference video."
      );

      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      await uploadReferenceVideo(
        selectedFile,
        {
          danceSlug:
            selectedDance.slug,

          danceName:
            selectedDance.name,

          movementId:
            selectedMovement.id,

          movementName:
            selectedMovement.name,

          uploadedBy:
            user.uid,

          uploadedByEmail:
            user.email || "",
        },
        (
          progress: number
        ) => {
          setUploadProgress(
            progress
          );
        }
      );

      setMessage(
        "Reference video uploaded successfully."
      );

      /*
       * Reset selected file
       */

      setSelectedFile(null);

      if (previewUrl) {
        URL.revokeObjectURL(
          previewUrl
        );
      }

      setPreviewUrl(null);

      setUploadProgress(100);

      /*
       * Reload library
       */

      await loadVideos();
    } catch (err) {
      console.error(
        "Reference video upload failed:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Reference video upload failed."
      );
    } finally {
      setUploading(false);
    }
  };

  /*
   * =========================================================
   * DELETE REFERENCE VIDEO
   * =========================================================
   */

  const handleDelete = async (
    video: ReferenceVideo
  ) => {
    const confirmed =
      window.confirm(
        `Delete the reference video "${video.fileName}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(
        video.id
      );

      await deleteReferenceVideo(
        video
      );

      setVideos(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              video.id
          )
      );
    } catch (err) {
      console.error(
        "Failed to delete reference video:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Could not delete the reference video."
      );
    } finally {
      setDeletingId(null);
    }
  };

  /*
   * =========================================================
   * CLEAN PREVIEW URL
   * =========================================================
   */

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(
          previewUrl
        );
      }
    };
  }, [previewUrl]);

  /*
   * =========================================================
   * AUTH LOADING
   * =========================================================
   */

  if (authLoading) {
    return (
      <main className="min-h-screen bg-[#070A12] text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2
            className="mx-auto animate-spin text-[#f3c56b]"
            size={42}
          />

          <p className="mt-4 text-sm text-white/60">
            Loading administrator access...
          </p>
        </div>
      </main>
    );
  }

  /*
   * =========================================================
   * NOT LOGGED IN
   * =========================================================
   */

  if (!user) {
    return (
      <main className="min-h-screen bg-[#070A12] text-white flex items-center justify-center">
        <div className="text-center">
          <XCircle
            className="mx-auto text-red-300"
            size={42}
          />

          <h1 className="mt-4 text-xl font-black">
            Login Required
          </h1>

          <p className="mt-2 text-sm text-white/50">
            Please log in with your administrator account.
          </p>

          <button
            type="button"
            onClick={() =>
              router.push("/")
            }
            className="mt-6 rounded-2xl bg-[#f3c56b] px-6 py-3 text-sm font-black text-[#111]"
          >
            Go to Login
          </button>
        </div>
      </main>
    );
  }

  /*
   * =========================================================
   * NOT ADMIN
   * =========================================================
   */

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-[#070A12] text-white flex items-center justify-center">
        <div className="text-center">
          <ShieldCheck
            className="mx-auto text-red-300"
            size={42}
          />

          <h1 className="mt-4 text-xl font-black">
            Administrator Access Required
          </h1>

          <p className="mt-2 text-sm text-white/50">
            Your account does not have administrator privileges.
          </p>

          <p className="mt-2 text-xs text-white/30">
            Current role:{" "}
            {profile?.role ||
              role ||
              "unknown"}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/dashboard"
              )
            }
            className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-white"
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    );
  }

  /*
   * =========================================================
   * MAIN ADMIN PAGE
   * =========================================================
   */

  return (
    <main className="min-h-screen bg-[#070A12] text-white">
      {/* HEADER */}

      <header className="border-b border-white/10 bg-[#0B0F18]">
        <div className="mx-auto max-w-7xl px-6 py-6 lg:px-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f3c56b] text-[#111]">
                  <Video size={22} />
                </div>

                <div>
                  <p className="text-xs font-bold tracking-[0.25em] text-[#f3c56b]">
                    RHYTHM OF INDIA
                  </p>

                  <h1 className="text-2xl font-black">
                    Reference Video Manager
                  </h1>
                </div>
              </div>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
                Upload official dance demonstration
                videos that the AI Practice system
                will use as movement references.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-bold text-emerald-300">
              <ShieldCheck
                size={15}
              />

              ADMIN ACCESS
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        {/* ALERTS */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">
            <XCircle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">
            <CheckCircle2
              size={18}
              className="mt-0.5 shrink-0"
            />

            <span>{message}</span>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          {/* ==================================================
              UPLOAD CARD
          ================================================== */}

          <section className="rounded-[28px] border border-white/10 bg-[#0B0F18] p-6 shadow-2xl">
            <div className="mb-6">
              <p className="font-mono text-[10px] font-bold tracking-[0.2em] text-[#f3c56b]">
                NEW REFERENCE
              </p>

              <h2 className="mt-1 text-2xl font-black">
                Add Dance Video
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/45">
                This video becomes the reference
                for the selected movement.
              </p>
            </div>

            {/* DANCE */}

            <label className="block">
              <span className="mb-2 block text-xs font-bold text-white/60">
                Dance
              </span>

              <select
                value={
                  selectedDanceSlug
                }
                onChange={(event) => {
                  setSelectedDanceSlug(
                    event.target.value
                  );

                  setSelectedLessonIndex(
                    0
                  );

                  setSelectedFile(
                    null
                  );

                  setPreviewUrl(
                    null
                  );

                  setError(null);
                  setMessage(null);
                }}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white outline-none transition focus:border-[#f3c56b]"
              >
                <option
                  value=""
                  className="bg-[#0B0F18]"
                >
                  Select a dance
                </option>

                {danceStyles.map(
                  (dance) => (
                    <option
                      key={
                        dance.slug
                      }
                      value={
                        dance.slug
                      }
                      className="bg-[#0B0F18]"
                    >
                      {dance.name}
                    </option>
                  )
                )}
              </select>
            </label>

            {/* MOVEMENT / LESSON */}

            {selectedDance && (
              <label className="mt-5 block">
                <span className="mb-2 block text-xs font-bold text-white/60">
                  Movement / Lesson
                </span>

                <select
                  value={
                    selectedLessonIndex
                  }
                  onChange={(event) => {
                    setSelectedLessonIndex(
                      Number(
                        event.target
                          .value
                      )
                    );

                    setSelectedFile(
                      null
                    );

                    setPreviewUrl(
                      null
                    );

                    setError(null);
                    setMessage(null);
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white outline-none transition focus:border-[#f3c56b]"
                >
                  {selectedDance.lessons.map(
                    (
                      lesson,
                      index
                    ) => (
                      <option
                        key={`${selectedDance.slug}-${index}`}
                        value={
                          index
                        }
                        className="bg-[#0B0F18]"
                      >
                        {index +
                          1}
                        .{" "}
                        {
                          lesson.title
                        }
                      </option>
                    )
                  )}
                </select>

                {selectedLesson && (
                  <p className="mt-2 text-xs text-white/35">
                    AI movement:{" "}
                    <span className="text-[#f3c56b]">
                      {selectedMovement?.name ||
                        "Not available"}
                    </span>
                  </p>
                )}
              </label>
            )}

            {/* FILE */}

            <div className="mt-5">
              <span className="mb-2 block text-xs font-bold text-white/60">
                Reference Video
              </span>

              <label className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.025] px-5 py-10 text-center transition hover:border-[#f3c56b]/50 hover:bg-[#f3c56b]/5">
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={
                    handleFileChange
                  }
                  className="hidden"
                />

                <CloudUpload
                  size={34}
                  className="text-[#f3c56b]"
                />

                <p className="mt-4 text-sm font-bold">
                  {selectedFile
                    ? selectedFile.name
                    : "Choose reference video"}
                </p>

                <p className="mt-2 text-xs text-white/35">
                  MP4, WebM or MOV ·
                  Maximum 500 MB
                </p>
              </label>
            </div>

            {/* PREVIEW */}

            {previewUrl && (
              <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-black">
                <video
                  src={
                    previewUrl
                  }
                  controls
                  className="max-h-[320px] w-full object-contain"
                />
              </div>
            )}

            {/* UPLOAD BUTTON */}

            <button
              type="button"
              disabled={
                uploading ||
                !selectedFile ||
                !selectedDance ||
                !selectedMovement
              }
              onClick={
                handleUpload
              }
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#f3c56b] px-5 py-4 text-sm font-black text-[#111] transition hover:bg-[#ffd982] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {uploading ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />

                  Uploading{" "}
                  {
                    uploadProgress
                  }
                  %
                </>
              ) : (
                <>
                  <CloudUpload
                    size={18}
                  />

                  Upload Reference
                </>
              )}
            </button>

            {/* PROGRESS */}

            {uploading && (
              <div className="mt-4">
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#f3c56b] transition-all duration-300"
                    style={{
                      width: `${uploadProgress}%`,
                    }}
                  />
                </div>

                <p className="mt-2 text-center font-mono text-[10px] text-white/35">
                  UPLOADING TO FIREBASE
                  STORAGE
                </p>
              </div>
            )}
          </section>

          {/* ==================================================
              LIBRARY
          ================================================== */}

          <section>
            <div className="mb-5 flex items-end justify-between">
              <div>
                <p className="font-mono text-[10px] font-bold tracking-[0.2em] text-[#f3c56b]">
                  LIBRARY
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  Reference Videos
                </h2>
              </div>

              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[10px] text-white/50">
                {
                  videos.length
                }{" "}
                videos
              </div>
            </div>

            {loadingVideos ? (
              <div className="flex min-h-[300px] items-center justify-center rounded-[28px] border border-white/10 bg-[#0B0F18]">
                <Loader2
                  className="animate-spin text-[#f3c56b]"
                  size={32}
                />
              </div>
            ) : videos.length ===
              0 ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-[#0B0F18] px-6 text-center">
                <FileVideo
                  size={40}
                  className="text-white/20"
                />

                <h3 className="mt-4 font-bold">
                  No reference videos
                  yet
                </h3>

                <p className="mt-2 max-w-sm text-sm text-white/35">
                  Upload the first
                  official dance
                  demonstration using
                  the form.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {videos.map(
                  (video) => (
                    <article
                      key={
                        video.id
                      }
                      className="overflow-hidden rounded-[24px] border border-white/10 bg-[#0B0F18]"
                    >
                      <div className="grid md:grid-cols-[220px_1fr]">
                        {/* VIDEO */}

                        <div className="relative aspect-video bg-black md:aspect-auto">
                          <video
                            src={
                              video.videoUrl
                            }
                            controls
                            preload="metadata"
                            className="h-full w-full object-cover"
                          />

                          <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/10 bg-black/60 px-2.5 py-1 text-[9px] font-bold text-white/70 backdrop-blur-md">
                            <Play
                              size={10}
                              className="mr-1 inline"
                            />

                            REFERENCE
                          </div>
                        </div>

                        {/* INFO */}

                        <div className="p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-[#f3c56b]">
                                {
                                  video.danceName
                                }
                              </p>

                              <h3 className="mt-1 text-lg font-black">
                                {
                                  video.movementName
                                }
                              </h3>

                              <p className="mt-1 truncate text-xs text-white/35">
                                {
                                  video.fileName
                                }
                              </p>
                            </div>

                            <button
                              type="button"
                              disabled={
                                deletingId ===
                                video.id
                              }
                              onClick={() =>
                                handleDelete(
                                  video
                                )
                              }
                              className="rounded-xl border border-red-400/20 bg-red-400/5 p-2.5 text-red-300 transition hover:bg-red-400/10 disabled:opacity-50"
                              title="Delete reference"
                            >
                              {deletingId ===
                              video.id ? (
                                <Loader2
                                  size={
                                    16
                                  }
                                  className="animate-spin"
                                />
                              ) : (
                                <Trash2
                                  size={
                                    16
                                  }
                                />
                              )}
                            </button>
                          </div>

                          <div className="mt-5 flex flex-wrap gap-2">
                            <StatusBadge
                              status={
                                video.status
                              }
                            />

                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] text-white/45">
                              {formatBytes(
                                video.fileSize
                              )}
                            </span>

                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] text-white/45">
                              {
                                video.contentType
                              }
                            </span>
                          </div>

                          <div className="mt-4 border-t border-white/10 pt-4">
                            <p className="text-[10px] font-mono text-white/25">
                              REFERENCE ID
                            </p>

                            <p className="mt-1 break-all font-mono text-[10px] text-white/40">
                              {
                                video.id
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </article>
                  )
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

/* ===============================================================
   STATUS BADGE
=============================================================== */

function StatusBadge({
  status,
}: {
  status: ReferenceVideo["status"];
}) {
  if (
    status ===
    "processed"
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold text-emerald-300">
        <CheckCircle2
          size={11}
        />
        AI READY
      </span>
    );
  }

  if (
    status ===
    "processing"
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[10px] font-bold text-amber-300">
        <Loader2
          size={11}
          className="animate-spin"
        />
        PROCESSING
      </span>
    );
  }

  if (
    status === "failed"
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1 text-[10px] font-bold text-red-300">
        <XCircle
          size={11}
        />
        FAILED
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-[10px] font-bold text-blue-300">
      <CloudUpload
        size={11}
      />
      UPLOADED
    </span>
  );
}

/* ===============================================================
   FILE SIZE
=============================================================== */

function formatBytes(
  bytes: number
) {
  if (bytes === 0) {
    return "0 B";
  }

  const units = [
    "B",
    "KB",
    "MB",
    "GB",
  ];

  const index =
    Math.floor(
      Math.log(bytes) /
        Math.log(1024)
    );

  return `${(
    bytes /
    Math.pow(
      1024,
      index
    )
  ).toFixed(
    index === 0 ? 0 : 1
  )} ${units[index]}`;
}