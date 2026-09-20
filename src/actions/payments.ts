'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function verifyAndJoinPaidRoom(roomId: string, reference: string, userId: string) {
    if (!reference || !roomId || !userId) {
        return { success: false, error: 'Missing required parameters.' };
    }

    try {
        // 1. Verify with Paystack API
        const paystackRes = await fetch(https://api.paystack.co/transaction/verify/ + reference, {
            headers: {
                Authorization: Bearer 
            }
        });
        const paystackData = await paystackRes.json();

        if (!paystackData.status || paystackData.data.status !== 'success') {
            return { success: false, error: 'Payment verification failed.' };
        }

        const amountPaid = paystackData.data.amount / 100; // Paystack returns amount in pesewas

        // 2. Verify Room Price
        const { data: room } = await supabase
            .from('rooms')
            .select('price')
            .eq('room_id', roomId)
            .single();

        if (!room) {
            return { success: false, error: 'Room not found.' };
        }

        if (amountPaid < room.price) {
            return { success: false, error: 'Insufficient payment amount.' };
        }

        // 3. Record Transaction (Requires the schema update eference text UNIQUE)
        const { error: txError } = await supabase
            .from('transactions')
            .insert({
                room_id: roomId,
                user_id: userId,
                amount: amountPaid,
                commission: amountPaid * 0.1, // 10% platform fee
                status: 'paid',
                reference: reference
            });

        if (txError) {
            // If error is unique violation, payment was already processed
            if (txError.code === '23505') {
                 return { success: false, error: 'This payment was already processed.' };
            }
            console.error("Transaction Error:", txError);
            return { success: false, error: 'Failed to record transaction.' };
        }

        // 4. Add User to Room
        const { data: joinData, error: joinError } = await supabase.rpc('join_room_atomic', {
            p_room_id: roomId,
            p_user_id: userId
        });

        if (joinError || (joinData && !joinData.success)) {
            console.error("Join Room Error:", joinError || joinData?.error);
            return { success: false, error: joinData?.error || 'Failed to join room after payment.' };
        }

        revalidatePath(/room/ + roomId);
        return { success: true };

    } catch (error: any) {
        console.error("Payment verification error:", error);
        return { success: false, error: error.message || 'An error occurred during verification.' };
    }
}