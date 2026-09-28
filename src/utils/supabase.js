import { createClient } from '@supabase/supabase-js';

// Consider adding these to a .env file later
// For now, we will use placeholders that need to be replaced with 
// real keys from mcp_supabase-mcp-server_get_publishable_keys
const supabaseUrl = 'https://kfxnpnwpdgdswvywjnhu.supabase.co';
const supabaseKey = 'sb_publishable_17WECf0vg2z6g1ltPuGkHw_WKyjKRkn';

export const supabase = createClient(supabaseUrl, supabaseKey);
