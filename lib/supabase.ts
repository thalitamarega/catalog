import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://qkhwtksyxvwozfyzhyfr.supabase.co";
const supabasePublishableKey = "sb_publishable_UD-JnN4WPMzRnAQH7goDrg_4FqmN_56";

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: { persistSession: false },
});

export type CatalogProduct = {
  id: string;
  slug: string;
  title: string;
  description: string;
  image_url: string;
  material: string | null;
  category: string | null;
  source_sku: string | null;
};
