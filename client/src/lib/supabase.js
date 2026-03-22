import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env vars not set. Storage and persistence will not work.')
}

export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder'
)

/**
 * Upload a base64 data URL to Supabase Storage and return the public URL.
 * Bucket name: selfie-board-images (must be public)
 */
export async function uploadImage(dataUrl, cardId) {
  // Convert base64 data URL to Blob
  const res = await fetch(dataUrl)
  const blob = await res.blob()

  const path = `cards/${cardId}.jpg`
  const { error } = await supabase.storage
    .from('selfie-board-images')
    .upload(path, blob, { contentType: 'image/jpeg', upsert: false })

  if (error) throw error

  const { data } = supabase.storage
    .from('selfie-board-images')
    .getPublicUrl(path)

  return data.publicUrl
}
