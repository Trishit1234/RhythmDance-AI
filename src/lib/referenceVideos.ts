import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";

import { db, storage } from "@/lib/firebase";

export type ReferenceVideoStatus =
  | "uploaded"
  | "processing"
  | "processed"
  | "failed";

export interface ReferenceVideo {
  id: string;

  danceSlug: string;
  danceName: string;

  movementId: string;
  movementName: string;

  videoUrl: string;
  storagePath: string;

  fileName: string;
  fileSize: number;
  contentType: string;

  status: ReferenceVideoStatus;

  createdAt?: unknown;
  updatedAt?: unknown;

  processedAt?: unknown;
  processingError?: string;

  referenceDataPath?: string | null;

  uploadedBy: string;
  uploadedByEmail: string;
}

const COLLECTION_NAME = "referenceVideos";

/**
 * Upload a reference dance video to Firebase Storage
 * and create its Firestore metadata document.
 */
export function uploadReferenceVideo(
  file: File,
  metadata: {
    danceSlug: string;
    danceName: string;
    movementId: string;
    movementName: string;
    uploadedBy: string;
    uploadedByEmail: string;
  },
  onProgress?: (progress: number) => void
): Promise<ReferenceVideo> {
  return new Promise((resolve, reject) => {
    try {
      const safeFileName = file.name
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .replace(/\s+/g, "_");

      const timestamp = Date.now();

      const storagePath =
        `reference-videos/${metadata.danceSlug}/` +
        `${metadata.movementId}/${timestamp}-${safeFileName}`;

      const storageRef = ref(storage, storagePath);

      const uploadTask = uploadBytesResumable(
        storageRef,
        file,
        {
          contentType: file.type || "video/mp4",
        }
      );

      uploadTask.on(
        "state_changed",

        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred /
              snapshot.totalBytes) *
            100;

          onProgress?.(Math.round(progress));
        },

        (error) => {
          reject(error);
        },

        async () => {
          try {
            const videoUrl =
              await getDownloadURL(uploadTask.snapshot.ref);

            const referenceDoc = await addDoc(
              collection(db, COLLECTION_NAME),
              {
                danceSlug: metadata.danceSlug,
                danceName: metadata.danceName,

                movementId: metadata.movementId,
                movementName: metadata.movementName,

                videoUrl,
                storagePath,

                fileName: file.name,
                fileSize: file.size,
                contentType:
                  file.type || "video/mp4",

                status: "uploaded",

                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),

                processedAt: null,
                processingError: null,

                referenceDataPath: null,

                uploadedBy: metadata.uploadedBy,
                uploadedByEmail:
                  metadata.uploadedByEmail,
              }
            );

            resolve({
              id: referenceDoc.id,

              danceSlug: metadata.danceSlug,
              danceName: metadata.danceName,

              movementId: metadata.movementId,
              movementName: metadata.movementName,

              videoUrl,
              storagePath,

              fileName: file.name,
              fileSize: file.size,
              contentType:
                file.type || "video/mp4",

              status: "uploaded",

              createdAt: undefined,
              updatedAt: undefined,

              processedAt: undefined,
              processingError: undefined,

              referenceDataPath: null,

              uploadedBy: metadata.uploadedBy,
              uploadedByEmail:
                metadata.uploadedByEmail,
            });
          } catch (error) {
            reject(error);
          }
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Get all reference videos.
 */
export async function getReferenceVideos(): Promise<
  ReferenceVideo[]
> {
  const q = query(
    collection(db, COLLECTION_NAME),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...(item.data() as Omit<ReferenceVideo, "id">),
  }));
}

/**
 * Update reference video status.
 */
export async function updateReferenceVideo(
  id: string,
  updates: Partial<
    Pick<
      ReferenceVideo,
      | "status"
      | "processingError"
      | "referenceDataPath"
    >
  >
) {
  const referenceRef = doc(
    db,
    COLLECTION_NAME,
    id
  );

  await updateDoc(referenceRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete reference video from both:
 *
 * 1. Firebase Storage
 * 2. Firestore
 */
export async function deleteReferenceVideo(
  video: ReferenceVideo
) {
  if (video.storagePath) {
    try {
      const storageRef = ref(
        storage,
        video.storagePath
      );

      await deleteObject(storageRef);
    } catch (error) {
      console.warn(
        "Storage file could not be deleted:",
        error
      );
    }
  }

  const referenceRef = doc(
    db,
    COLLECTION_NAME,
    video.id
  );

  await deleteDoc(referenceRef);
}