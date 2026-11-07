import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://twdepgonrrwfeizkbsvq.supabase.co';
const supabaseKey = 'sb_publishable_1tVIYxpP_sCm6H0OmyxVsA_P2XIhWqD';

export const supabase = createClient(supabaseUrl, supabaseKey);