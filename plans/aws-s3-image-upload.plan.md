# Implementation Plan: AWS S3 + CloudFront Image Upload System

## Summary

Integrate AWS S3 for image storage with CloudFront CDN delivery, signed URLs for secure uploads, and a reusable drag-and-drop image upload component used across car listings and car parts admin forms.

## Impact Analysis

- **New files:** 8
- **Modified files:** 7
- **Database changes:** No — existing `image`/`images` fields already store URL strings
- **New dependencies:** `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`
- **New env vars:** `AWS_S3_BUCKET_NAME`, `AWS_S3_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_CLOUDFRONT_DOMAIN`
- **Risk level:** Medium (new external dependency, security-sensitive)

---

## Tasks

### Task 1: Install AWS SDK Dependencies

**Layer:** Config
**Files to modify:**

- `package.json` — add `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`

**Description:** Install the minimal AWS SDK v3 packages needed for S3 operations and presigned URL generation.

**Acceptance Criteria:**

- [ ] `@aws-sdk/client-s3` installed
- [ ] `@aws-sdk/s3-request-presigner` installed
- [ ] No version conflicts with existing dependencies

**Dependencies:** None
**Risk:** Low
**Estimated Effort:** Small

---

### Task 2: Create S3 Client Utility

**Layer:** Backend Utility
**Files to create:**

- `src/lib/utils/s3.ts` — S3 client singleton, presigned URL generator, delete helper

**Description:** Create a utility module that:

1. Initializes an S3 client singleton (like the MongoDB connection pattern)
2. Exports `generatePresignedUploadUrl(key, contentType)` — returns a presigned PUT URL (5 min expiry)
3. Exports `deleteS3Object(key)` — deletes an object from S3
4. Exports `getPublicUrl(key)` — returns the CloudFront URL for a given S3 key
5. File keys follow pattern: `cars/{carId}/{uuid}.{ext}` or `parts/{partId}/{uuid}.{ext}`

**Acceptance Criteria:**

- [ ] S3 client reads credentials from env vars
- [ ] Presigned URLs expire in 5 minutes
- [ ] Presigned URLs restrict to specific content types (image/jpeg, image/png, image/webp)
- [ ] Max file size enforced via presigned URL conditions (10 MB)
- [ ] `getPublicUrl()` returns CloudFront domain URL
- [ ] `deleteS3Object()` handles errors gracefully

**Dependencies:** Task 1
**Risk:** Medium — credentials must be handled securely
**Estimated Effort:** Medium

---

### Task 3: Create Image Upload API Route

**Layer:** API
**Files to create:**

- `src/app/api/admin/upload/route.ts` — POST endpoint returning presigned URL

**Description:** Create an authenticated API route that:

1. Requires admin session (same auth check as other admin routes)
2. Accepts JSON: `{ fileName, contentType, folder }` where folder is "cars" or "parts"
3. Validates content type is an allowed image type
4. Generates a unique S3 key: `{folder}/{uuid}-{sanitizedFileName}`
5. Returns `{ uploadUrl, key, publicUrl }`

**Acceptance Criteria:**

- [ ] Requires admin authentication
- [ ] Validates content type (only image/jpeg, image/png, image/webp, image/avif)
- [ ] Validates file name (sanitized, no path traversal)
- [ ] Returns presigned PUT URL + the final CloudFront public URL
- [ ] Returns 401 for unauthenticated requests
- [ ] Returns 400 for invalid content types

**Dependencies:** Task 2
**Risk:** High — auth + file upload = security sensitive
**Estimated Effort:** Medium

---

### Task 4: Create Image Delete API Route

**Layer:** API
**Files to create:**

- `src/app/api/admin/upload/delete/route.ts` — POST endpoint to delete S3 images

**Description:** Authenticated API route to delete images from S3:

1. Requires admin session
2. Accepts JSON: `{ key }` — the S3 object key
3. Validates the key starts with an allowed prefix ("cars/" or "parts/")
4. Deletes the object from S3
5. Returns success/failure

**Acceptance Criteria:**

- [ ] Requires admin authentication
- [ ] Validates key prefix (only "cars/" or "parts/")
- [ ] Prevents path traversal in key
- [ ] Returns 401 for unauthenticated requests
- [ ] Returns 400 for invalid keys

**Dependencies:** Task 2
**Risk:** High — deletion is destructive, must validate keys
**Estimated Effort:** Small

---

### Task 5: Create ImageUploader Component

**Layer:** Component
**Files to create:**

- `src/components/Admin/ImageUploader.tsx` — reusable drag-and-drop image upload component

**Description:** Create a client component that:

1. Accepts props: `folder`, `onUpload(url)`, `onRemove(url)`, `existingImages?`, `maxImages?`, `multiple?`
2. Shows a drop zone with drag-and-drop support
3. On file selection: calls `/api/admin/upload` to get presigned URL, then PUTs file directly to S3
4. Shows upload progress per file
5. Shows image previews with remove buttons
6. For single image mode: shows one image slot
7. For multi-image mode: shows grid of thumbnails with add button
8. Validates file type and size client-side before upload
9. When removing: calls `/api/admin/upload/delete` then calls `onRemove`

**Acceptance Criteria:**

- [ ] Drag-and-drop file selection works
- [ ] Click-to-browse file selection works
- [ ] Shows upload progress indicator
- [ ] Shows image previews after upload
- [ ] Remove button deletes from S3 and removes preview
- [ ] Client-side validation: max 10 MB, image types only
- [ ] Single and multi-image modes via props
- [ ] Accessible: keyboard navigable, proper ARIA labels
- [ ] Error states shown for failed uploads
- [ ] Follows design system (Tailwind classes from globals.css)

**Dependencies:** Tasks 3, 4
**Risk:** Medium — complex UI + async upload logic
**Estimated Effort:** Large

---

### Task 6: Integrate ImageUploader into Car Form

**Layer:** Component
**Files to modify:**

- `src/components/Admin/Form/CarForm.tsx` — add image upload step
- `src/components/Admin/Form/MainForm.tsx` — add `image`/`images` to CarFormData
- `src/app/api/admin/cars/route.ts` — already accepts `image`/`images` strings (no change needed)

**Description:**

1. Add `image` and `images` fields to `CarFormData` interface
2. Add a new step "Photos" to the CarForm multi-step form (between "Details" and current last step)
3. Use `ImageUploader` with `folder="cars"`, `multiple=true`, `maxImages=10`
4. First uploaded image becomes `image` (main), rest go in `images[]`
5. Submit sends the CloudFront URLs in the existing `image`/`images` fields

**Acceptance Criteria:**

- [ ] CarForm has a "Photos" step with ImageUploader
- [ ] Main image is clearly marked
- [ ] Can reorder by dragging (stretch goal) or at minimum: first uploaded = main
- [ ] URLs are included in the form submission
- [ ] Existing car edit pre-populates with current images
- [ ] Form works end-to-end: upload image → submit car → image appears in listing

**Dependencies:** Task 5
**Risk:** Medium
**Estimated Effort:** Medium

---

### Task 7: Integrate ImageUploader into Car Parts Admin

**Layer:** Component
**Files to modify:**

- `src/app/(admin)/admin/dashboard/carparts/page.tsx` — replace text input with ImageUploader

**Description:**

1. Replace the "Image URL" text input in the car parts add/edit form with `ImageUploader`
2. Use `folder="parts"`, `multiple=false`, `maxImages=1`
3. `onUpload` sets the `formData.image` to the CloudFront URL
4. `onRemove` clears `formData.image`

**Acceptance Criteria:**

- [ ] Text input replaced with ImageUploader component
- [ ] Single image upload for car parts
- [ ] Image previews in form
- [ ] URL stored correctly in formData
- [ ] Edit mode pre-populates with existing image

**Dependencies:** Task 5
**Risk:** Low
**Estimated Effort:** Small

---

### Task 8: Update next.config.ts for S3/CloudFront

**Layer:** Config
**Files to modify:**

- `next.config.ts` — add CloudFront domain to image remotePatterns and CSP

**Description:**

1. Add CloudFront domain to `images.remotePatterns`
2. Update CSP `img-src` to include `https://*.cloudfront.net` (or specific CloudFront domain)
3. Update CSP `connect-src` to include S3 bucket domain (for presigned PUT uploads from browser)
4. Keep existing Cloudinary config for backward compatibility

**Acceptance Criteria:**

- [ ] Next.js Image component can load images from CloudFront
- [ ] CSP allows image loading from CloudFront
- [ ] CSP allows XHR/fetch to S3 for presigned uploads
- [ ] Existing Cloudinary images still work

**Dependencies:** None (can be done in parallel)
**Risk:** Low
**Estimated Effort:** Small

---

### Task 9: Update Car Display Components to Use Real Images

**Layer:** Component
**Files to modify:**

- `src/components/Car/CarDetailView.tsx` — use `car.image`/`car.images` instead of hardcoded `/tesla.webp`
- `src/components/Car/Cars.tsx` — use `car.image` instead of hardcoded `/tesla.webp`
- `src/components/Car/CarListCard.tsx` — use `car.image` instead of hardcoded `/tesla.webp`
- `src/components/Car/CarCard.tsx` — use `car.image` instead of hardcoded `/tesla.webp`
- `src/components/Shared/VehicleDetails.tsx` — use `vehicle.image` instead of hardcoded `/tesla.webp`

**Description:** Multiple components currently hardcode `src={"/tesla.webp"}` as the image source. Update them all to use the actual `car.image` field from the data, falling back to `/tesla.webp` when no image exists.

**Acceptance Criteria:**

- [ ] `CarDetailView` displays car.image (main) and car.images (gallery)
- [ ] `Cars` displays car.image
- [ ] `CarListCard` displays car.image
- [ ] `CarCard` thumbnails display car.images
- [ ] `VehicleDetails` displays vehicle image
- [ ] All fall back to `/tesla.webp` when image is empty/undefined
- [ ] No hardcoded `/tesla.webp` remains except as fallback

**Dependencies:** None (can be done in parallel)
**Risk:** Low
**Estimated Effort:** Small

---

## Implementation Order

### Phase 1 — Infrastructure (no dependencies)

- **Task 1:** Install AWS SDK dependencies
- **Task 8:** Update next.config.ts for CloudFront

### Phase 2 — Backend (depends on Phase 1)

- **Task 2:** Create S3 client utility
- **Task 3:** Create image upload API route
- **Task 4:** Create image delete API route

### Phase 3 — UI Components (depends on Phase 2)

- **Task 5:** Create ImageUploader component
- **Task 9:** Update car display components to use real images

### Phase 4 — Integration (depends on Phase 3)

- **Task 6:** Integrate ImageUploader into Car Form
- **Task 7:** Integrate ImageUploader into Car Parts Admin

---

## Risks & Mitigations

| Risk                                      | Impact   | Mitigation                                                           |
| ----------------------------------------- | -------- | -------------------------------------------------------------------- |
| AWS credentials leaked in client bundle   | Critical | Presigned URLs generated server-side only; no AWS SDK in client code |
| Path traversal in S3 key                  | High     | Validate key prefixes, sanitize file names, reject `..`              |
| Unrestricted file upload                  | High     | Validate content type server-side, presigned URL restricts type/size |
| Large file uploads timeout                | Medium   | 10 MB limit, presigned URL direct-to-S3 bypasses server              |
| CloudFront domain not set in env          | Low      | Fallback to S3 direct URL if CloudFront domain not configured        |
| Orphaned S3 objects on failed form submit | Low      | Cleanup cron or accept small storage waste                           |

## AWS Setup Required (Manual — Outside Code)

The user must configure these in AWS Console before the code works:

1. **S3 Bucket:** Create bucket with name matching `AWS_S3_BUCKET_NAME`
2. **Bucket CORS:** Allow PUT from the app's origin
3. **IAM User/Role:** Create with `s3:PutObject`, `s3:DeleteObject`, `s3:GetObject` permissions scoped to the bucket
4. **CloudFront Distribution:** Origin = S3 bucket, default cache behavior, HTTPS only
5. **Environment Variables:** Add all 5 AWS env vars to `.env.local` and Vercel
