import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://burrrsslozyyuevxgfja.databasepad.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjdmODE2ZDJlLWZkNGEtNDY2ZS1iYWE2LTI5MDE2ZjMzNjExNyJ9.eyJwcm9qZWN0SWQiOiJidXJycnNzbG96eXl1ZXZ4Z2ZqYSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzc3MTI5NzY2LCJleHAiOjIwOTI0ODk3NjYsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.s4yDq6-u6a9izAFnCmC_6MZCLK81U9qfYrZS2vGwVkY';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };