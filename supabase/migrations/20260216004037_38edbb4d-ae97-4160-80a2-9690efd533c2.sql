
-- Create storage bucket for session screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('session-screenshots', 'session-screenshots', true);

-- Allow anyone to upload
CREATE POLICY "Anyone can upload session screenshots"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'session-screenshots');

-- Allow public read
CREATE POLICY "Session screenshots are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'session-screenshots');
