import Nav from '@/components/Nav';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: member } = await supabase
    .from('members')
    .select('full_name, email, role, organizations(name)')
    .eq('user_id', user.id)
    .single();

  const company = (member?.organizations as any)?.name ?? 'Workspace';
  const person = `${member?.full_name ?? user.email} · ${member?.role ?? ''}`;

  return (
    <div className="flex min-h-screen">
      <Nav company={company} person={person} />
      <main className="min-w-0 flex-1 px-5 py-8 lg:px-10 lg:py-10">{children}</main>
    </div>
  );
}
