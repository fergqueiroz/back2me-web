import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const anonClient1 = createClient(supabaseUrl, supabaseKey); // Finder 1
const anonClient2 = createClient(supabaseUrl, supabaseKey); // Finder 2
const adminClient = createClient(supabaseUrl, supabaseAdminKey); // Owner / Admin proxy

async function runTest() {
  console.log("🚀 Starting E2E Chat Mechanics Test...");
  const errors = [];

  try {
    // 1. Pick a random active tag to test
    const { data: tag, error: tagErr } = await adminClient.from('tags').select('id, user_id').eq('status', 'active').limit(1).single();
    if (tagErr || !tag) throw new Error("Need at least 1 active tag to run the test.");
    const tagId = tag.id;

    console.log(`✅ Loaded target Tag ID: ${tagId}`);

    const f1Id = `e2e_f1_${Date.now()}`;
    const f2Id = `e2e_f2_${Date.now()}`;

    // 2. Finder 1 Opens Session
    await anonClient1.from('chat_sessions').insert({ tag_id: tagId, finder_session_id: f1Id, status: 'active' });
    console.log(`✅ F1: Session created`);

    // 3. Finder 1 Sends Message
    const { error: err1 } = await anonClient1.from('messages').insert({
      tag_id: tagId, sender_type: 'finder', finder_session_id: f1Id, type: 'text', content: { text: 'Hello from F1' }
    });
    if (err1) throw new Error("F1 msg insert failed: " + err1.message);
    console.log(`✅ F1: Sent message to Owner`);

    // 4. Owner Responds
    await adminClient.from('messages').insert({
      tag_id: tagId, sender_type: 'owner', finder_session_id: f1Id, type: 'text', content: { text: 'Thanks F1' }
    });
    console.log(`✅ Owner: Responded to F1`);

    // 5. Finder 2 Enters and Creates Session
    await anonClient2.from('chat_sessions').insert({ tag_id: tagId, finder_session_id: f2Id, status: 'active' });
    console.log(`✅ F2: Session created (Isolating state)`);

    // 6. Finder 2 Sends Message
    await anonClient2.from('messages').insert({
      tag_id: tagId, sender_type: 'finder', finder_session_id: f2Id, type: 'text', content: { text: 'Hello from F2' }
    });
    console.log(`✅ F2: Sent message to Owner in separate thread`);

    // 7. Owner Verifies Separate Threads
    const { data: msgsF1 } = await adminClient.from('messages').select('id').eq('tag_id', tagId).eq('finder_session_id', f1Id);
    const { data: msgsF2 } = await adminClient.from('messages').select('id').eq('tag_id', tagId).eq('finder_session_id', f2Id);
    if (msgsF1.length !== 2 || msgsF2.length !== 1) throw new Error("Owner unable to isolate threads.");
    console.log(`✅ Owner: Threads correctly isolated (F1 msgs: ${msgsF1.length}, F2 msgs: ${msgsF2.length})`);

    // 8. Owner Blocks Finder 1
    await adminClient.from('chat_sessions').update({ status: 'closed' }).eq('tag_id', tagId).eq('finder_session_id', f1Id);
    console.log(`✅ Owner: Blocked/Closed Finder 1's conversation`);

    // 9. Finder 1 tries to send after being blocked
    const { error: errBlock } = await anonClient1.from('messages').insert({
      tag_id: tagId, sender_type: 'finder', finder_session_id: f1Id, type: 'text', content: { text: 'Should fail' }
    });
    if (!errBlock) {
      throw new Error("Critical Vulnerability: Finder 1 bypassed block and inserted message.");
    }
    console.log(`✅ F1: Successfully blocked from sending messages (RLS Error: ${errBlock.message})`);

    // 10. Finder 2 tries to send (should still work)
    const { error: errF2Alive } = await anonClient2.from('messages').insert({
      tag_id: tagId, sender_type: 'finder', finder_session_id: f2Id, type: 'text', content: { text: 'Still here' }
    });
    if (errF2Alive) throw new Error("Finder 2 was accidentally blocked when Finder 1 was blocked!");
    console.log(`✅ F2: Thread remains perfectly active and isolated`);

  } catch(e) {
    console.error("❌ Test failed:", e.message);
    errors.push(e);
  }

  if (errors.length > 0) {
    console.log("\n❌ END-TO-END TEST FAILED.");
    process.exit(1);
  } else {
    console.log("\n🎉 ALL E2E BACKEND SECURITY AND ROUTING ASSERTIONS PASSED!");
  }
}

runTest();
