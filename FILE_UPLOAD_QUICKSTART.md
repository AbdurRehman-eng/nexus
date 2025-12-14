# 🚀 File Upload - Quick Start (5 Minutes)

## Step 1: Run Database Migration (1 min)

1. Open **Supabase Dashboard** → **SQL Editor**
2. Click **"New Query"**
3. Copy/paste contents from: `supabase/create_attachments_table.sql`
4. Click **"Run"**
5. ✅ Table created!

## Step 2: Create Storage Bucket (2 min)

1. Go to **Storage** in Supabase Dashboard
2. Click **"New Bucket"**
3. Configure:
   - **Name:** `message-attachments`
   - **Public:** ✅ Yes
   - **File size limit:** `10485760` (10MB)
4. Click **"Create"**

## Step 3: Add Storage Policies (2 min)

Click on `message-attachments` bucket → **"Policies"** → Add these:

### Policy 1: Upload
- **Name:** "Allow authenticated uploads"
- **Operation:** INSERT
- **Policy:**
```sql
(bucket_id = 'message-attachments'::text) AND (auth.role() = 'authenticated'::text)
```

### Policy 2: View
- **Name:** "Allow public access"
- **Operation:** SELECT  
- **Policy:**
```sql
(bucket_id = 'message-attachments'::text)
```

### Policy 3: Delete
- **Name:** "Allow users to delete own files"
- **Operation:** DELETE
- **Policy:**
```sql
(bucket_id = 'message-attachments'::text) AND (auth.uid()::text = (storage.foldername(name))[1])
```

## Step 4: Test It!

1. Start dev server: `npm run dev`
2. Go to any chat channel
3. Click the 📎 icon
4. Select a file
5. Watch it upload! ✨

---

## ✨ Features

- ✅ Upload images, PDFs, docs (max 10MB)
- ✅ Real-time progress bar
- ✅ Image previews
- ✅ Download files
- ✅ Delete your own attachments
- ✅ Responsive & dark mode

---

## 📎 Files Created

**Database:**
- `supabase/create_attachments_table.sql` - Migration

**Backend:**
- `src/app/actions/files.ts` - Upload/download/delete

**Frontend:**
- `src/components/FileUpload.tsx` - Upload button
- `src/components/MessageAttachments.tsx` - Display attachments

**Updated:**
- `src/app/chat/[id]/page.tsx` - Integrated attachments

**Docs:**
- `FILE_UPLOAD_SETUP.md` - Complete guide
- `FILE_UPLOAD_QUICKSTART.md` - This file

---

## 🎯 That's It!

File uploads are now fully functional! 🎉

Need help? See `FILE_UPLOAD_SETUP.md` for detailed docs.
