import Nav from '@/components/Nav';
import { requireMember } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const member = await requireMember();

  const company = member.company ?? 'Workspace';
  const person = `${member.fullName ?? member.email} · ${member.role}`;

  return (
    <div className="flex min-h-screen">
      <Nav company={company} person={person} />
      <main className="min-w-0 flex-1 px-5 py-8 lg:px-10 lg:py-10">{children}</main>
    </div>
  );
}
