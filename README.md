✅ POST /api/application/submit
   Accept startup details, create founder profile, prevent duplicates, save-as-draft support
✅ POST /api/application/upload
    Upload PDF/DOCX files (resume, pitch deck) to Cloudinary, store file metadata in DB
✅ POST /api/application/video-upload
    Handle video file uploads OR YouTube/Vimeo URLs, store video metadata
# GET /api/application/video-preview
#Retrieve video details by applicationId or specific videoId for viewing
# POST /api/application/evaluation/manual-score
#Submit reviewer scores (1-10) and feedback, support multiple reviews per application
#GET /api/application/evaluation-summary