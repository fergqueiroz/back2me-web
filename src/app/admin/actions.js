'use server';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Validates if the current caller is authorized to perform admin actions.
 * Returns { isAuthorized: true, profile: {...} } or throws.
 */
async function requireAdminAuth() {
  const supabaseAuth = await createClient();
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
  
  if (authError || !user) throw new Error('Unauthorized: No active session.');

  const { data: profile } = await supabaseAuth
    .from('profiles')
    .select('id, name, role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'support'].includes(profile.role)) {
    throw new Error('Unauthorized: Insufficient privileges.');
  }

  return profile;
}

/**
 * Logs an administrative action to the audit ledger.
 */
async function logAudit(supabase, adminId, action, targetType, targetId, metadata = {}) {
  await supabase.from('admin_audit_logs').insert({
    admin_id: adminId,
    action,
    target_type: targetType,
    target_id: targetId,
    metadata
  });
}

/**
 * Mutates basic standard customer details (Role, Phone, Plan Status).
 */
export async function updateCustomerRecord(userId, formData) {
  const supabase = createAdminClient();
  
  try {
    const adminProfile = await requireAdminAuth();
    
    // Extract update fields
    const role = formData.get('role');
    const phone = formData.get('phone');
    const plan = formData.get('plan');
    const planStatus = formData.get('plan_status');

    const updates = {};
    if (role) updates.role = role;
    if (phone !== null) updates.phone = phone || null; // allow clearing
    if (plan) updates.plan = plan;
    if (planStatus) updates.plan_status = planStatus;

    if (Object.keys(updates).length === 0) return { error: 'No fields provided to update.' };

    // Capture previous state for delta logging
    const { data: previous } = await supabase.from('profiles').select('*').eq('id', userId).single();

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;

    await logAudit(supabase, adminProfile.id, 'UPDATE_CUSTOMER', 'user', userId, {
      previous_state: { role: previous.role, phone: previous.phone, plan: previous.plan, plan_status: previous.plan_status },
      updates
    });

    revalidatePath(`/admin/users/${userId}`);
    return { success: true };

  } catch (err) {
    console.error('updateCustomerRecord error:', err);
    return { error: err.message };
  }
}

/**
 * Immediately deactivates an assigned tag back to unassigned state.
 */
export async function toggleTagStatus(tagId, currentUserId) {
  const supabase = createAdminClient();
  
  try {
    const adminProfile = await requireAdminAuth();

    // Fetch the specific tag
    const { data: tag, error: fetchError } = await supabase.from('tags').select('*').eq('id', tagId).single();
    if (fetchError || !tag) throw new Error('Tag not found.');

    const isCurrentlyActive = tag.status === 'active';
    const newStatus = isCurrentlyActive ? 'inactive' : 'active';

    const { error } = await supabase
      .from('tags')
      .update({ status: newStatus })
      .eq('id', tagId);

    if (error) throw error;

    await logAudit(supabase, adminProfile.id, isCurrentlyActive ? 'DEACTIVATE_TAG' : 'REACTIVATE_TAG', 'tag', tagId, {
      previous_status: tag.status,
      new_status: newStatus
    });

    if (currentUserId) {
      revalidatePath(`/admin/users/${currentUserId}`);
    }
    revalidatePath(`/admin/tags`);
    return { success: true };

  } catch (err) {
    console.error('toggleTagStatus error:', err);
    return { error: err.message };
  }
}

/**
 * Toggles the support_flag for a profile.
 */
export async function toggleSupportFlag(userId, currentFlag) {
  const supabase = createAdminClient();
  
  try {
    const adminProfile = await requireAdminAuth();
    const newFlag = !currentFlag;

    const { error } = await supabase
      .from('profiles')
      .update({ support_flag: newFlag })
      .eq('id', userId);

    if (error) throw error;

    await logAudit(supabase, adminProfile.id, newFlag ? 'FLAGGED_FOR_SUPPORT' : 'UNFLAGGED_SUPPORT', 'user', userId, {
      previous_flag: currentFlag,
      new_flag: newFlag
    });

    revalidatePath(`/admin/users/${userId}`);
    revalidatePath(`/admin/billing`);
    return { success: true };

  } catch (err) {
    console.error('toggleSupportFlag error:', err);
    return { error: err.message };
  }
}

/**
 * Updates the internal support notes for a profile.
 */
export async function updateSupportNotes(userId, formData) {
  const supabase = createAdminClient();
  
  try {
    const adminProfile = await requireAdminAuth();
    const notes = formData.get('support_notes');

    const { data: previous } = await supabase.from('profiles').select('support_notes').eq('id', userId).single();

    const { error } = await supabase
      .from('profiles')
      .update({ support_notes: notes })
      .eq('id', userId);

    if (error) throw error;

    if (previous?.support_notes !== notes) {
      await logAudit(supabase, adminProfile.id, 'UPDATED_SUPPORT_NOTES', 'user', userId, {
        previous_notes: previous?.support_notes,
        new_notes: notes
      });
    }

    revalidatePath(`/admin/users/${userId}`);
    return { success: true };

  } catch (err) {
    console.error('updateSupportNotes error:', err);
    return { error: err.message };
  }
}

/**
 * Adjusts inventory stock for a SKU securely with a Ledger Entry.
 */
export async function adjustInventory(skuId, changeAmount, actionType, notes) {
  const supabase = createAdminClient();
  
  try {
    const adminProfile = await requireAdminAuth();
    const qtyChange = parseInt(changeAmount, 10);
    if (!qtyChange || isNaN(qtyChange)) throw new Error("Invalid quantity change");

    // 1. Get current stock
    const { data: sku, error: skuErr } = await supabase.from('inventory_skus').select('*').eq('id', skuId).single();
    if (skuErr) throw skuErr;

    const previousStock = sku.stock_level;
    const newStock = previousStock + qtyChange;
    const previousSold = sku.sold_level;
    
    // If action is sold_deduction, we increment total sold
    const newSold = actionType === 'sold_deduction' ? previousSold + Math.abs(qtyChange) : previousSold;

    // 2. Update SKU table
    const { error: updateErr } = await supabase.from('inventory_skus').update({
      stock_level: newStock,
      sold_level: newSold,
      updated_at: new Date().toISOString()
    }).eq('id', skuId);
    
    if (updateErr) throw updateErr;

    // 3. Write Ledger Entry
    const { error: ledgerErr } = await supabase.from('inventory_ledger').insert({
      sku_id: skuId,
      admin_id: adminProfile.id,
      action_type: actionType,
      qty_change: qtyChange,
      previous_stock: previousStock,
      new_stock: newStock,
      notes: notes || ''
    });

    if (ledgerErr) throw ledgerErr;

    // 4. Audit Log
    await logAudit(supabase, adminProfile.id, 'INVENTORY_ADJUSTMENT', 'inventory_skus', skuId, {
      sku_name: sku.name,
      action_type: actionType,
      qty_change: qtyChange,
      previous_stock: previousStock,
      new_stock: newStock,
      notes: notes
    });

    revalidatePath(`/admin/inventory`);
    return { success: true };

  } catch (err) {
    console.error('adjustInventory error:', err);
    return { error: err.message };
  }
}

/**
 * Generates bulk QR codes with guaranteed 100% global uniqueness against all historical tags.
 */
export async function generateQRTags(type, quantity) {
  const supabase = createAdminClient();
  
  try {
    const adminProfile = await requireAdminAuth();
    const count = parseInt(quantity, 10);
    if (!count || count <= 0 || count > 500) {
      throw new Error("Invalid quantity. Must be between 1 and 500.");
    }

    const validTypes = ['wristband', 'luggage_tag', 'pet_tag', 'sticker'];
    if (!validTypes.includes(type)) {
      throw new Error("Invalid tag type.");
    }

    // 1. Fetch all existing qr_codes from database to ensure no collision ever occurs against historical records
    const { data: existingTags, error: fetchError } = await supabase
      .from('tags')
      .select('qr_code');

    if (fetchError) throw fetchError;

    const existingCodeSet = new Set((existingTags || []).map(t => t.qr_code));

    const newTags = [];
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';

    let attempts = 0;
    const maxAttempts = count * 200;

    while (newTags.length < count && attempts < maxAttempts) {
      attempts++;
      const lPart = Array.from({length: 3}, () => letters[Math.floor(Math.random() * letters.length)]).join('');
      const nPart = Array.from({length: 3}, () => numbers[Math.floor(Math.random() * numbers.length)]).join('');
      const candidateCode = `B2M-${lPart}${nPart}`;

      // Guarantee code has NEVER been generated before in history or in current batch
      if (!existingCodeSet.has(candidateCode)) {
        existingCodeSet.add(candidateCode); // prevent duplicates within current run & future checks
        newTags.push({
          qr_code: candidateCode,
          type: type,
          status: 'unregistered'
        });
      }
    }

    if (newTags.length < count) {
      throw new Error("Unable to generate the requested quantity of unique codes. Try again.");
    }

    const { data: insertedTags, error } = await supabase
      .from('tags')
      .insert(newTags)
      .select('id, qr_code, type, status, created_at');

    if (error) throw error;

    await logAudit(supabase, adminProfile.id, 'BULK_GENERATE_TAGS', 'tags', null, {
      type: type,
      quantity: count,
      codes_count: insertedTags.length
    });

    revalidatePath(`/admin/tags`);
    revalidatePath(`/admin/qr-generator`);
    return { success: true, tags: insertedTags };

  } catch (err) {
    console.error('generateQRTags error:', err);
    return { error: err.message };
  }
}

/**
 * Fetches historical generated QR codes for administrative tracking.
 */
export async function getQRGeneratorHistory(limit = 200) {
  const supabase = createAdminClient();
  
  try {
    await requireAdminAuth();
    const { data, error } = await supabase
      .from('tags')
      .select('id, qr_code, type, status, created_at, assigned_to')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { success: true, tags: data || [] };
  } catch (err) {
    console.error('getQRGeneratorHistory error:', err);
    return { error: err.message, tags: [] };
  }
}
