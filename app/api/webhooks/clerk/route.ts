import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { headers } from 'next/headers';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Webhook 시크릿 키 확인
const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(req: Request) {
  // Webhook 요청이 유효한지 확인
  if (!webhookSecret) {
    console.error('CLERK_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }
  
  // 요청 헤더와 본문 추출
  const headersList = await headers();
  const svix_id = headersList.get('svix-id');
  const svix_timestamp = headersList.get('svix-timestamp');
  const svix_signature = headersList.get('svix-signature');
  
  // 필수 헤더 확인
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }
  
  // 요청 본문을 텍스트로 가져오기
  const payload = await req.text();
  
  // Svix 웹훅 인스턴스 생성 및 서명 확인
  let event: WebhookEvent;
  try {
    const webhook = new Webhook(webhookSecret);
    event = webhook.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (error) {
    console.error('Error verifying webhook:', error);
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }
  
  // 이벤트 유형 확인 및 처리
  const eventType = event.type;
  console.log(`Webhook 이벤트 수신: ${eventType}`);
  
  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, username, first_name, last_name } = event.data;
    
    try {
      // 사용자가 이미 존재하는지 확인
      const existingUser = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, id))
        .then(res => res[0]);
      
      const userData = {
        id,
        username: username || first_name || `user_${id.substring(0, 8)}`,
        email: email_addresses?.[0]?.email_address || 'unknown@example.com',
        nickname: `${first_name || ''} ${last_name || ''}`.trim() || `사용자_${id.substring(0, 5)}`
      };
      
      if (existingUser) {
        // 기존 사용자 업데이트
        await db
          .update(users)
          .set(userData)
          .where(eq(users.id, id));
        
        console.log('사용자 정보 업데이트:', id);
      } else {
        // 새 사용자 추가
        await db
          .insert(users)
          .values(userData);
        
        console.log('새 사용자 추가:', id);
      }
      
      return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
      console.error('사용자 DB 처리 오류:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
  }
  
  // 다른 이벤트 유형에 대한 기본 응답
  return NextResponse.json({ success: true, message: 'Webhook processed' }, { status: 200 });
} 