import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Query inventory SKUs
    const { data: skus, error } = await supabase
      .from('inventory_skus')
      .select('*');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const stockMap = {
      wristband_orange: 0,
      wristband_navy: 0,
      pettag_orange: 0,
      pettag_navy: 0,
      luggagetag_orange: 0,
      luggagetag_navy: 0,
      sticker_orange_small: 0,
      sticker_orange_large: 0,
      sticker_navy_small: 0,
      sticker_navy_large: 0
    };

    skus?.forEach(sku => {
      let key = null;
      if (sku.type === 'wristband' && sku.color === 'orange') key = 'wristband_orange';
      if (sku.type === 'wristband' && sku.color === 'navy') key = 'wristband_navy';
      if (sku.type === 'pet_tag' && sku.color === 'orange') key = 'pettag_orange';
      if (sku.type === 'pet_tag' && sku.color === 'navy') key = 'pettag_navy';
      if (sku.type === 'luggage_tag' && sku.color === 'orange') key = 'luggagetag_orange';
      if (sku.type === 'luggage_tag' && sku.color === 'navy') key = 'luggagetag_navy';
      if (sku.type === 'sticker' && sku.color === 'orange' && sku.size === '1x1') key = 'sticker_orange_small';
      if (sku.type === 'sticker' && sku.color === 'orange' && sku.size === '2x2') key = 'sticker_orange_large';
      if (sku.type === 'sticker' && sku.color === 'navy' && sku.size === '1x1') key = 'sticker_navy_small';
      if (sku.type === 'sticker' && sku.color === 'navy' && sku.size === '2x2') key = 'sticker_navy_large';

      if (key) {
        stockMap[key] = Math.max(0, sku.stock_level || 0);
      }
    });

    return NextResponse.json({ stock: stockMap, skus: skus || [] });
  } catch (err) {
    console.error('Inventory stock API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
