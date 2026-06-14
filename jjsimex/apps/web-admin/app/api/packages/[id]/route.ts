import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyAuth(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser(token);
  return user;
}

async function getUserRole(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();
  return data?.role ?? null;
}

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const user = await verifyAuth(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { data, error } = await supabase
    .from('packages')
    .select('*, users(first_name, last_name, email)')
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = await verifyAuth(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { status, tracking_step, ...rest } = body;

  // Build update payload
  const updatePayload: Record<string, unknown> = { ...rest };
  if (status) updatePayload.status = status;
  if (tracking_step) {
    // Append tracking step to existing tracking_steps array
    const { data: existing } = await supabase
      .from('packages')
      .select('tracking_steps')
      .eq('id', id)
      .single();

    const currentSteps: unknown[] = existing?.tracking_steps ?? [];
    updatePayload.tracking_steps = [
      ...currentSteps,
      { ...tracking_step, timestamp: new Date().toISOString() },
    ];
  }

  const { data, error } = await supabase
    .from('packages')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const user = await verifyAuth(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = await getUserRole(user.id);
  const adminRoles = ['admin', 'super_admin'];
  if (!role || !adminRoles.includes(role)) {
    return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 });
  }

  const { id } = await params;
  const { error } = await supabase.from('packages').delete().eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true }, { status: 200 });
}
